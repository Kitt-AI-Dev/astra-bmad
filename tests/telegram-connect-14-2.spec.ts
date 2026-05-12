import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Use distinct chat IDs per describe block — blocks run in parallel and share the same DB,
// so identical IDs would cause afterEach from one block to delete rows that the other needs.
const TEST_CHAT_ID_PAGE = 999_999_777_666
const TEST_CHAT_ID_API  = 999_999_777_555

function encodeTid(chatId: number): string {
  return Buffer.from(String(chatId)).toString('base64url')
}

const VALID_TID_PAGE = encodeTid(TEST_CHAT_ID_PAGE)
const VALID_TID_API  = encodeTid(TEST_CHAT_ID_API)

let supabasePage: SupabaseClient
let supabaseApi: SupabaseClient

function collectConsole(page: { on: (event: 'console', handler: (msg: { type(): string; text(): string }) => void) => void }) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

test.describe('/connect page', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    supabasePage = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  test.afterEach(async () => {
    await supabasePage.from('telegram_subscribers').delete().eq('chat_id', TEST_CHAT_ID_PAGE)
  })

  test('no tid → error state rendered', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    await page.goto('/connect')
    await page.waitForSelector('p[role="alert"]')

    const alertText = await page.locator('p[role="alert"]').textContent()
    expect(alertText).toContain('invalid link')
    expect(consoleMessages).toHaveLength(0)
  })

  test('invalid encoded tid → error state rendered and no API call made', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const connectRequests: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/api/telegram/connect')) {
        connectRequests.push(request.url())
      }
    })

    await page.goto('/connect?tid=not-valid-base64')
    await page.waitForSelector('p[role="alert"]')

    const alertText = await page.locator('p[role="alert"]').textContent()
    expect(alertText).toContain('invalid link')
    expect(connectRequests).toHaveLength(0)
    expect(consoleMessages).toHaveLength(0)
  })

  test('valid tid + prefs cookie → success state rendered', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    await supabasePage.from('telegram_subscribers').upsert(
      { chat_id: TEST_CHAT_ID_PAGE, active: true },
      { onConflict: 'chat_id' }
    )

    await page.context().addCookies([{
      name: '404tune_prefs',
      value: encodeURIComponent(JSON.stringify({ sign: 'aries', role: 'software-engineer' })),
      domain: 'localhost',
      path: '/',
    }])

    await page.goto(`/connect?tid=${VALID_TID_PAGE}`)
    await page.waitForSelector('[role="status"]', { timeout: 10000 })

    const statusText = await page.locator('[role="status"]').textContent()
    expect(statusText).toContain('Aries')
    expect(statusText).toContain('Software Engineer')

    const { data } = await supabasePage
      .from('telegram_subscribers')
      .select('sign, role')
      .eq('chat_id', TEST_CHAT_ID_PAGE)
      .single()
    expect(data?.sign).toBe('aries')
    expect(data?.role).toBe('software-engineer')

    expect(consoleMessages).toHaveLength(0)
  })

  test('valid tid + no prefs cookie → selector submits selected sign and role', async ({ page }) => {
    const consoleMessages = collectConsole(page)

    await page.context().clearCookies()
    await supabasePage.from('telegram_subscribers').upsert(
      { chat_id: TEST_CHAT_ID_PAGE, active: true },
      { onConflict: 'chat_id' }
    )

    await page.goto(`/connect?tid=${VALID_TID_PAGE}`)
    await expect(page.getByText('// select your sign and role to complete setup.')).toBeVisible()

    await page.getByRole('radio', { name: 'taurus' }).click()
    await page.getByRole('radio', { name: 'devops' }).click()
    await expect(page.getByRole('status')).toContainText(
      '// connected. readings for Taurus × DevOps will arrive at 08:00 your time.'
    )

    const { data } = await supabasePage
      .from('telegram_subscribers')
      .select('sign, role')
      .eq('chat_id', TEST_CHAT_ID_PAGE)
      .single()
    expect(data?.sign).toBe('taurus')
    expect(data?.role).toBe('devops')

    expect(consoleMessages).toHaveLength(0)
  })
})

test.describe('POST /api/telegram/connect', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    supabaseApi = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  test.afterEach(async () => {
    await supabaseApi.from('telegram_subscribers').delete().eq('chat_id', TEST_CHAT_ID_API)
  })

  test('invalid sign → 400', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post('/api/telegram/connect', {
      data: { tid: VALID_TID_API, sign: 'not-a-sign', role: 'software-engineer' },
    })
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(consoleMessages).toHaveLength(0)
  })

  test('invalid role → 400', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post('/api/telegram/connect', {
      data: { tid: VALID_TID_API, sign: 'aries', role: 'not-a-role' },
    })
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(consoleMessages).toHaveLength(0)
  })

  test('missing tid → 400', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post('/api/telegram/connect', {
      data: { sign: 'aries', role: 'software-engineer' },
    })
    expect(res.status()).toBe(400)
    expect(consoleMessages).toHaveLength(0)
  })

  test('valid payload → 200 + subscriber row has sign and role', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    await supabaseApi.from('telegram_subscribers').upsert(
      { chat_id: TEST_CHAT_ID_API, active: true },
      { onConflict: 'chat_id' }
    )

    const res = await request.post('/api/telegram/connect', {
      data: { tid: VALID_TID_API, sign: 'taurus', role: 'devops' },
    })
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const { data } = await supabaseApi
      .from('telegram_subscribers')
      .select('sign, role, active')
      .eq('chat_id', TEST_CHAT_ID_API)
      .single()
    expect(data?.sign).toBe('taurus')
    expect(data?.role).toBe('devops')
    expect(data?.active).toBe(true)
    expect(consoleMessages).toHaveLength(0)
  })
})
