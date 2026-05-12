import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getTelegramSubscriberStats, type TelegramStatsClient } from '@/lib/admin-telegram-stats'

const TEST_CHAT_IDS = [999_999_666_401, 999_999_666_402, 999_999_666_403]
const NOW = new Date('2026-05-05T12:00:00.000Z')

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

test.describe('14.4 — admin telegram dashboard', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  test.afterEach(async () => {
    await supabase.from('telegram_subscribers').delete().in('chat_id', TEST_CHAT_IDS)
  })

  test('/admin/telegram unauthenticated redirects to /admin/login', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    const res = await page.goto('/admin/telegram')
    expect(res?.url()).toContain('/admin/login')
    expect(consoleMessages).toHaveLength(0)
  })

  test('GET /api/admin/telegram/stats unauthenticated redirects', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.get('/api/admin/telegram/stats', {
      maxRedirects: 0,
    })
    expect([301, 302, 307, 308]).toContain(res.status())
    expect(consoleMessages).toHaveLength(0)
  })

  test('authenticated admin sees /admin/telegram with stat cards', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    await page.goto('/admin/telegram')
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'No admin session in test env')
    }
    await expect(page.getByText('// telegram subscribers')).toBeVisible()
    await expect(page.getByText('total')).toBeVisible()
    await expect(page.getByText('active')).toBeVisible()
    await expect(page.getByText('last 7 days')).toBeVisible()
    expect(consoleMessages).toHaveLength(0)
  })

  test('admin layout includes // telegram nav link', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    await page.goto('/admin/login')
    const link = page.locator('a[href="/admin/telegram"]')
    await expect(link).toBeVisible()
    expect(consoleMessages).toHaveLength(0)
  })

  test('subscriber stats count total, active, and last 7 days correctly', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    await supabase.from('telegram_subscribers').delete().in('chat_id', TEST_CHAT_IDS)
    const baseline = await getTelegramSubscriberStats(supabase as unknown as TelegramStatsClient, NOW)

    const eightDaysAgo = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const { error: insertError } = await supabase.from('telegram_subscribers').insert([
      { chat_id: TEST_CHAT_IDS[0], active: true, subscribed_at: NOW.toISOString() },
      { chat_id: TEST_CHAT_IDS[1], active: false, subscribed_at: NOW.toISOString() },
      { chat_id: TEST_CHAT_IDS[2], active: true, subscribed_at: eightDaysAgo },
    ])
    expect(insertError).toBeNull()

    const stats = await getTelegramSubscriberStats(supabase as unknown as TelegramStatsClient, NOW)

    expect(stats.total - baseline.total).toBe(3)
    expect(stats.active - baseline.active).toBe(2)
    expect(stats.last7days - baseline.last7days).toBe(2)

    const { count: total } = await supabase
      .from('telegram_subscribers')
      .select('*', { count: 'exact', head: true })
    const { count: active } = await supabase
      .from('telegram_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
    const cutoff = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: last7days } = await supabase
      .from('telegram_subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('subscribed_at', cutoff)

    expect(stats).toEqual({
      total: total ?? 0,
      active: active ?? 0,
      last7days: last7days ?? 0,
    })
    expect(consoleMessages).toHaveLength(0)
  })
})
