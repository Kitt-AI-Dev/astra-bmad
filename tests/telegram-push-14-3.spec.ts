import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { shouldDeactivateTelegramSubscriber } from '@/lib/telegram-push'

let supabase: SupabaseClient

function collectConsole(page: { on: (event: 'console', handler: (msg: { type(): string; text(): string }) => void) => void }) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

function currentTargetOffset() {
  return 480 - new Date().getUTCHours() * 60
}

test.describe('14.3 — telegram-push cron', () => {
  test.beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  test('GET /api/cron/telegram-push without Authorization returns 401', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.get('/api/cron/telegram-push')
    expect(res.status()).toBe(401)
    expect(consoleMessages).toHaveLength(0)
  })

  test('GET /api/cron/telegram-push with wrong secret returns 401', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.get('/api/cron/telegram-push', {
      headers: { Authorization: 'Bearer wrong-secret' },
    })
    expect(res.status()).toBe(401)
    expect(consoleMessages).toHaveLength(0)
  })

  // Full push-delivery verification (asserting a Telegram message was received) requires
  // a live bot token and a seeded subscriber — that is verified manually in staging.
  test('GET /api/cron/telegram-push with valid secret returns 200 when current cohort is empty', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const secret = process.env.CRON_SECRET
    if (!secret) {
      test.skip(true, 'CRON_SECRET not set')
    }

    const { count, error } = await supabase
      .from('telegram_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .eq('timezone_offset', currentTargetOffset())

    expect(error).toBeNull()
    if ((count ?? 0) > 0) {
      test.skip(true, 'Current Telegram cohort is not empty; skipping to avoid sending live messages')
    }

    const res = await request.get('/api/cron/telegram-push', {
      headers: { Authorization: `Bearer ${secret}` },
    })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as { success: boolean; sent: number }
    expect(body).toEqual({ success: true, sent: 0 })
    expect(consoleMessages).toHaveLength(0)
  })

  test('Telegram 400 and 403 responses deactivate subscribers', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    expect(shouldDeactivateTelegramSubscriber(400)).toBe(true)
    expect(shouldDeactivateTelegramSubscriber(403)).toBe(true)
    expect(consoleMessages).toHaveLength(0)
  })

  test('Telegram rate-limit and server errors do not deactivate subscribers', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    expect(shouldDeactivateTelegramSubscriber(429)).toBe(false)
    expect(shouldDeactivateTelegramSubscriber(500)).toBe(false)
    expect(consoleMessages).toHaveLength(0)
  })
})
