import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTelegramMessage } from '@/lib/telegram'
import { shouldDeactivateTelegramSubscriber } from '@/lib/telegram-push'
import { parseReading, buildMessage, type Subscriber } from '@/lib/telegram-push-message'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const currentHour = new Date().getUTCHours()
  const targetOffset = 480 - currentHour * 60
  const today = new Date().toISOString().slice(0, 10)

  const supabase = await createClient()

  const { data: subscribers, error: subError } = await supabase
    .from('telegram_subscribers')
    .select('chat_id, sign, role, timezone_offset')
    .eq('active', true)
    .eq('timezone_offset', targetOffset)

  if (subError) {
    console.error('[telegram-push] failed to fetch subscribers:', subError.message)
    return NextResponse.json({ success: false, error: 'DB query failed' }, { status: 500 })
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  let sent = 0

  for (const subscriber of subscribers as Subscriber[]) {
    try {
      const { data: reading } = await supabase
        .from('readings')
        .select('content')
        .eq('sign', subscriber.sign)
        .eq('role', subscriber.role)
        .eq('date', today)
        .eq('suppressed', false)
        .maybeSingle()

      const { prose, hasMetrics } = reading
        ? parseReading(reading.content)
        : { prose: null, hasMetrics: false }
      if (reading && prose === null) {
        console.error(
          `[telegram-push] failed to extract general_reading for ${subscriber.sign}/${subscriber.role}`
        )
      }

      const msg = buildMessage(subscriber, prose, hasMetrics, today, baseUrl)

      const res = await sendTelegramMessage(subscriber.chat_id, msg)

      if (!res.ok) {
        try {
          const errBody = (await res.json()) as { error_code?: number; description?: string }
          console.error(
            `[telegram-push] Telegram API error for chat_id=${subscriber.chat_id}: ${errBody.error_code} ${errBody.description}`
          )
        } catch {
          console.error(
            `[telegram-push] Telegram API non-OK for chat_id=${subscriber.chat_id}: HTTP ${res.status}`
          )
        }

        if (shouldDeactivateTelegramSubscriber(res.status)) {
          await supabase
            .from('telegram_subscribers')
            .update({ active: false })
            .eq('chat_id', subscriber.chat_id)
        }
      } else {
        sent++
      }
    } catch (err) {
      console.error(
        `[telegram-push] unexpected error for chat_id=${subscriber.chat_id}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  return NextResponse.json({ success: true, sent })
}
