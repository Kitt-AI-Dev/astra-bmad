import { test, expect } from '@playwright/test'
import { computeTargetOffsets } from '@/lib/telegram-push-cohort'
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
