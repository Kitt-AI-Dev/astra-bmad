import { test, expect } from '@playwright/test'
import { computeTargetOffsets, subscriberLocalDate } from '@/lib/telegram-push-cohort'
import { TIMEZONE_KEYBOARD } from '@/lib/telegram'

// Story 15.7: pure-function unit tests for the daily-push cohort math.
//
// At UTC hour H, subscribers whose local time is 08:00 must satisfy:
//   (H * 60 + offset) ≡ 480 (mod 1440)
// So offset = 480 - H*60 + 1440*k for any integer k. We use {k=0, k=1}
// to cover the keyboard's supported range of [-720, +840].

// ---------------------------------------------------------------------------
// Basic shape
// ---------------------------------------------------------------------------

test('computeTargetOffsets: H=0 anchors at offsetA=480 (the start of the daily sweep)', () => {
  // Pins the formula: at UTC midnight, we push to UTC+8 (Singapore).
  // If the anchor ever drifts, every subsequent hour is silently wrong.
  const [a] = computeTargetOffsets(0)
  expect(a).toBe(480)
})

test('computeTargetOffsets at H=0 → [480, 1920] (Singapore via offsetA)', () => {
  expect(computeTargetOffsets(0)).toEqual([480, 1920])
})

test('computeTargetOffsets at H=8 → [0, 1440] (London via offsetA)', () => {
  expect(computeTargetOffsets(8)).toEqual([0, 1440])
})

test('computeTargetOffsets at H=13 → [-300, 1140] (New York via offsetA)', () => {
  expect(computeTargetOffsets(13)).toEqual([-300, 1140])
})

test('computeTargetOffsets at H=16 → [-480, 960] (Los Angeles via offsetA)', () => {
  expect(computeTargetOffsets(16)).toEqual([-480, 960])
})

test('computeTargetOffsets at H=20 → [-720, 720] (Baker Is. via A, Auckland via B)', () => {
  // Auckland UTC+12 = 720 — previously missed
  expect(computeTargetOffsets(20)).toEqual([-720, 720])
})

// ---------------------------------------------------------------------------
// The bug being fixed — positive cohorts > 480 must appear in offsetB
// ---------------------------------------------------------------------------

test('Sydney UTC+10 (offset 600) is targeted at UTC hour 22', () => {
  // 22:00 UTC = 08:00 next-day Sydney (UTC+10)
  const [, offsetB] = computeTargetOffsets(22)
  expect(offsetB).toBe(600)
})

test('Tokyo UTC+9 (offset 540) is targeted at UTC hour 23', () => {
  // 23:00 UTC = 08:00 next-day Tokyo (UTC+9)
  const [, offsetB] = computeTargetOffsets(23)
  expect(offsetB).toBe(540)
})

test('Auckland UTC+12 (offset 720) is targeted at UTC hour 20', () => {
  // 20:00 UTC = 08:00 next-day Auckland (UTC+12)
  const [, offsetB] = computeTargetOffsets(20)
  expect(offsetB).toBe(720)
})

test('Line Islands UTC+14 (offset 840) is targeted at UTC hour 18', () => {
  // 18:00 UTC = 08:00 next-day Line Islands (UTC+14)
  const [, offsetB] = computeTargetOffsets(18)
  expect(offsetB).toBe(840)
})

// ---------------------------------------------------------------------------
// Existing negative-UTC behavior is unchanged (no regression)
// ---------------------------------------------------------------------------

test('UTC-5 New York (offset -300) still hits at UTC hour 13', () => {
  const [offsetA] = computeTargetOffsets(13)
  expect(offsetA).toBe(-300)
})

test('UTC-8 Los Angeles (offset -480) still hits at UTC hour 16', () => {
  const [offsetA] = computeTargetOffsets(16)
  expect(offsetA).toBe(-480)
})

test('UTC-12 Baker Is. (offset -720) still hits at UTC hour 20', () => {
  const [offsetA] = computeTargetOffsets(20)
  expect(offsetA).toBe(-720)
})

// ---------------------------------------------------------------------------
// Full-day coverage check — every keyboard offset must be hit by SOME hour
// ---------------------------------------------------------------------------

test('every keyboard offset (except half-hour) is hit by some UTC hour', () => {
  // Derive offsets from the canonical TIMEZONE_KEYBOARD — if the keyboard
  // ever adds a new entry, this test will check it automatically instead of
  // silently drifting against a hand-maintained list.
  const keyboardOffsets = TIMEZONE_KEYBOARD.inline_keyboard
    .flat()
    .map((btn) => Number(btn.callback_data.slice(3))) // strip 'tz:' prefix

  const hitSet = new Set<number>()
  for (let h = 0; h < 24; h++) {
    const [a, b] = computeTargetOffsets(h)
    hitSet.add(a)
    hitSet.add(b)
  }

  // Half-hour offsets are inherently unreachable on hourly cron — exclude
  // them (any offset whose absolute value mod 60 is non-zero).
  for (const offset of keyboardOffsets) {
    if (Math.abs(offset) % 60 !== 0) continue
    expect(hitSet.has(offset), `offset ${offset} not hit by any UTC hour`).toBe(true)
  }
})

test('half-hour offset UTC+5:30 (330) is NOT hit by any UTC hour — documented limitation', () => {
  for (let h = 0; h < 24; h++) {
    const [a, b] = computeTargetOffsets(h)
    expect(a).not.toBe(330)
    expect(b).not.toBe(330)
  }
})

// ---------------------------------------------------------------------------
// subscriberLocalDate — the date the subscriber sees as "today" given their
// offset at moment `nowMs`. Used by the cron to pick the right reading and
// build the correct URL for each cohort.
// ---------------------------------------------------------------------------

// Each test uses a fixed `nowMs` corresponding to that cohort's cron-matched
// UTC hour on 2026-05-16 (an arbitrary deterministic moment). The expected
// localDate is the subscriber's local calendar date at that exact moment.

test('subscriberLocalDate: UTC+0 (London) → today-UTC', () => {
  // 08:00 UTC + 0 minutes = 08:00 UTC same day
  const nowMs = Date.UTC(2026, 4, 16, 8, 0, 0)
  expect(subscriberLocalDate(0, nowMs)).toBe('2026-05-16')
})

test('subscriberLocalDate: UTC+8 (Singapore) at UTC 00:00 → today-UTC', () => {
  // 00:00 UTC + 8h = 08:00 UTC same day
  const nowMs = Date.UTC(2026, 4, 16, 0, 0, 0)
  expect(subscriberLocalDate(480, nowMs)).toBe('2026-05-16')
})

test('subscriberLocalDate: UTC-5 (NY) at UTC 13:00 → today-UTC', () => {
  // 13:00 UTC - 5h = 08:00 UTC same day
  const nowMs = Date.UTC(2026, 4, 16, 13, 0, 0)
  expect(subscriberLocalDate(-300, nowMs)).toBe('2026-05-16')
})

test('subscriberLocalDate: UTC+10 (Sydney) at UTC 22:00 → tomorrow-UTC', () => {
  // 22:00 UTC + 10h = 08:00 UTC NEXT DAY — the bug-fix case
  const nowMs = Date.UTC(2026, 4, 16, 22, 0, 0)
  expect(subscriberLocalDate(600, nowMs)).toBe('2026-05-17')
})

test('subscriberLocalDate: UTC+9 (Tokyo) at UTC 23:00 → tomorrow-UTC', () => {
  // 23:00 UTC + 9h = 08:00 UTC NEXT DAY
  const nowMs = Date.UTC(2026, 4, 16, 23, 0, 0)
  expect(subscriberLocalDate(540, nowMs)).toBe('2026-05-17')
})

test('subscriberLocalDate: UTC+12 (Auckland) at UTC 20:00 → tomorrow-UTC', () => {
  // 20:00 UTC + 12h = 08:00 UTC NEXT DAY
  const nowMs = Date.UTC(2026, 4, 16, 20, 0, 0)
  expect(subscriberLocalDate(720, nowMs)).toBe('2026-05-17')
})

test('subscriberLocalDate: UTC+14 (Line Is.) at UTC 18:00 → tomorrow-UTC', () => {
  // 18:00 UTC + 14h = 08:00 UTC NEXT DAY
  const nowMs = Date.UTC(2026, 4, 16, 18, 0, 0)
  expect(subscriberLocalDate(840, nowMs)).toBe('2026-05-17')
})

test('subscriberLocalDate: month boundary — UTC+10 at UTC 22:00 on May 31 → June 1', () => {
  // Catches off-by-one across month rollover
  const nowMs = Date.UTC(2026, 4, 31, 22, 0, 0)
  expect(subscriberLocalDate(600, nowMs)).toBe('2026-06-01')
})

test('subscriberLocalDate: year boundary — UTC+10 at UTC 22:00 on Dec 31 → Jan 1 next year', () => {
  // Catches off-by-one across year rollover
  const nowMs = Date.UTC(2026, 11, 31, 22, 0, 0)
  expect(subscriberLocalDate(600, nowMs)).toBe('2027-01-01')
})

test('subscriberLocalDate: UTC-12 (Baker Is.) at UTC 20:00 → same UTC day', () => {
  // 20:00 UTC - 12h = 08:00 UTC same day — negative cohorts stay on UTC today
  const nowMs = Date.UTC(2026, 4, 16, 20, 0, 0)
  expect(subscriberLocalDate(-720, nowMs)).toBe('2026-05-16')
})

test('subscriberLocalDate: negative-offset wrap-backward — UTC-5 at UTC 03:00 → yesterday', () => {
  // 03:00 UTC - 5h = 22:00 UTC PREVIOUS day. Not a scenario the cron triggers
  // today (NY is matched at H=13, not H=3), but locks the helper's general
  // contract: a negative offset should yield yesterday-UTC when the UTC hour
  // is small enough. Defends against a sign-flip regression in `* 60_000`.
  const nowMs = Date.UTC(2026, 4, 16, 3, 0, 0)
  expect(subscriberLocalDate(-300, nowMs)).toBe('2026-05-15')
})
