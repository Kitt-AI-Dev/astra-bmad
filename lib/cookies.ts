'use client'

import Cookies from 'js-cookie'
import { SIGNS, ROLES } from './constants'
import type { Sign, Role } from './constants'

const COOKIE_NAME = '404tune_prefs'
const COOKIE_EXPIRES = 365

export function getPrefs(): { sign: Sign; role: Role } | null {
  const raw = Cookies.get(COOKIE_NAME)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !SIGNS.includes(parsed.sign) ||
      !ROLES.includes(parsed.role)
    ) return null
    return parsed as { sign: Sign; role: Role }
  } catch {
    return null
  }
}

export function clearPrefs(): void {
  Cookies.remove(COOKIE_NAME, { path: '/' })
}

export function setPrefs(sign: Sign, role: Role): void {
  Cookies.set(COOKIE_NAME, JSON.stringify({ sign, role }), {
    expires: COOKIE_EXPIRES,
    sameSite: 'Lax',
    path: '/',
  })
}
