import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { parseCustomId, buildPrompt, getMonthTheme } from '@/scripts/batch-utils'
import type { BatchRequest } from '@/scripts/batch-utils'

export async function POST(request: Request) {
  try {
    const batchId = new URL(request.url).searchParams.get('batchId')
    if (!batchId) {
      return NextResponse.json({ success: false, error: 'Missing batchId' }, { status: 400 })
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY not configured in Vercel env' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Get original batch record
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, anthropic_batch_id, batch_month')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 })
    }

    // 2. Stream Anthropic results to collect errored custom_ids
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const erroredIds: string[] = []

    for await (const result of await anthropic.beta.messages.batches.results(
      batch.anthropic_batch_id
    )) {
      if (result.result.type === 'errored') {
        erroredIds.push(result.custom_id)
      }
    }

    if (erroredIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No errored requests found in this batch' },
        { status: 400 }
      )
    }

    // 3. Reconstruct requests from custom_ids
    const monthTheme = getMonthTheme(batch.batch_month)
    const requests: BatchRequest[] = erroredIds.map((customId) => {
      const { sign, role, date } = parseCustomId(customId)
      return {
        custom_id: customId,
        params: {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: buildPrompt(sign, role, date, monthTheme) }],
        },
      }
    })

    // 4. Submit retry batch to Anthropic
    const retryBatch = await anthropic.beta.messages.batches.create({ requests })

    // 5. Insert retry record in DB
    const { error: insertError } = await supabase.from('batches').insert({
      anthropic_batch_id: retryBatch.id,
      batch_month: batch.batch_month,
      status: 'submitted',
      total_requests: requests.length,
      is_retry: true,
      parent_batch_id: batch.id,
    })

    if (insertError) {
      console.error('[api/admin/batches/retry] DB insert failed:', insertError.message)
      return NextResponse.json(
        { success: false, error: 'Retry batch submitted to Anthropic but failed to record in DB' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Retry failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
