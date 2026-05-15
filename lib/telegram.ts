import { SIGNS, ROLES } from './constants'

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function callTelegram(method: string, body: object): Promise<void> {
  const res = await fetch(`${BASE_URL}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[telegram] ${method} failed (${res.status}):`, text)
    throw new Error(`Telegram API error: ${method} → ${res.status}`)
  }
}

export async function sendMessage(
  chatId: number | bigint,
  text: string,
  replyMarkup?: object
): Promise<void> {
  await callTelegram('sendMessage', {
    chat_id: Number(chatId),
    text,
    parse_mode: 'HTML',
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

export async function answerCallbackQuery(callbackQueryId: string): Promise<void> {
  await callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId })
}

export async function sendTelegramMessage(
  chatId: number | bigint,
  text: string
): Promise<Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('Missing env var: TELEGRAM_BOT_TOKEN')
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: Number(chatId), text, parse_mode: 'HTML' }),
  })
}

// Build a keyboard from a list of values, N per row.
// callback_data format: '{prefix}:{value}' (e.g. 'sign:aries', 'role:devops')
function buildKeyboard<T extends readonly string[]>(values: T, prefix: string, perRow: number) {
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < values.length; i += perRow) {
    rows.push(
      values.slice(i, i + perRow).map((v) => ({
        text: v,
        callback_data: `${prefix}:${v}`,
      }))
    )
  }
  return { inline_keyboard: rows }
}

export const SIGN_KEYBOARD = buildKeyboard(SIGNS, 'sign', 3)
export const ROLE_KEYBOARD = buildKeyboard(ROLES, 'role', 2)

// Inline keyboard covering UTC-12 to UTC+14 in common increments.
// callback_data format: 'tz:{offset_in_minutes}'
// offset_in_minutes is a signed integer: UTC-5 = -300, UTC+1 = 60, UTC+5:30 = 330
export const TIMEZONE_KEYBOARD = {
  inline_keyboard: [
    [{ text: 'UTC-12 (Baker Island)',   callback_data: 'tz:-720' }],
    [{ text: 'UTC-10 (Hawaii)',         callback_data: 'tz:-600' }],
    [{ text: 'UTC-8 (Los Angeles)',     callback_data: 'tz:-480' }],
    [{ text: 'UTC-7 (Denver)',          callback_data: 'tz:-420' }],
    [{ text: 'UTC-6 (Chicago)',         callback_data: 'tz:-360' }],
    [{ text: 'UTC-5 (New York)',        callback_data: 'tz:-300' }],
    [{ text: 'UTC-4 (Caracas)',         callback_data: 'tz:-240' }],
    [{ text: 'UTC-3 (Buenos Aires)',    callback_data: 'tz:-180' }],
    [{ text: 'UTC-1 (Azores)',          callback_data: 'tz:-60'  }],
    [{ text: 'UTC+0 (London)',          callback_data: 'tz:0'    }],
    [{ text: 'UTC+1 (Paris)',           callback_data: 'tz:60'   }],
    [{ text: 'UTC+2 (Kyiv)',            callback_data: 'tz:120'  }],
    [{ text: 'UTC+3 (Moscow)',          callback_data: 'tz:180'  }],
    [{ text: 'UTC+4 (Dubai)',           callback_data: 'tz:240'  }],
    [{ text: 'UTC+5 (Karachi)',         callback_data: 'tz:300'  }],
    [{ text: 'UTC+5:30 (Mumbai)',       callback_data: 'tz:330'  }],
    [{ text: 'UTC+7 (Bangkok)',         callback_data: 'tz:420'  }],
    [{ text: 'UTC+8 (Singapore)',       callback_data: 'tz:480'  }],
    [{ text: 'UTC+9 (Tokyo)',           callback_data: 'tz:540'  }],
    [{ text: 'UTC+10 (Sydney)',         callback_data: 'tz:600'  }],
    [{ text: 'UTC+12 (Auckland)',       callback_data: 'tz:720'  }],
    [{ text: 'UTC+14 (Line Islands)',   callback_data: 'tz:840'  }],
  ],
}
