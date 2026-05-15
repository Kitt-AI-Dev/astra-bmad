import { TIMEZONE_KEYBOARD, SIGN_KEYBOARD, ROLE_KEYBOARD } from '@/lib/telegram'
import { SIGNS, ROLES } from '@/lib/constants'

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

export type SubscriberState = {
  sign: string | null
  role: string | null
  timezone_offset: number | null
}

export interface TelegramWebhookDeps {
  createClient(): Promise<SupabaseLike>
  sendMessage(chatId: number | bigint, text: string, replyMarkup?: object): Promise<void>
  answerCallbackQuery(callbackQueryId: string): Promise<void>
  getSubscriberState(chatId: number): Promise<SubscriberState | null>
}

const WELCOME_TEXT =
  `<b>// 404tune — daily horoscope for your IT life</b>\n\n` +
  `readings will arrive at 08:00 your time once setup is complete.`

const SIGN_PROMPT = `<code>// pick your sign:</code>`
const ROLE_PROMPT = `<code>// pick your role:</code>`
const TZ_PROMPT = `<code>// pick your timezone:</code>`

const ALL_SET_MESSAGE = (sign: string, role: string, tzLabel: string) => {
  const displaySign = sign.charAt(0).toUpperCase() + sign.slice(1)
  const displayRole = role.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return `<b>// 404tune — all set.</b>\n\n` +
    `<code>${displaySign} × ${displayRole}</code> · <code>${tzLabel}</code>\n\n` +
    `readings will arrive at 08:00 your time.`
}

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

// Parses callback_data format: 'sign:aries'
function parseSignCallback(data: string): string | null {
  const value = data.slice(5)
  return SIGNS.includes(value as typeof SIGNS[number]) ? value : null
}

// Parses callback_data format: 'role:software-engineer'
function parseRoleCallback(data: string): string | null {
  const value = data.slice(5)
  return ROLES.includes(value as typeof ROLES[number]) ? value : null
}

// Parses /start payload formats:
//   'tz_-300'                         — timezone only
//   'tz_-300_aries_software-engineer' — timezone + identity
function parseStartPayload(payload: string): { offset: number | null; sign: string | null; role: string | null } {
  const none = { offset: null, sign: null, role: null }
  if (!payload.startsWith('tz_')) return none

  const parts = payload.slice(3).split('_')
  const offset = validateOffset(parts[0])
  if (offset === null) return none

  if (parts.length >= 3) {
    const sign = parts[1]
    const role = parts[2]
    const validSign = SIGNS.includes(sign as typeof SIGNS[number]) ? sign : null
    const validRole = ROLES.includes(role as typeof ROLES[number]) ? role : null
    return { offset, sign: validSign, role: validRole }
  }

  return { offset, sign: null, role: null }
}

function formatTimezoneLabel(offset: number): string {
  const sign = offset >= 0 ? '+' : ''
  const hours = Math.floor(Math.abs(offset) / 60)
  const mins = Math.abs(offset) % 60

  return mins > 0
    ? `UTC${sign}${hours}:${String(mins).padStart(2, '0')}`
    : `UTC${sign}${hours}`
}

// Sends the next setup step based on current subscriber state, or the all-set message
// when everything is configured. Optional `prefix` is prepended to the next-step prompt
// (used to attach the welcome text to the first message in a /start flow).
async function sendNextStep(
  chatId: bigint,
  deps: TelegramWebhookDeps,
  prefix?: string
): Promise<void> {
  const state = await deps.getSubscriberState(Number(chatId))
  if (!state) return

  const prefixText = prefix ? `${prefix}\n\n` : ''

  if (state.sign === null) {
    await deps.sendMessage(chatId, prefixText + SIGN_PROMPT, SIGN_KEYBOARD)
  } else if (state.role === null) {
    await deps.sendMessage(chatId, prefixText + ROLE_PROMPT, ROLE_KEYBOARD)
  } else if (state.timezone_offset === null) {
    await deps.sendMessage(chatId, prefixText + TZ_PROMPT, TIMEZONE_KEYBOARD)
  } else {
    const tzLabel = formatTimezoneLabel(state.timezone_offset)
    await deps.sendMessage(chatId, ALL_SET_MESSAGE(state.sign, state.role, tzLabel))
  }
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
    const { offset, sign, role } = parseStartPayload(payload)

    const upsertData: Record<string, unknown> = { chat_id: Number(chatId), active: true }
    if (offset !== null) upsertData.timezone_offset = offset
    if (sign !== null) upsertData.sign = sign
    if (role !== null) upsertData.role = role

    const supabase = await deps.createClient()
    const result = await supabase
      .from('telegram_subscribers')
      .upsert(upsertData, { onConflict: 'chat_id' })
    assertDbOk(result, '/start upsert')

    await sendNextStep(chatId, deps, WELCOME_TEXT)
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

  if (data?.startsWith('sign:')) {
    const sign = parseSignCallback(data)
    if (sign === null) {
      console.warn('[telegram/webhook] invalid sign received:', data)
      await deps.answerCallbackQuery(callbackQueryId)
      return
    }
    const supabase = await deps.createClient()
    const result = await supabase
      .from('telegram_subscribers')
      .update({ sign })
      .eq('chat_id', Number(chatId))
    assertDbOk(result, 'sign update')

    await deps.answerCallbackQuery(callbackQueryId)
    await sendNextStep(chatId, deps)
    return
  }

  if (data?.startsWith('role:')) {
    const role = parseRoleCallback(data)
    if (role === null) {
      console.warn('[telegram/webhook] invalid role received:', data)
      await deps.answerCallbackQuery(callbackQueryId)
      return
    }
    const supabase = await deps.createClient()
    const result = await supabase
      .from('telegram_subscribers')
      .update({ role })
      .eq('chat_id', Number(chatId))
    assertDbOk(result, 'role update')

    await deps.answerCallbackQuery(callbackQueryId)
    await sendNextStep(chatId, deps)
    return
  }

  if (data?.startsWith('tz:')) {
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
    await sendNextStep(chatId, deps)
    return
  }

  await deps.answerCallbackQuery(callbackQueryId)
}
