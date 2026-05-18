import { test, expect } from '@playwright/test'
import {
  parseReading,
  buildMessage,
  METRICS_TEASER,
  type Subscriber,
} from '@/lib/telegram-push-message'

// Story 15.4: pure-function unit tests for the Telegram daily-push message
// helpers. No browser, no IO, no Supabase, no live bot — just transformations.

const SUBSCRIBER: Subscriber = {
  chat_id: 12345,
  sign: 'aries',
  role: 'software-engineer',
  timezone_offset: 60,
}
const TODAY = '2026-05-16'
const BASE = 'https://www.404tune.dev'
const PUSH_ID = '00000000-0000-0000-0000-000000000000'
const EXPECTED_URL = `${BASE}/aries/software-engineer/${TODAY}?t=${PUSH_ID}`

// ---------------------------------------------------------------------------
// parseReading
// ---------------------------------------------------------------------------

test('parseReading: fenced JSON with prose + all three metrics → both', () => {
  const fenced = '```json' + JSON.stringify({
    general_reading: 'today brings clarity',
    deploy_luck: 61,
    bug_risk_index: 74,
    sprint_energy: 45,
  }) + '```'
  expect(parseReading(fenced)).toEqual({ prose: 'today brings clarity', hasMetrics: true })
})

test('parseReading: unfenced JSON also parses', () => {
  const raw = JSON.stringify({
    general_reading: 'mercury squares your sprint',
    deploy_luck: 50,
    bug_risk_index: 50,
    sprint_energy: 50,
  })
  expect(parseReading(raw)).toEqual({ prose: 'mercury squares your sprint', hasMetrics: true })
})

test('parseReading: prose is trimmed', () => {
  const raw = JSON.stringify({ general_reading: '   leading + trailing   ' })
  expect(parseReading(raw).prose).toBe('leading + trailing')
})

test('parseReading: missing general_reading → prose null', () => {
  const raw = JSON.stringify({ deploy_luck: 61, bug_risk_index: 74, sprint_energy: 45 })
  expect(parseReading(raw)).toEqual({ prose: null, hasMetrics: true })
})

test('parseReading: non-string general_reading → prose null', () => {
  const raw = JSON.stringify({ general_reading: 123, deploy_luck: 1, bug_risk_index: 1, sprint_energy: 1 })
  expect(parseReading(raw).prose).toBe(null)
})

test('parseReading: only one of three metrics present → hasMetrics false', () => {
  const raw = JSON.stringify({ general_reading: 'x', deploy_luck: 50 })
  expect(parseReading(raw).hasMetrics).toBe(false)
})

test('parseReading: two of three metrics present → hasMetrics false (matches website all-or-nothing)', () => {
  const raw = JSON.stringify({ general_reading: 'x', deploy_luck: 50, bug_risk_index: 50 })
  expect(parseReading(raw).hasMetrics).toBe(false)
})

test('parseReading: explicit null metric → that field does not count', () => {
  const raw = JSON.stringify({ general_reading: 'x', deploy_luck: null, bug_risk_index: 50, sprint_energy: 50 })
  expect(parseReading(raw).hasMetrics).toBe(false)
})

test('parseReading: zero is a valid metric value', () => {
  const raw = JSON.stringify({ general_reading: 'x', deploy_luck: 0, bug_risk_index: 0, sprint_energy: 0 })
  expect(parseReading(raw).hasMetrics).toBe(true)
})

test('parseReading: malformed JSON → defaults', () => {
  expect(parseReading('{ this is not valid json')).toEqual({ prose: null, hasMetrics: false })
})

test('parseReading: empty string → defaults', () => {
  expect(parseReading('')).toEqual({ prose: null, hasMetrics: false })
})

test('parseReading: non-object JSON values → defaults', () => {
  // JSON.parse can yield null, a primitive, or an array — none of these are
  // a record we can index. Each must short-circuit cleanly to the defaults.
  expect(parseReading('null')).toEqual({ prose: null, hasMetrics: false })
  expect(parseReading('42')).toEqual({ prose: null, hasMetrics: false })
  expect(parseReading('"just a string"')).toEqual({ prose: null, hasMetrics: false })
  expect(parseReading('[1,2,3]')).toEqual({ prose: null, hasMetrics: false })
  expect(parseReading('true')).toEqual({ prose: null, hasMetrics: false })
})

test('parseReading: prose present + zero metric keys → hasMetrics false', () => {
  // Spec AC #2 explicitly calls out zero-of-three. Other tests cover
  // missing-prose + zero metrics; this one pins the prose-present shape.
  const raw = JSON.stringify({ general_reading: 'today brings clarity' })
  expect(parseReading(raw)).toEqual({ prose: 'today brings clarity', hasMetrics: false })
})

test('parseReading: empty general_reading → prose is empty string (not null)', () => {
  const raw = JSON.stringify({ general_reading: '' })
  // Empty string is a string; trim() returns ''. buildMessage treats '' as
  // falsy via `if (!prose)` and renders the no-reading fallback — that's the
  // pre-existing behavior documented as a defer item, captured here for
  // contract clarity.
  expect(parseReading(raw).prose).toBe('')
})

// ---------------------------------------------------------------------------
// buildMessage
// ---------------------------------------------------------------------------

test('buildMessage: prose null → fallback message, no URL', () => {
  const msg = buildMessage(SUBSCRIBER, null, false, TODAY, BASE, PUSH_ID)
  expect(msg).toBe(
    '<b>// 404tune — Aries × Software Engineer · 2026-05-16</b>\n\n' +
    '// no reading available today — check back tomorrow.'
  )
  expect(msg).not.toContain(BASE)
  expect(msg).not.toContain(METRICS_TEASER)
})

test('buildMessage: prose null + hasMetrics true → still the fallback (no teaser on no-reading)', () => {
  const msg = buildMessage(SUBSCRIBER, null, true, TODAY, BASE, PUSH_ID)
  expect(msg).not.toContain(METRICS_TEASER)
  expect(msg).toContain('// no reading available today')
})

test('buildMessage: prose + no metrics → header + prose + URL, no teaser', () => {
  const msg = buildMessage(SUBSCRIBER, 'today brings clarity', false, TODAY, BASE, PUSH_ID)
  expect(msg).toBe(
    '<b>// 404tune — Aries × Software Engineer · 2026-05-16</b>\n\n' +
    'today brings clarity\n\n' +
    EXPECTED_URL
  )
  expect(msg).not.toContain(METRICS_TEASER)
})

test('buildMessage: prose + metrics → header + prose + teaser + URL', () => {
  const msg = buildMessage(SUBSCRIBER, 'today brings clarity', true, TODAY, BASE, PUSH_ID)
  expect(msg).toBe(
    '<b>// 404tune — Aries × Software Engineer · 2026-05-16</b>\n\n' +
    'today brings clarity\n\n' +
    METRICS_TEASER + '\n\n' +
    EXPECTED_URL
  )
})

test('buildMessage: role with hyphens is title-cased per word', () => {
  const sub = { ...SUBSCRIBER, role: 'project-manager' }
  const msg = buildMessage(sub, 'x', false, TODAY, BASE, PUSH_ID)
  expect(msg).toContain('Aries × Project Manager')
})

test('buildMessage: very long prose is truncated, header + URL + teaser preserved, total ≤ 4096', () => {
  const longProse = 'a'.repeat(5000)
  const msg = buildMessage(SUBSCRIBER, longProse, true, TODAY, BASE, PUSH_ID)
  expect(msg.length).toBeLessThanOrEqual(4096)
  expect(msg).toContain('<b>// 404tune')
  expect(msg).toContain(METRICS_TEASER)
  expect(msg).toContain(EXPECTED_URL)
  // Truncation marker present
  expect(msg).toContain('…')
})

test('buildMessage: long prose without metrics still truncates and keeps the URL', () => {
  const longProse = 'b'.repeat(5000)
  const msg = buildMessage(SUBSCRIBER, longProse, false, TODAY, BASE, PUSH_ID)
  expect(msg.length).toBeLessThanOrEqual(4096)
  expect(msg).toContain(EXPECTED_URL)
  expect(msg).not.toContain(METRICS_TEASER)
})

test('buildMessage: empty-string prose triggers the fallback (handshake with parseReading)', () => {
  // parseReading('{"general_reading":""}') returns prose: '', and buildMessage
  // treats '' as falsy via `if (!prose)`. This test wires those two helpers'
  // edge-case contract together so a regression in either side is caught.
  const msg = buildMessage(SUBSCRIBER, '', false, TODAY, BASE, PUSH_ID)
  expect(msg).toBe(
    '<b>// 404tune — Aries × Software Engineer · 2026-05-16</b>\n\n' +
    '// no reading available today — check back tomorrow.'
  )
})

test('METRICS_TEASER is the exact expected literal string', () => {
  // Asserts the constant content directly so changing it (intentionally or
  // accidentally) is caught — other tests just check it's present, which
  // would still pass if the constant changed to anything else.
  expect(METRICS_TEASER).toBe('// daily metrics\nDeploy Luck...')
})
