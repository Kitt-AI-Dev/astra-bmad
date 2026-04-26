import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { SIGNS, ROLES } from '../lib/constants'
import { buildCustomId, buildPrompt, requireEnv, getMonthTheme, type BatchRequest } from './batch-utils'

// ---------------------------------------------------------------------------
// Month helpers
// ---------------------------------------------------------------------------

function getTargetMonth(input: string | undefined): string {
  if (input && /^\d{4}-\d{2}$/.test(input)) return input
  const now = new Date()
  // new Date(year, month + 1, 1) handles December → January year rollover
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toISOString().slice(0, 7)
}

function getDatesInMonth(batchMonth: string): string[] {
  const [year, month] = batchMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, i + 1))
    return d.toISOString().slice(0, 10)
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const batchMonth = getTargetMonth(process.env.BATCH_MONTH ?? process.argv[2])
  const monthTheme = getMonthTheme(batchMonth)

  console.log(`[submit-batch] Target month: ${batchMonth}`)
  console.log(`[submit-batch] Month theme: ${monthTheme.slice(0, 80)}...`)

  const dates = getDatesInMonth(batchMonth)

  // Build all requests: sign × role × date
  const requests: BatchRequest[] = []
  for (const sign of SIGNS) {
    for (const role of ROLES) {
      for (const date of dates) {
        requests.push({
          custom_id: buildCustomId(sign, role, date),
          params: {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            messages: [{ role: 'user', content: buildPrompt(sign, role, date, monthTheme) }],
          },
        })
      }
    }
  }

  console.log(`[submit-batch] Built ${requests.length} requests (${SIGNS.length} signs × ${ROLES.length} roles × ${dates.length} days)`)

  // Validate Supabase credentials and check idempotency before calling Anthropic
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { data: existing, error: checkError } = await supabase
    .from('batches')
    .select('id, anthropic_batch_id')
    .eq('batch_month', batchMonth)
    .neq('status', 'errored')
    .limit(1)

  if (checkError) {
    console.error('[submit-batch] Failed to check existing batches:', checkError)
    process.exit(1)
  }

  if (existing && existing.length > 0) {
    console.log(`[submit-batch] Batch already exists for ${batchMonth} (anthropic_batch_id=${existing[0].anthropic_batch_id}). Exiting without resubmitting.`)
    process.exit(0)
  }

  // Submit to Anthropic Batch API
  const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') })

  console.log('[submit-batch] Submitting batch...')
  const batch = await anthropic.beta.messages.batches.create({ requests })
  console.log(`[submit-batch] Batch submitted. anthropic_batch_id=${batch.id}`)

  const { error } = await supabase.from('batches').insert({
    anthropic_batch_id: batch.id,
    batch_month: batchMonth,
    status: 'submitted',
    total_requests: requests.length,
    is_retry: false,
  })

  if (error) {
    console.error('[submit-batch] Failed to insert batch record:', error)
    process.exit(1)
  }

  console.log(`[submit-batch] Done. batch_month=${batchMonth} total_requests=${requests.length}`)
}

main().catch((err) => {
  console.error('[submit-batch] Fatal error:', err)
  process.exit(1)
})
