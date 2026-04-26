import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { SIGNS, ROLES } from '@/lib/constants'
import { createClient } from '@/lib/supabase-server'
import {
  buildCustomId,
  buildPrompt,
  getMonthTheme,
  type BatchRequest,
} from '@/scripts/batch-utils'

export function getNextMonth(): string {
  const now = new Date()
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

export async function runBatchSubmit(batchMonth: string): Promise<void> {
  if (!/^\d{4}-\d{2}$/.test(batchMonth)) {
    throw new Error(`runBatchSubmit: invalid batch_month "${batchMonth}" (expected YYYY-MM)`)
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('Missing required environment variable: ANTHROPIC_API_KEY')

  const supabase = await createClient()

  const { data: existing, error: checkError } = await supabase
    .from('batches')
    .select('id, anthropic_batch_id')
    .eq('batch_month', batchMonth)
    .neq('status', 'errored')
    .limit(1)

  if (checkError) {
    throw new Error(`Failed to check existing batches: ${checkError.message}`)
  }

  if (existing && existing.length > 0) {
    console.log(
      `[batch-submit] Batch already exists for ${batchMonth} (anthropic_batch_id=${existing[0].anthropic_batch_id}) — skipping`
    )
    return
  }

  const monthTheme = getMonthTheme(batchMonth)
  console.log(`[batch-submit] Target month: ${batchMonth}`)
  console.log(`[batch-submit] Month theme: ${monthTheme.slice(0, 80)}...`)

  const dates = getDatesInMonth(batchMonth)
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

  console.log(
    `[batch-submit] Built ${requests.length} requests (${SIGNS.length} signs × ${ROLES.length} roles × ${dates.length} days)`
  )

  const anthropic = new Anthropic({ apiKey: anthropicKey })
  console.log('[batch-submit] Submitting batch...')
  const batch = await anthropic.beta.messages.batches.create({ requests })
  console.log(`[batch-submit] Batch submitted. anthropic_batch_id=${batch.id}`)

  const { error: insertError } = await supabase.from('batches').insert({
    anthropic_batch_id: batch.id,
    batch_month: batchMonth,
    status: 'submitted',
    total_requests: requests.length,
    is_retry: false,
  })

  if (insertError) {
    throw new Error(`Failed to insert batch record: ${insertError.message}`)
  }

  console.log(`[batch-submit] Done. batch_month=${batchMonth} total_requests=${requests.length}`)
}
