'use client'

import Cookies from 'js-cookie'
import { SIGNS, ROLES } from './constants'
import type { Sign, Role } from './constants'

const COOKIE_NAME = '404tune_prefs'
const VOTES_COOKIE = '404tune_votes'
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
  Cookies.remove(VOTES_COOKIE, { path: '/' })
}

export function setPrefs(sign: Sign, role: Role): void {
  Cookies.set(COOKIE_NAME, JSON.stringify({ sign, role }), {
    expires: COOKIE_EXPIRES,
    sameSite: 'Lax',
    path: '/',
  })
}

type VoteValue = 'up' | 'down'
type VotesRecord = Record<string, VoteValue>

function readVotes(): VotesRecord {
  const raw = Cookies.get(VOTES_COOKIE)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return {}
    const out: VotesRecord = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === 'up' || v === 'down') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function writeVotes(record: VotesRecord): void {
  if (Object.keys(record).length === 0) {
    Cookies.remove(VOTES_COOKIE, { path: '/' })
    return
  }
  Cookies.set(VOTES_COOKIE, JSON.stringify(record), {
    expires: COOKIE_EXPIRES,
    sameSite: 'Lax',
    path: '/',
  })
}

export function getVote(readingId: string): VoteValue | null {
  return readVotes()[readingId] ?? null
}

// Returns true if the value reads back; false signals a cookie-write failure
// (browser cookies disabled, third-party blocked context, etc.) — the caller
// must re-surface the consent banner and not fire the API.
export function setVote(readingId: string, value: VoteValue | null): boolean {
  const record = readVotes()
  if (value === null) {
    delete record[readingId]
  } else {
    record[readingId] = value
  }
  writeVotes(record)
  return getVote(readingId) === value
}
