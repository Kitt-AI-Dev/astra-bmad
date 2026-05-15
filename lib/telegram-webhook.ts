import { encodeTid, TIMEZONE_KEYBOARD } from '@/lib/telegram'

export interface TelegramMessage {
  chat: { id: number }
  text?: string
}

export interface TelegramCallbackQuery {
  id: string
  from: { id: number }
  data?: string
}

export interface TelegramUpdate {
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

type DbResult = { error: { message: string } | null }

interface SupabaseLike {
  from(table: string): {
    upsert(values: object, options?: object): PromiseLike<DbResult>
    update(values: object): {
      eq(column: string, value: unknown): PromiseLike<DbResult>
    }
  }
}

export interface TelegramWebhookDeps {
  createClient(): Promise<SupabaseLike>
  sendMessage(chatId: number | bigint, text: string, replyMarkup?: object): Promise<void>
  answerCallbackQuery(callbackQueryId: string): Promise<void>
  appUrl: string
}

const WELCOME_MESSAGE = (connectUrl: string, tzLabel?: string) =>
  `<b>// 404tune — daily horoscope for your IT life</b>\n\n` +
  `readings will arrive at 08:00 your time once you connect your sign and role.\n\n` +
  `→ <a href="${connectUrl}">connect your identity</a>\n\n` +
  (tzLabel
    ? `timezone detected as <code>${tzLabel}</code>. tap below to change if needed.`
    : `pick your timezone below so we know when to deliver your reading.`)

const TZ_CONFIRMED_MESSAGE = (label: string) =>
  `<code>// timezone set to ${label}. readings will land at 08:00 your time.</code>`

const STOP_MESSAGE =
  `<code>// unsubscribed. send /start to resubscribe at any time.</code>`

function assertDbOk(result: DbResult, action: string): void {
  if (result.error) {
    throw new Error(`[telegram/webhook] ${action} failed: ${result.error.message}`)
  }
}

function validateOffset(offsetStr: string): number | null {
  if (!/^-?\d+$/.test(offsetStr)) return null
  const offset = Number(offsetStr)
  if (!Number.isInteger(offset) || offset < -720 || offset > 840) return null
  return offset
}

// Parses callback_data format: 'tz:-300'
function parseTimezoneOffset(data: string): number | null {
  return validateOffset(data.slice(3))
}

// Parses /start payload format: 'tz_-300'
function parseStartPayload(payload: string): number | null {
  if (!payload.startsWith('tz_')) return null
  return validateOffset(payload.slice(3))
}

function formatTimezoneLabel(offset: number): string {
  const sign = offset >= 0 ? '+' : ''
  const hours = Math.floor(Math.abs(offset) / 60)
  const mins = Math.abs(offset) % 60

  return mins > 0
    ? `UTC${sign}${hours}:${String(mins).padStart(2, '0')}`
    : `UTC${sign}${hours}`
}

export async function handleTelegramUpdate(
  update: TelegramUpdate,
  deps: TelegramWebhookDeps
): Promise<void> {
  if (update.message) {
    await handleMessage(update.message, deps)
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, deps)
  }
}

async function handleMessage(message: TelegramMessage, deps: TelegramWebhookDeps): Promise<void> {
  const chatId = BigInt(message.chat.id)
  const text = message.text ?? ''

  if (text === '/start' || text.startsWith('/start ')) {
    const payload = text.slice('/start'.length).trim()
    const timezoneOffset = parseStartPayload(payload)

    const upsertData: Record<string, unknown> = { chat_id: Number(chatId), active: true }
    if (timezoneOffset !== null) upsertData.timezone_offset = timezoneOffset

    const supabase = await deps.createClient()
    const result = await supabase
      .from('telegram_subscribers')
      .upsert(upsertData, { onConflict: 'chat_id' })
    assertDbOk(result, '/start upsert')

    const tid = encodeTid(chatId)
    const connectUrl = `${deps.appUrl}/connect?tid=${tid}`
    const tzLabel = timezoneOffset !== null ? formatTimezoneLabel(timezoneOffset) : undefined

    await deps.sendMessage(chatId, WELCOME_MESSAGE(connectUrl, tzLabel), TIMEZONE_KEYBOARD)
    return
  }

  if (text === '/stop') {
    const supabase = await deps.createClient()
    const result = await supabase
      .from('telegram_subscribers')
      .update({ active: false })
      .eq('chat_id', Number(chatId))
    assertDbOk(result, '/stop update')

    await deps.sendMessage(chatId, STOP_MESSAGE)
    return
  }
}

async function handleCallbackQuery(
  callbackQuery: TelegramCallbackQuery,
  deps: TelegramWebhookDeps
): Promise<void> {
  const { id: callbackQueryId, from, data } = callbackQuery
  const chatId = BigInt(from.id)

  if (!data?.startsWith('tz:')) {
    await deps.answerCallbackQuery(callbackQueryId)
    return
  }

  const offset = parseTimezoneOffset(data)
  if (offset === null) {
    console.warn('[telegram/webhook] invalid timezone offset received:', data)
    await deps.answerCallbackQuery(callbackQueryId)
    return
  }

  const supabase = await deps.createClient()
  const result = await supabase
    .from('telegram_subscribers')
    .update({ timezone_offset: offset })
    .eq('chat_id', Number(chatId))
  assertDbOk(result, 'timezone update')

  await deps.answerCallbackQuery(callbackQueryId)
  await deps.sendMessage(chatId, TZ_CONFIRMED_MESSAGE(formatTimezoneLabel(offset)))
}
