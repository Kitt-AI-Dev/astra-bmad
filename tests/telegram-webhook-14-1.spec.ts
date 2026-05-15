import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { handleTelegramUpdate, type TelegramWebhookDeps, type SubscriberState } from '@/lib/telegram-webhook'

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

function createMockDeps(
  dbErrorMessage?: string,
  initialState: SubscriberState = { sign: null, role: null, timezone_offset: null }
) {
  const messages: TelegramMessageCall[] = []
  const callbackAnswers: string[] = []
  const writes: DbWrite[] = []
  // Mutable state — updates from `upsert`/`update` writes are applied so that
  // `getSubscriberState` returns the post-write view (matching real DB semantics).
  const state: SubscriberState = { ...initialState }

  function applyWrite(values: object) {
    const v = values as Partial<SubscriberState>
    if ('sign' in v && v.sign !== undefined) state.sign = v.sign ?? null
    if ('role' in v && v.role !== undefined) state.role = v.role ?? null
    if ('timezone_offset' in v && v.timezone_offset !== undefined) {
      state.timezone_offset = v.timezone_offset ?? null
    }
  }

  const result = { error: dbErrorMessage ? { message: dbErrorMessage } : null }
  const deps: TelegramWebhookDeps = {
    async createClient() {
      return {
        from(table: string) {
          return {
            async upsert(values: object) {
              writes.push({ table, operation: 'upsert', values })
              if (!dbErrorMessage) applyWrite(values)
              return result
            },
            update(values: object) {
              return {
                async eq(column: string, value: unknown) {
                  writes.push({ table, operation: 'update', values, column, value })
                  if (!dbErrorMessage) applyWrite(values)
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
    async getSubscriberState() {
      return { ...state }
    },
  }

  return { deps, messages, callbackAnswers, writes, state }
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

  test('/start handler welcomes user and prompts for sign with sign keyboard', async ({ page }) => {
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
    expect(messages[0].text).toContain('// 404tune — daily horoscope for your IT life')
    expect(messages[0].text).toContain('// pick your sign:')
    const keyboard = messages[0].replyMarkup as { inline_keyboard: { text: string; callback_data: string }[][] }
    expect(keyboard.inline_keyboard[0][0].callback_data).toMatch(/^sign:/)
    expect(consoleMessages).toHaveLength(0)
  })

  test('/start with full payload (tz + sign + role) sends all-set reply with no keyboard', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, writes } = createMockDeps()

    await handleTelegramUpdate(
      { message: { chat: { id: TEST_CHAT_ID }, text: '/start tz_120_aries_software-engineer' } },
      deps
    )

    expect(writes).toContainEqual({
      table: 'telegram_subscribers',
      operation: 'upsert',
      values: { chat_id: TEST_CHAT_ID, active: true, timezone_offset: 120, sign: 'aries', role: 'software-engineer' },
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// 404tune — all set.')
    expect(messages[0].text).toContain('Aries × Software Engineer')
    expect(messages[0].text).toContain('UTC+2')
    expect(messages[0].replyMarkup).toBeUndefined()
    expect(consoleMessages).toHaveLength(0)
  })

  test('/start with tz-only payload prompts for sign (tz already saved)', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages } = createMockDeps()

    await handleTelegramUpdate(
      { message: { chat: { id: TEST_CHAT_ID }, text: '/start tz_60' } },
      deps
    )

    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// pick your sign:')
    const keyboard = messages[0].replyMarkup as { inline_keyboard: { text: string; callback_data: string }[][] }
    expect(keyboard.inline_keyboard[0][0].callback_data).toMatch(/^sign:/)
    expect(consoleMessages).toHaveLength(0)
  })

  test('sign callback updates DB and prompts for role', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps()

    await handleTelegramUpdate(
      { callback_query: { id: 'cb-sign', from: { id: TEST_CHAT_ID }, data: 'sign:aries' } },
      deps
    )

    expect(writes).toContainEqual({
      table: 'telegram_subscribers',
      operation: 'update',
      values: { sign: 'aries' },
      column: 'chat_id',
      value: TEST_CHAT_ID,
    })
    expect(callbackAnswers).toEqual(['cb-sign'])
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// pick your role:')
    const keyboard = messages[0].replyMarkup as { inline_keyboard: { callback_data: string }[][] }
    expect(keyboard.inline_keyboard[0][0].callback_data).toMatch(/^role:/)
    expect(consoleMessages).toHaveLength(0)
  })

  test('role callback updates DB and prompts for timezone (when tz not set)', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, writes } = createMockDeps(undefined, {
      sign: 'aries', role: null, timezone_offset: null,
    })

    await handleTelegramUpdate(
      { callback_query: { id: 'cb-role', from: { id: TEST_CHAT_ID }, data: 'role:devops' } },
      deps
    )

    expect(writes).toContainEqual({
      table: 'telegram_subscribers',
      operation: 'update',
      values: { role: 'devops' },
      column: 'chat_id',
      value: TEST_CHAT_ID,
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// pick your timezone:')
    const keyboard = messages[0].replyMarkup as { inline_keyboard: { callback_data: string }[][] }
    expect(keyboard.inline_keyboard[0][0].callback_data).toMatch(/^tz:/)
    expect(consoleMessages).toHaveLength(0)
  })

  test('role callback completes flow when timezone already set', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages } = createMockDeps(undefined, {
      sign: 'aries', role: null, timezone_offset: 120,
    })

    await handleTelegramUpdate(
      { callback_query: { id: 'cb-role', from: { id: TEST_CHAT_ID }, data: 'role:devops' } },
      deps
    )

    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// 404tune — all set.')
    expect(messages[0].text).toContain('Aries × Devops')
    expect(messages[0].text).toContain('UTC+2')
    expect(messages[0].replyMarkup).toBeUndefined()
    expect(consoleMessages).toHaveLength(0)
  })

  test('timezone callback completes flow when sign+role already set', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps(undefined, {
      sign: 'aries', role: 'devops', timezone_offset: null,
    })

    await handleTelegramUpdate(
      { callback_query: { id: 'cb-tz', from: { id: TEST_CHAT_ID }, data: 'tz:60' } },
      deps
    )

    expect(writes).toContainEqual({
      table: 'telegram_subscribers',
      operation: 'update',
      values: { timezone_offset: 60 },
      column: 'chat_id',
      value: TEST_CHAT_ID,
    })
    expect(callbackAnswers).toEqual(['cb-tz'])
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toContain('// 404tune — all set.')
    expect(messages[0].text).toContain('UTC+1')
    expect(consoleMessages).toHaveLength(0)
  })

  test('malformed timezone callback is rejected without subscriber update', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps()
    const warnings: unknown[][] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args)
    }

    try {
      await handleTelegramUpdate(
        { callback_query: { id: 'cb-bad-tz', from: { id: TEST_CHAT_ID }, data: 'tz:60junk' } },
        deps
      )
    } finally {
      console.warn = originalWarn
    }

    expect(writes).toHaveLength(0)
    expect(callbackAnswers).toEqual(['cb-bad-tz'])
    expect(messages).toHaveLength(0)
    expect(warnings).toEqual([
      ['[telegram/webhook] invalid timezone offset received:', 'tz:60junk'],
    ])
    expect(consoleMessages).toHaveLength(0)
  })

  test('malformed sign callback is rejected without subscriber update', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps()
    const warnings: unknown[][] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args)
    }

    try {
      await handleTelegramUpdate(
        { callback_query: { id: 'cb-bad-sign', from: { id: TEST_CHAT_ID }, data: 'sign:not-a-sign' } },
        deps
      )
    } finally {
      console.warn = originalWarn
    }

    expect(writes).toHaveLength(0)
    expect(callbackAnswers).toEqual(['cb-bad-sign'])
    expect(messages).toHaveLength(0)
    expect(warnings).toEqual([
      ['[telegram/webhook] invalid sign received:', 'sign:not-a-sign'],
    ])
    expect(consoleMessages).toHaveLength(0)
  })

  test('malformed role callback is rejected without subscriber update', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const { deps, messages, callbackAnswers, writes } = createMockDeps()
    const warnings: unknown[][] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args)
    }

    try {
      await handleTelegramUpdate(
        { callback_query: { id: 'cb-bad-role', from: { id: TEST_CHAT_ID }, data: 'role:not-a-role' } },
        deps
      )
    } finally {
      console.warn = originalWarn
    }

    expect(writes).toHaveLength(0)
    expect(callbackAnswers).toEqual(['cb-bad-role'])
    expect(messages).toHaveLength(0)
    expect(warnings).toEqual([
      ['[telegram/webhook] invalid role received:', 'role:not-a-role'],
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
