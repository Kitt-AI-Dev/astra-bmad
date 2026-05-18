import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTelegramMessage } from '@/lib/telegram'
import { shouldDeactivateTelegramSubscriber } from '@/lib/telegram-push'
import { parseReading, buildMessage, type Subscriber } from '@/lib/telegram-push-message'
import { computeTargetOffsets, subscriberLocalDate } from '@/lib/telegram-push-cohort'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Capture one time source for the whole run. `currentHour` and every
  // subscriber's `localDate` are computed from the same `nowMs` so they all
  // agree — this is load-bearing for the cohort invariant: the subscribers
  // selected by `computeTargetOffsets(currentHour)` must receive a message
  // dated for THEIR local 08:00, which is the same moment we used to pick
  // them. Recomputing `nowMs` mid-loop could put earlier and later
  // subscribers on different calendar dates if the run crosses UTC midnight.
  const nowMs = Date.now()
  const currentHour = new Date(nowMs).getUTCHours()
  const targetOffsets = computeTargetOffsets(currentHour)

  const supabase = await createClient()

  const { data: subscribers, error: subError } = await supabase
    .from('telegram_subscribers')
    .select('chat_id, sign, role, timezone_offset')
    .eq('active', true)
    .in('timezone_offset', targetOffsets)

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
      // Per-(subscriber, cron tick) UUID. Embedded in the message URL as
      // `?t=<push_id>` and logged in telegram_push_events on successful
      // send so the destination page can flip clicked_at when the
      // subscriber opens the link. See Epic 17 / Story 17.2.
      const pushId = crypto.randomUUID()

      // Per-subscriber local date. For positive cohorts > 480 matched via
      // computeTargetOffsets' offsetB (Tokyo, Sydney, Auckland, Line Is.)
      // this yields tomorrow-UTC; for everyone else, today-UTC.
      //
      // Cache-warming note: the /api/revalidate cron runs at UTC midnight
      // and populates the Data Cache for both today-UTC and tomorrow-UTC
      // URLs across all 144 sign×role combos. That cache entry persists
      // until the next deploy (`revalidate = false` on the dated page),
      // so by the time positive cohorts fire later in the same UTC day
      // (e.g. Sydney at 22:00 needing the date that morning-warmup called
      // "tomorrow"), the URL still hits the warm cache.
      const localDate = subscriberLocalDate(subscriber.timezone_offset, nowMs)

      const { data: reading } = await supabase
        .from('readings')
        .select('content')
        .eq('sign', subscriber.sign)
        .eq('role', subscriber.role)
        .eq('date', localDate)
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

      const msg = buildMessage(subscriber, prose, hasMetrics, localDate, baseUrl, pushId)

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
            .update({
              active: false,
              unsubscribed_at: new Date().toISOString(),
              unsubscribe_source: 'api_error',
            })
            .eq('chat_id', subscriber.chat_id)
        }
      } else {
        // Log the delivered push for CTR tracking. Insert failure does not
        // block the sent++ increment — a missed event row is a missed CTR
        // data point, not a delivery failure.
        const { error: insertErr } = await supabase
          .from('telegram_push_events')
          .insert({ push_id: pushId, subscriber_id: subscriber.chat_id })
        if (insertErr) {
          console.warn(
            `[telegram-push] failed to insert push_event for chat_id=${subscriber.chat_id}: ${insertErr.message}`
          )
        }
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
