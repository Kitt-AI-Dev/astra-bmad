import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendMessage, answerCallbackQuery } from '@/lib/telegram'
import { handleTelegramUpdate, type TelegramUpdate } from '@/lib/telegram-webhook'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 400 })
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    console.error('[telegram/webhook] failed to parse update body')
    return NextResponse.json({ ok: true })
  }

  try {
    await handleTelegramUpdate(update, {
      createClient,
      sendMessage,
      answerCallbackQuery,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    })
  } catch (err) {
    // Log but still return 200 — if we return 5xx Telegram will retry indefinitely
    console.error('[telegram/webhook] handler error:', err)
  }

  return NextResponse.json({ ok: true })
}
