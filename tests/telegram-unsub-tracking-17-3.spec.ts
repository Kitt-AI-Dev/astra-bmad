// Story 17.3 — Telegram /stop (unsubscribe) rate tracking + admin tile.
//
// Covers: (1) /stop webhook writes unsubscribed_at + unsubscribe_source = 'user';
// (2) cron deactivation path verified via direct service-role mutation (the cron
// handler itself is not invoked from Playwright — same scope decision as 17.2);
// (3) engagement endpoint includes unsubscribe_rate field with sane numbers;
// (4) admin tile labels render. Auth-gated tests skip when no admin session.

import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook'
const VALID_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? 'test-secret-placeholder'

// Sentinel chat_ids — extend the `999_999_*` convention with `173_*` for 17.3.
const FIXTURE_CHAT_ID_USER_UNSUB = 999_999_173_001
const FIXTURE_CHAT_ID_API_ERROR = 999_999_173_002
const FIXTURE_CHAT_ID_BASELINE = 999_999_173_003
const ALL_CHAT_IDS = [
  FIXTURE_CHAT_ID_USER_UNSUB,
  FIXTURE_CHAT_ID_API_ERROR,
  FIXTURE_CHAT_ID_BASELINE,
]

let supabase: SupabaseClient

function collectConsole(page: {
  on: (event: 'console', handler: (msg: { type(): string; text(): string }) => void) => void
}) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

test.describe('17.3 — telegram /stop unsubscribe rate tracking', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Clean stale fixtures.
    await supabase.from('telegram_subscribers').delete().in('chat_id', ALL_CHAT_IDS)

    // Backdate subscribed_at to 31 days ago so all three are in the 30d window's
    // active_at_start baseline (and 24 days inside the 7d window since
    // subscribed_at < cutoff_7d which is 7 days ago).
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('telegram_subscribers').insert(
      ALL_CHAT_IDS.map((chat_id) => ({
        chat_id,
        active: true,
        subscribed_at: thirtyOneDaysAgo,
        unsubscribed_at: null,
        unsubscribe_source: null,
      }))
    )
    expect(error).toBeNull()
  })

  test.afterAll(async () => {
    await supabase.from('telegram_subscribers').delete().in('chat_id', ALL_CHAT_IDS)
  })

  test('/stop webhook writes unsubscribed_at and unsubscribe_source=user', async ({
    page,
    request,
  }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post(WEBHOOK_URL, {
      headers: { 'X-Telegram-Bot-Api-Secret-Token': VALID_SECRET },
      data: { message: { chat: { id: FIXTURE_CHAT_ID_USER_UNSUB }, text: '/stop' } },
    })
    expect(res.status()).toBe(200)

    const { data, error } = await supabase
      .from('telegram_subscribers')
      .select('active, unsubscribed_at, unsubscribe_source')
      .eq('chat_id', FIXTURE_CHAT_ID_USER_UNSUB)
      .single()
    expect(error).toBeNull()
    expect(data?.active).toBe(false)
    expect(data?.unsubscribed_at).not.toBeNull()
    expect(data?.unsubscribe_source).toBe('user')

    expect(consoleMessages).toEqual([])
  })

  test('cron deactivation path: direct mutation matches the UPDATE shape from Task 3', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)

    // Simulate what app/api/cron/telegram-push/route.ts does inside the
    // `if (shouldDeactivateTelegramSubscriber(res.status))` branch. The
    // cron handler itself is not invoked from Playwright (same scope
    // decision as 17.2).
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from('telegram_subscribers')
      .update({
        active: false,
        unsubscribed_at: nowIso,
        unsubscribe_source: 'api_error',
      })
      .eq('chat_id', FIXTURE_CHAT_ID_API_ERROR)
    expect(error).toBeNull()

    const { data } = await supabase
      .from('telegram_subscribers')
      .select('active, unsubscribed_at, unsubscribe_source')
      .eq('chat_id', FIXTURE_CHAT_ID_API_ERROR)
      .single()
    expect(data?.active).toBe(false)
    expect(data?.unsubscribed_at).not.toBeNull()
    expect(data?.unsubscribe_source).toBe('api_error')

    expect(consoleMessages).toEqual([])
  })

  test('engagement endpoint includes unsubscribe_rate with sane window stats', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    const res = await page.request.get('/api/admin/telegram/engagement')

    const contentType = res.headers()['content-type'] ?? ''
    if (!contentType.includes('application/json')) {
      test.skip(true, 'No admin session in test env')
      return
    }

    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      window_7d: {
        sent: number
        clicked: number
        rate: number
        unsubscribe_rate: { active_at_start: number; unsubs: number; rate: number }
      }
      window_30d: {
        sent: number
        clicked: number
        rate: number
        unsubscribe_rate: { active_at_start: number; unsubs: number; rate: number }
      }
    }

    // Shape assertions.
    expect(body.window_7d.unsubscribe_rate).toBeDefined()
    expect(typeof body.window_7d.unsubscribe_rate.active_at_start).toBe('number')
    expect(typeof body.window_7d.unsubscribe_rate.unsubs).toBe('number')
    expect(typeof body.window_7d.unsubscribe_rate.rate).toBe('number')

    // Our 3 seeded subscribers (subscribed 31 days ago) are inside the
    // active_at_start baseline for both windows. Two of them unsubscribed
    // during this test run. Use lower-bounds since other test/real data
    // may also be present in prod.
    expect(body.window_7d.unsubscribe_rate.active_at_start).toBeGreaterThanOrEqual(3)
    expect(body.window_7d.unsubscribe_rate.unsubs).toBeGreaterThanOrEqual(2)
    expect(body.window_7d.unsubscribe_rate.rate).toBeGreaterThan(0)
    expect(body.window_7d.unsubscribe_rate.rate).toBeLessThanOrEqual(1)

    // 17.2 CTR fields stay byte-stable — the same response includes them.
    expect(typeof body.window_7d.sent).toBe('number')
    expect(typeof body.window_7d.clicked).toBe('number')
    expect(typeof body.window_7d.rate).toBe('number')

    expect(consoleMessages).toEqual([])
  })

  test('admin tile: 7d and 30d unsub rate labels visible when authenticated', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    await page.goto('/admin/telegram')
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'No admin session in test env')
      return
    }

    await expect(page.locator('p').filter({ hasText: /^7d unsub rate$/ })).toBeVisible()
    await expect(page.locator('p').filter({ hasText: /^30d unsub rate$/ })).toBeVisible()
    expect(consoleMessages).toEqual([])
  })
})
