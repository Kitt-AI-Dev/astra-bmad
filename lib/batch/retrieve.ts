import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import {
  parseCustomId,
  parseTeamCustomId,
  buildCustomId,
  buildTeamCustomId,
  buildPrompt,
  buildTeamPrompt,
  getMonthTheme,
  type BatchRequest,
  type TeamReadingRow,
} from '@/scripts/batch-utils'

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

function isDeadlineAtRisk(batchMonth: string, erroredCount: number): boolean {
  if (erroredCount === 0) return false
  const [year, month] = batchMonth.split('-').map(Number)
  const deadline = new Date(Date.UTC(year, month - 1, 28))
  return new Date() > deadline
}

async function sendNotification({
  totalSucceeded,
  totalErrored,
  retrySubmitted,
  processedCount,
  batchMonths,
  perMonthErrors,
}: {
  totalSucceeded: number
  totalErrored: number
  retrySubmitted: boolean
  processedCount: number
  batchMonths: string[]
  perMonthErrors: Record<string, number>
}) {
  const resendKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (!resendKey) throw new Error('Missing required environment variable: RESEND_API_KEY')
  if (!adminEmail) throw new Error('Missing required environment variable: ADMIN_EMAIL')

  const resend = new Resend(resendKey)
  const monthLabel = batchMonths.length > 0 ? batchMonths.join(', ') : 'none'
  const atRisk = batchMonths.some((m) => isDeadlineAtRisk(m, perMonthErrors[m] ?? 0))
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
    console.error('[batch-retrieve] Failed to send notification email:', error)
  } else {
    console.log('[batch-retrieve] Notification email sent to', adminEmail)
  }
}

export async function runBatchRetrieve(): Promise<void> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('Missing required environment variable: ANTHROPIC_API_KEY')

  const anthropic = new Anthropic({ apiKey: anthropicKey })
  const supabase = await createClient()

  const { data: pendingBatches, error: loadErr } = await supabase
    .from('batches')
    .select('*')
    .eq('status', 'submitted')

  if (loadErr) {
    throw new Error(`Failed to load batches: ${loadErr.message}`)
  }

  const batches = (pendingBatches ?? []) as BatchRow[]
  console.log(`[batch-retrieve] Found ${batches.length} pending batch(es)`)

  if (batches.length === 0) {
    console.log('[batch-retrieve] No pending batches — exiting.')
    return
  }

  let totalSucceeded = 0
  let totalErrored = 0
  let retrySubmitted = false
  let processedCount = 0
  const batchMonths: string[] = []
  const perMonthErrors: Record<string, number> = {}

  for (const batch of batches) {
    console.log(
      `[batch-retrieve] Checking batch ${batch.anthropic_batch_id} (month=${batch.batch_month})`
    )

    const apiBatch = await anthropic.beta.messages.batches.retrieve(batch.anthropic_batch_id)
    if (apiBatch.processing_status !== 'ended') {
      console.log(
        `[batch-retrieve] Batch ${batch.anthropic_batch_id} status=${apiBatch.processing_status} — skipping`
      )
      continue
    }

    const readings: ReadingRow[] = []
    const teamReadings: TeamReadingRow[] = []
    const errorIds: string[] = []

    for await (const result of await anthropic.beta.messages.batches.results(
      batch.anthropic_batch_id
    )) {
      if (result.result.type === 'succeeded') {
        const contentBlock = result.result.message.content[0]

        if (result.custom_id.startsWith('team-')) {
          const { date, slot } = parseTeamCustomId(result.custom_id)
          if (contentBlock?.type === 'text') {
            teamReadings.push({ date, slot, content: contentBlock.text, batch_id: batch.id })
          } else {
            errorIds.push(result.custom_id)
            console.error(`[batch-retrieve] team reading succeeded but no text: ${result.custom_id}`)
          }
        } else {
          const { sign, role, date } = parseCustomId(result.custom_id)
          if (contentBlock?.type === 'text') {
            readings.push({
              sign,
              role,
              date,
              content: contentBlock.text,
              batch_month: batch.batch_month,
            })
          } else {
            errorIds.push(result.custom_id)
            console.error(
              `[batch-retrieve] succeeded but no text content: ${result.custom_id}`
            )
          }
        }
      } else {
        errorIds.push(result.custom_id)
        console.error(
          `[batch-retrieve] failed: ${result.custom_id} type=${result.result.type}`
        )
      }
    }

    console.log(
      `[batch-retrieve] Batch ${batch.anthropic_batch_id}: ${readings.length + teamReadings.length} succeeded (${readings.length} individual, ${teamReadings.length} team), ${errorIds.length} errored`
    )

    if (readings.length > 0) {
      const { error: insertErr } = await supabase.from('readings').upsert(readings, {
        onConflict: 'sign,role,date',
        ignoreDuplicates: true,
      })
      if (insertErr) {
        throw new Error(
          `Failed to upsert readings for batch ${batch.anthropic_batch_id}: ${insertErr.message}`
        )
      }

      const affected = new Set<string>()
      for (const r of readings) affected.add(`${r.sign}/${r.role}`)
      for (const path of affected) revalidatePath(`/${path}`)
      for (const r of readings) revalidatePath(`/${r.sign}/${r.role}/${r.date}`)
    }

    if (teamReadings.length > 0) {
      const { error: teamInsertErr } = await supabase.from('team_readings').upsert(teamReadings, {
        onConflict: 'date,slot',
      })
      if (teamInsertErr) {
        throw new Error(
          `Failed to upsert team_readings for batch ${batch.anthropic_batch_id}: ${teamInsertErr.message}`
        )
      }
      console.log(`[batch-retrieve] Upserted ${teamReadings.length} team readings`)
      // No revalidatePath — new rows have no cached page entries yet
    }

    totalSucceeded += readings.length + teamReadings.length
    totalErrored += errorIds.length
    if (!batchMonths.includes(batch.batch_month)) batchMonths.push(batch.batch_month)
    perMonthErrors[batch.batch_month] = (perMonthErrors[batch.batch_month] ?? 0) + errorIds.length

    if (errorIds.length > 0) {
      const monthTheme = getMonthTheme(batch.batch_month)
      const retryRequests: BatchRequest[] = []
      for (const customId of errorIds) {
        try {
          if (customId.startsWith('team-')) {
            const { date, slot } = parseTeamCustomId(customId)
            retryRequests.push({
              custom_id: buildTeamCustomId(date, slot),
              params: {
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 500,
                messages: [{ role: 'user', content: buildTeamPrompt(date, slot, monthTheme) }],
              },
            })
          } else {
            const { sign, role, date } = parseCustomId(customId)
            retryRequests.push({
              custom_id: buildCustomId(sign, role, date),
              params: {
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 300,
                messages: [{ role: 'user', content: buildPrompt(sign, role, date, monthTheme) }],
              },
            })
          }
        } catch (parseErr) {
          console.error(
            `[batch-retrieve] Could not rebuild prompt for malformed custom_id "${customId}":`,
            parseErr
          )
        }
      }

      if (retryRequests.length > 0) {
        const retryBatch = await anthropic.beta.messages.batches.create({
          requests: retryRequests,
        })

        const { error: retryInsertErr } = await supabase.from('batches').insert({
          anthropic_batch_id: retryBatch.id,
          batch_month: batch.batch_month,
          status: 'submitted',
          total_requests: retryRequests.length,
          is_retry: true,
          parent_batch_id: batch.id,
        })

        if (retryInsertErr) {
          console.error('[batch-retrieve] Failed to insert retry batch record:', retryInsertErr)
        } else {
          retrySubmitted = true
          console.log(
            `[batch-retrieve] Retry batch submitted: ${retryBatch.id} (${retryRequests.length} requests)`
          )
        }
      }
    }

    const { error: updateErr } = await supabase
      .from('batches')
      .update({
        status: 'processed',
        succeeded: readings.length + teamReadings.length,
        errored: errorIds.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    if (updateErr) {
      console.error(`[batch-retrieve] Failed to update batch ${batch.id}:`, updateErr)
    }

    processedCount++
  }

  console.log(
    `[batch-retrieve] Done. processed=${processedCount} succeeded=${totalSucceeded} errored=${totalErrored} retrySubmitted=${retrySubmitted}`
  )

  await sendNotification({
    totalSucceeded,
    totalErrored,
    retrySubmitted,
    processedCount,
    batchMonths,
    perMonthErrors,
  })
}
