import { stripJsonFence } from '@/lib/content'

export type Subscriber = {
  chat_id: number
  sign: string
  role: string
  timezone_offset: number
}

type ParsedReading = {
  prose: string | null
  hasMetrics: boolean
}

export const METRICS_TEASER = `// daily metrics\nDeploy Luck...`

// All three keys must be present as numbers for `hasMetrics` to be true.
// Matches the website's metric-section render rule in
// components/ReadingCard.tsx and avoids the user-trust break where the bot
// teases metrics that the website doesn't actually render.
const METRIC_KEYS = ['deploy_luck', 'bug_risk_index', 'sprint_energy'] as const

const DEFAULTS: ParsedReading = { prose: null, hasMetrics: false }

export function parseReading(rawContent: string): ParsedReading {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFence(rawContent))
  } catch {
    return DEFAULTS
  }
  // Narrow to a plain object — JSON.parse can also return null, a primitive,
  // or an array. Indexing those would either throw or return undefined.
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return DEFAULTS
  }
  const obj = parsed as Record<string, unknown>
  const prose = typeof obj.general_reading === 'string' ? obj.general_reading.trim() : null
  const hasMetrics = METRIC_KEYS.every((k) => typeof obj[k] === 'number')
  return { prose, hasMetrics }
}

export function buildMessage(
  subscriber: Subscriber,
  prose: string | null,
  hasMetrics: boolean,
  today: string,
  baseUrl: string
): string {
  const { sign, role } = subscriber
  const displaySign = sign.charAt(0).toUpperCase() + sign.slice(1)
  const displayRole = role
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const header = `<b>// 404tune — ${displaySign} × ${displayRole} · ${today}</b>`

  if (!prose) {
    return `${header}\n\n// no reading available today — check back tomorrow.`
  }

  // Telegram auto-renders an OG link preview for the URL on its own line.
  // The dated URL is used so the message stays valid if opened later.
  const url = `${baseUrl}/${sign}/${role}/${today}`
  const teaser = hasMetrics ? `${METRICS_TEASER}\n\n` : ''
  let msg = `${header}\n\n${prose}\n\n${teaser}${url}`

  // Hard cap at Telegram's 4096-char limit. Truncate prose only — header,
  // teaser, and URL must survive intact.
  if (msg.length > 4096) {
    const overhead = msg.length - prose.length
    const room = 4096 - overhead - 1
    msg = `${header}\n\n${prose.slice(0, room)}…\n\n${teaser}${url}`
  }
  return msg
}
