import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  parseCustomId,
  buildCustomId,
  buildPrompt,
  getMonthTheme,
  requireEnv,
  type BatchRequest,
} from './batch-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BatchRow = {
  id: string
  anthropic_batch_id: string
  batch_month: string
  status: string
  total_requests: number
  succeeded: number
  errored: number
  is_retry: boolean
  parent_batch_id: string | null
}

type ReadingRow = {
  sign: string
  role: string
  date: string
  content: string
  batch_month: string
}

// ---------------------------------------------------------------------------
// Deadline helper
// ---------------------------------------------------------------------------

function isDeadlineAtRisk(batchMonth: string, erroredCount: number): boolean {
  if (erroredCount === 0) return false
  const [year, month] = batchMonth.split('-').map(Number)
  const deadline = new Date(Date.UTC(year, month - 1, 28))
  return new Date() > deadline
}

// ---------------------------------------------------------------------------
// Email notification
// ---------------------------------------------------------------------------

async function sendNotification({
  totalSucceeded,
  totalErrored,
  retrySubmitted,
  processedCount,
  batchMonths,
}: {
  totalSucceeded: number
  totalErrored: number
  retrySubmitted: boolean
  processedCount: number
  batchMonths: string[]
}) {
  const resend = new Resend(requireEnv('RESEND_API_KEY'))
  const adminEmail = requireEnv('ADMIN_EMAIL')
  const monthLabel = batchMonths.length > 0 ? batchMonths.join(', ') : 'none'
  const atRisk = batchMonths.some((m) => isDeadlineAtRisk(m, totalErrored))
  const deadlineWarning = atRisk
    ? '\n⚠️ WARNING: 28th deadline has passed. Some readings may be missing.'
    : '\nDeadline OK.'

  const subject = `404tune batch retrieve: ${monthLabel} — ${totalSucceeded} ok, ${totalErrored} errored${retrySubmitted ? ', retry submitted' : ''}`
  const text = `Batch retrieve run: ${new Date().toISOString()}

Batches processed: ${processedCount}
Readings inserted: ${totalSucceeded}
Errored requests:  ${totalErrored}
Retry submitted:   ${retrySubmitted ? 'Yes' : 'No'}
${deadlineWarning}`

  const { error } = await resend.emails.send({
    from: 'noreply@404tune.app',
    to: adminEmail,
    subject,
    text,
  })

  if (error) {
    console.error('[retrieve-batch] Failed to send notification email:', error)
  } else {
    console.log('[retrieve-batch] Notification email sent to', adminEmail)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') })
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )

  // 1. Load all submitted batches
  const { data: pendingBatches, error: loadErr } = await supabase
    .from('batches')
    .select('*')
    .eq('status', 'submitted')

  if (loadErr) {
    console.error('[retrieve-batch] Failed to load batches:', loadErr)
    process.exit(1)
  }

  const batches = (pendingBatches ?? []) as BatchRow[]
  console.log(`[retrieve-batch] Found ${batches.length} pending batch(es)`)

  if (batches.length === 0) {
    console.log('[retrieve-batch] No pending batches — sending notification and exiting.')
    await sendNotification({
      totalSucceeded: 0,
      totalErrored: 0,
      retrySubmitted: false,
      processedCount: 0,
      batchMonths: [],
    })
    return
  }

  let totalSucceeded = 0
  let totalErrored = 0
  let retrySubmitted = false
  let processedCount = 0
  const batchMonths: string[] = []

  for (const batch of batches) {
    console.log(`[retrieve-batch] Checking batch ${batch.anthropic_batch_id} (month=${batch.batch_month})`)

    // 2. Check Anthropic processing status
    const apiBatch = await anthropic.beta.messages.batches.retrieve(batch.anthropic_batch_id)
    if (apiBatch.processing_status !== 'ended') {
      console.log(`[retrieve-batch] Batch ${batch.anthropic_batch_id} status=${apiBatch.processing_status} — skipping`)
      continue
    }

    // 3. Stream results — NEVER abort mid-loop
    const readings: ReadingRow[] = []
    const errorIds: string[] = []

    for await (const result of await anthropic.beta.messages.batches.results(batch.anthropic_batch_id)) {
      if (result.result.type === 'succeeded') {
        const { sign, role, date } = parseCustomId(result.custom_id)
        const contentBlock = result.result.message.content[0]
        if (contentBlock?.type === 'text') {
          readings.push({ sign, role, date, content: contentBlock.text, batch_month: batch.batch_month })
        } else {
          // Succeeded but no text block — treat as error so it gets retried
          errorIds.push(result.custom_id)
          console.error(`[retrieve-batch] succeeded but no text content: ${result.custom_id}`)
        }
      } else {
        errorIds.push(result.custom_id)
        console.error(`[retrieve-batch] failed: ${result.custom_id} type=${result.result.type}`)
      }
    }

    console.log(`[retrieve-batch] Batch ${batch.anthropic_batch_id}: ${readings.length} succeeded, ${errorIds.length} errored`)

    // 4. Bulk upsert readings (ON CONFLICT DO NOTHING — idempotent re-runs)
    if (readings.length > 0) {
      const { error: insertErr } = await supabase.from('readings').upsert(readings, {
        onConflict: 'sign,role,date',
        ignoreDuplicates: true,
      })
      if (insertErr) {
        console.error('[retrieve-batch] readings upsert error:', insertErr)
      }
    }

    totalSucceeded += readings.length
    totalErrored += errorIds.length
    if (!batchMonths.includes(batch.batch_month)) batchMonths.push(batch.batch_month)

    // 5. Submit retry batch BEFORE updating status — if retry fails, batch stays 'submitted' and
    // the next retrieve run will re-attempt rather than permanently losing the error IDs.
    if (errorIds.length > 0) {
      const monthTheme = getMonthTheme(batch.batch_month)
      const retryRequests: BatchRequest[] = []
      for (const customId of errorIds) {
        try {
          const { sign, role, date } = parseCustomId(customId)
          retryRequests.push({
            custom_id: buildCustomId(sign, role, date),
            params: {
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 300,
              messages: [{ role: 'user', content: buildPrompt(sign, role, date, monthTheme) }],
            },
          })
        } catch (parseErr) {
          console.error(`[retrieve-batch] Could not rebuild prompt for malformed custom_id "${customId}":`, parseErr)
        }
      }

      if (retryRequests.length > 0) {
        const retryBatch = await anthropic.beta.messages.batches.create({ requests: retryRequests })

        const { error: retryInsertErr } = await supabase.from('batches').insert({
          anthropic_batch_id: retryBatch.id,
          batch_month: batch.batch_month,
          status: 'submitted',
          total_requests: retryRequests.length,
          is_retry: true,
          parent_batch_id: batch.id,
        })

        if (retryInsertErr) {
          console.error('[retrieve-batch] Failed to insert retry batch record:', retryInsertErr)
        } else {
          retrySubmitted = true
          console.log(`[retrieve-batch] Retry batch submitted: ${retryBatch.id} (${retryRequests.length} requests)`)
        }
      }
    }

    // 6. Update batch to processed — done after retry so errors are never orphaned if retry fails
    const { error: updateErr } = await supabase
      .from('batches')
      .update({
        status: 'processed',
        succeeded: readings.length,
        errored: errorIds.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    if (updateErr) {
      console.error(`[retrieve-batch] Failed to update batch ${batch.id}:`, updateErr)
    }

    processedCount++
  }

  console.log(`[retrieve-batch] Done. processed=${processedCount} succeeded=${totalSucceeded} errored=${totalErrored} retrySubmitted=${retrySubmitted}`)

  // 7. Send notification email
  await sendNotification({ totalSucceeded, totalErrored, retrySubmitted, processedCount, batchMonths })
}

main().catch((err) => {
  console.error('[retrieve-batch] Fatal error:', err)
  process.exit(1)
})
