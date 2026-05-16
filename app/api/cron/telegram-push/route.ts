import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTelegramMessage } from '@/lib/telegram'
import { shouldDeactivateTelegramSubscriber } from '@/lib/telegram-push'
import { stripJsonFence } from '@/lib/content'

export const maxDuration = 60

type Subscriber = {
  chat_id: number
  sign: string
  role: string
  timezone_offset: number
}

type ReadingContent = {
  general_reading?: string
  [key: string]: unknown
}

function extractGeneralReading(rawContent: string): string | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawContent)) as ReadingContent
    return typeof parsed.general_reading === 'string' ? parsed.general_reading.trim() : null
  } catch {
    return null
  }
}

function buildMessage(
  subscriber: Subscriber,
  prose: string | null,
  today: string,
  baseUrl: string
): string {
  const { sign, role } = subscriber
  const displaySign = sign.charAt(0).toUpperCase() + sign.slice(1)
  const displayRole = role
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const header = `<b>// 404tune — ${displaySign} × ${displayRole} · ${today}</b>`

  if (!prose) {
    return `${header}\n\n// no reading available today — check back tomorrow.`
  }

  // Telegram auto-renders an OG link preview for the URL on its own line.
  // The dated URL is used so the message stays valid if opened later.
  const url = `${baseUrl}/${sign}/${role}/${today}`
  let msg = `${header}\n\n${prose}\n\n${url}`

  // Hard cap at Telegram's 4096-char limit (very unlikely to hit with prose).
  if (msg.length > 4096) {
    const overhead = msg.length - prose.length
    const room = 4096 - overhead - 1
    msg = `${header}\n\n${prose.slice(0, room)}…\n\n${url}`
  }
  return msg
}

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

      const prose = reading ? extractGeneralReading(reading.content) : null
      if (reading && prose === null) {
        console.error(
          `[telegram-push] failed to extract general_reading for ${subscriber.sign}/${subscriber.role}`
        )
      }

      const msg = buildMessage(subscriber, prose, today, baseUrl)

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
