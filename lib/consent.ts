'use client'

const CONSENT_COOKIE = '404tune_consent'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

type ConsentValue = {
  functional: boolean
  analytics: boolean
  timestamp: string
}

function readConsentCookie(): ConsentValue | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find((r) => r.startsWith(`${CONSENT_COOKIE}=`))
      ?.split('=')
      .slice(1)
      .join('=')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw)) as ConsentValue
  } catch {
    return null
  }
}

export function getConsent(): { functional: boolean; analytics: boolean } | null {
  const parsed = readConsentCookie()
  if (!parsed?.timestamp) return null
  const ts = new Date(parsed.timestamp).getTime()
  if (isNaN(ts) || Date.now() - ts > ONE_YEAR_MS) return null
  return { functional: parsed.functional, analytics: parsed.analytics }
}

export function setConsent(analytics: boolean): void {
  const value: ConsentValue = {
    functional: true,
    analytics,
    timestamp: new Date().toISOString(),
  }
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(value)
  )}; path=/; max-age=31536000; SameSite=Lax`
}
