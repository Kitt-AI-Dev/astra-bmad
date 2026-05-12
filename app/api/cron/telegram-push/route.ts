import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { TEAM_ARCHETYPES } from '@/lib/constants'
import { sendTelegramMessage } from '@/lib/telegram'
import { shouldDeactivateTelegramSubscriber } from '@/lib/telegram-push'

export const maxDuration = 60

type Subscriber = {
  chat_id: number
  sign: string
  role: string
  timezone_offset: number
}

type ReadingContent = {
  general_reading: string
  lucky_number: string | number
  avoid: string
  planetary_influence: string
}

type TeamContent = {
  general_reading: string
  [key: string]: unknown
}

function buildMessage(
  subscriber: Subscriber,
  reading: { content: string } | null,
  teamReading: { content: string; slot: number } | null,
  today: string
): string {
  const { sign, role } = subscriber
  const displaySign = sign.charAt(0).toUpperCase() + sign.slice(1)
  const displayRole = role
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  let msg = `<b>🔭 404tune — ${today}</b>\n\n`

  if (reading) {
    let content: ReadingContent | null = null
    try {
      content = JSON.parse(reading.content) as ReadingContent
    } catch {
      console.error(`[telegram-push] failed to parse reading content for ${sign}/${role}`)
    }

    if (content) {
      msg += `<b>${displaySign} × ${displayRole}</b>\n`
      msg += `${content.general_reading}\n\n`
      msg += `<b>Lucky number:</b> ${content.lucky_number}  <b>Avoid:</b> ${content.avoid}\n`
      msg += `<i>${content.planetary_influence}</i>\n`
    } else {
      msg += `<b>${displaySign} × ${displayRole}</b>\n`
      msg += `<i>// no reading available today</i>\n`
    }
  } else {
    msg += `<b>${displaySign} × ${displayRole}</b>\n`
    msg += `<i>// no reading available today</i>\n`
  }

  if (teamReading) {
    const archetype = TEAM_ARCHETYPES[teamReading.slot] ?? `Slot ${teamReading.slot}`
    let tc: TeamContent | null = null
    try {
      tc = JSON.parse(teamReading.content) as TeamContent
    } catch {
      console.error(`[telegram-push] failed to parse team reading content for slot ${teamReading.slot}`)
    }
    if (tc) {
      msg += `\n<b>🏷️ Team — ${archetype}</b>\n`
      msg += `${tc.general_reading}\n`
    }
  }

  if (msg.length > 4096) {
    msg = msg.slice(0, 4093) + '...'
  }

  return msg
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
        .single()

      // Deterministic team slot — stable per user across all days
      const slot = Number(BigInt(subscriber.chat_id) % BigInt(12)) + 1

      const { data: teamReading } = await supabase
        .from('team_readings')
        .select('content, slot')
        .eq('date', today)
        .eq('slot', slot)
        .eq('suppressed', false)
        .single()

      const msg = buildMessage(subscriber, reading ?? null, teamReading ?? null, today)

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
