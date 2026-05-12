import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { handleTelegramUpdate, type TelegramWebhookDeps } from '@/lib/telegram-webhook'

const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook'
const TEST_CHAT_ID = 999_999_888_777
const VALID_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? 'test-secret-placeholder'

let supabase: SupabaseClient
type TelegramMessageCall = { chatId: number | bigint; text: string; replyMarkup?: object }
type DbWrite = { table: string; operation: 'upsert' | 'update'; values: object; column?: string; value?: unknown }

function collectConsole(page: { on: (event: 'console', handler: (msg: { type(): string; text(): string }) => void) => void }) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

function createMockDeps(dbErrorMessage?: string) {
  const messages: TelegramMessageCall[] = []
  const callbackAnswers: string[] = []
  const writes: DbWrite[] = []

  const result = { error: dbErrorMessage ? { message: dbErrorMessage } : null }
  const deps: TelegramWebhookDeps = {
    appUrl: 'http://localhost:3000',
    async createClient() {
      return {
        from(table: string) {
          return {
            async upsert(values: object) {
              writes.push({ table, operation: 'upsert', values })
              return result
            },
            update(values: object) {
              return {
                async eq(column: string, value: unknown) {
                  writes.push({ table, operation: 'update', values, column, value })
                  return result
                },
              }
            },
          }
        },
      }
    },
    async sendMessage(chatId, text, replyMarkup) {
      messages.push({ chatId, text, replyMarkup })
    },
    async answerCallbackQuery(callbackQueryId) {
      callbackAnswers.push(callbackQueryId)
    },
  }

  return { deps, messages, callbackAnswers, writes }
}

test.describe('POST /api/telegram/webhook', () => {
  // Serial mode: tests share TEST_CHAT_ID and afterEach cleanup — parallel workers would race
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  test.afterEach(async () => {
    await supabase.from('telegram_subscribers').delete().eq('chat_id', TEST_CHAT_ID)
  })

  test('missing secret token → 400', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post(WEBHOOK_URL, {
      data: { message: { chat: { id: TEST_CHAT_ID }, text: '/start' } },
    })
    expect(res.status()).toBe(400)
    expect(consoleMessages).toHaveLength(0)
  })

  test('wrong secret token → 400', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post(WEBHOOK_URL, {
      headers: { 'X-Telegram-Bot-Api-Secret-Token': 'wrong-secret' },
      data: { message: { chat: { id: TEST_CHAT_ID }, text: '/start' } },
    })
    expect(res.status()).toBe(400)
    expect(consoleMessages).toHaveLength(0)
  })

  test('/start → subscriber upserted in DB with active=true', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    const res = await request.post(WEBHOOK_URL, {
      headers: { 'X-Telegram-Bot-Api-Secret-Token': VALID_SECRET },
      data: { message: { chat: { id: TEST_CHAT_ID }, text: '/start' } },
    })
    expect(res.status()).toBe(200)

    const { data } = await supabase
      .from('telegram_subscribers')
      .select('chat_id, active')
      .eq('chat_id', TEST_CHAT_ID)
      .single()

    expect(data?.active).toBe(true)
    expect(consoleMessages).toHaveLength(0)
  })

  test('timezone callback → timezone_offset updated in DB', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    await supabase.from('telegram_subscribers').upsert(
      { chat_id: TEST_CHAT_ID, active: true },
      { onConflict: 'chat_id' }
    )

    const res = await request.post(WEBHOOK_URL, {
      headers: { 'X-Telegram-Bot-Api-Secret-Token': VALID_SECRET },
      data: {
        callback_query: {
          id: 'test-cb-id-123',
          from: { id: TEST_CHAT_ID },
          data: 'tz:60',
        },
      },
    })
    expect(res.status()).toBe(200)

    const { data } = await supabase
      .from('telegram_subscribers')
      .select('timezone_offset')
      .eq('chat_id', TEST_CHAT_ID)
      .single()

    expect(data?.timezone_offset).toBe(60)
    expect(consoleMessages).toHaveLength(0)
  })

  test('/stop → subscriber active=false', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)

    await supabase.from('telegram_subscribers').upsert(
      { chat_id: TEST_CHAT_ID, active: true },
      { onConflict: 'chat_id' }
    )

    const res = await request.post(WEBHOOK_URL, {
      headers: { 'X-Telegram-Bot-Api-Secret-Token': VALID_SECRET },
      data: { message: { chat: { id: TEST_CHAT_ID }, text: '/stop' } },
    })
    expect(res.status()).toBe(200)

    const { data } = await supabase
      .from('telegram_subscribers')
      .select('active')
      .eq('chat_id', TEST_CHAT_ID)
      .single()

    expect(data?.active).toBe(false)
    expect(consoleMessages).toHaveLength(0)
  })

  test('/start handler sends welcome reply with connect link and timezone keyboard', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, writes } = createMockDeps()

    await handleTelegramUpdate(
      { message: { chat: { id: TEST_CHAT_ID }, text: '/start' } },
      deps
    )

    expect(writes).toContainEqual({
      table: 'telegram_subscribers',
      operation: 'upsert',
      values: { chat_id: TEST_CHAT_ID, active: true },
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('http://localhost:3000/connect?tid=')
    expect(messages[0].replyMarkup).toMatchObject({ inline_keyboard: expect.any(Array) })
    expect(consoleMessages).toHaveLength(0)
  })

  test('timezone handler acknowledges callback and sends confirmation reply', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps()

    await handleTelegramUpdate(
      {
        callback_query: {
          id: 'test-cb-id-123',
          from: { id: TEST_CHAT_ID },
          data: 'tz:60',
        },
      },
      deps
    )

    expect(writes).toContainEqual({
      table: 'telegram_subscribers',
      operation: 'update',
      values: { timezone_offset: 60 },
      column: 'chat_id',
      value: TEST_CHAT_ID,
    })
    expect(callbackAnswers).toEqual(['test-cb-id-123'])
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// timezone set to UTC+1.')
    expect(consoleMessages).toHaveLength(0)
  })

  test('malformed timezone callback is rejected without subscriber update or confirmation reply', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps()
    const warnings: unknown[][] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args)
    }

    try {
      await handleTelegramUpdate(
        {
          callback_query: {
            id: 'test-cb-id-malformed',
            from: { id: TEST_CHAT_ID },
            data: 'tz:60junk',
          },
        },
        deps
      )
    } finally {
      console.warn = originalWarn
    }

    expect(writes).toHaveLength(0)
    expect(callbackAnswers).toEqual(['test-cb-id-malformed'])
    expect(messages).toHaveLength(0)
    expect(warnings).toEqual([
      ['[telegram/webhook] invalid timezone offset received:', 'tz:60junk'],
    ])
    expect(consoleMessages).toHaveLength(0)
  })

  test('DB write failure prevents success reply', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages } = createMockDeps('permission denied')

    await expect(
      handleTelegramUpdate(
        { message: { chat: { id: TEST_CHAT_ID }, text: '/start' } },
        deps
      )
    ).rejects.toThrow('/start upsert failed')

    expect(messages).toHaveLength(0)
    expect(consoleMessages).toHaveLength(0)
  })
})
