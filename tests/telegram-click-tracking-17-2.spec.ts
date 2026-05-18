// Story 17.2 — Telegram deep-link conversion tracking.
//
// Covers the inbound click-capture and the admin engagement endpoint.
// Does NOT cover the cron's actual mutation of `telegram_push_events` —
// invoking the cron handler from Playwright would either require mocking
// `sendTelegramMessage` or hit the real Telegram API with sentinel chat_ids.
// That two-line cron change is covered by code review + manual probe.

import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Sentinel chat_ids — match the `999_999_*` convention from
// tests/admin-telegram-14-4.spec.ts. Pinned to story 17.2.
const FIXTURE_CHAT_ID = 999_999_172_001
const FIXTURE_CHAT_ID_TEAM = 999_999_172_002
const FIXTURE_CHAT_IDS_ENGAGEMENT = [
  999_999_172_011,
  999_999_172_012,
  999_999_172_013,
  999_999_172_014,
]

// Sentinel push_ids — fixed UUIDs known only to this test.
const FIXTURE_PUSH_ID = '00000000-0000-0000-0000-000000172001'
const FIXTURE_PUSH_ID_TEAM = '00000000-0000-0000-0000-000000172002'
const FIXTURE_PUSH_ID_UNKNOWN = '00000000-0000-0000-0000-00000deadbeef'
const FIXTURE_PUSH_IDS_ENGAGEMENT = [
  '00000000-0000-0000-0000-000000172011',
  '00000000-0000-0000-0000-000000172012',
  '00000000-0000-0000-0000-000000172013',
  '00000000-0000-0000-0000-000000172014',
]

// Past-dated personal reading fixture (distinct from 17.1's devops/1900-02-02
// fixture and 16.2's software-engineer/1900-01-01 fixture to keep test suites
// hermetic).
const FIXTURE_SIGN = 'aries'
const FIXTURE_ROLE = 'qa'
const FIXTURE_DATE = '1900-03-03'
const FIXTURE_BATCH_MONTH = '1900-03'
const FIXTURE_CONTENT = '[17.2 fixture body]'

// Team reading fixture (separate past date + slot to avoid stepping on 17.1).
const FIXTURE_TEAM_DATE = '1900-03-04'
const FIXTURE_TEAM_SLOT = 1
const FIXTURE_TEAM_CONTENT = '[17.2 team fixture body]'

let supabase: SupabaseClient
let teamReadingId = ''

function collectConsole(page: {
  on: (event: 'console', handler: (msg: { type(): string; text(): string }) => void) => void
}) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

async function fetchClickedAt(pushId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('telegram_push_events')
    .select('clicked_at')
    .eq('push_id', pushId)
    .single()
  expect(error).toBeNull()
  return (data as { clicked_at: string | null }).clicked_at
}

// The page's recordTelegramClick(...) is fire-and-forget on the server — the
// response returns before the Supabase UPDATE settles. Poll for up to 5s.
async function waitForClickedAt(pushId: string, timeoutMs = 5000): Promise<string | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const value = await fetchClickedAt(pushId)
    if (value !== null) return value
    await new Promise((r) => setTimeout(r, 100))
  }
  return null
}

test.describe('17.2 — telegram deep-link click tracking', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const allChatIds = [
      FIXTURE_CHAT_ID,
      FIXTURE_CHAT_ID_TEAM,
      ...FIXTURE_CHAT_IDS_ENGAGEMENT,
    ]
    const allPushIds = [
      FIXTURE_PUSH_ID,
      FIXTURE_PUSH_ID_TEAM,
      ...FIXTURE_PUSH_IDS_ENGAGEMENT,
    ]

    // Clean any stale fixtures from a previous interrupted run. Delete
    // events first (the FK is ON DELETE CASCADE but explicit is clearer).
    await supabase.from('telegram_push_events').delete().in('push_id', allPushIds)
    await supabase.from('telegram_subscribers').delete().in('chat_id', allChatIds)
    await supabase
      .from('readings')
      .delete()
      .eq('sign', FIXTURE_SIGN)
      .eq('role', FIXTURE_ROLE)
      .eq('date', FIXTURE_DATE)
    await supabase
      .from('team_readings')
      .delete()
      .eq('date', FIXTURE_TEAM_DATE)
      .eq('slot', FIXTURE_TEAM_SLOT)
      .eq('content', FIXTURE_TEAM_CONTENT)

    // Subscribers — one per fixture chat_id. Active flag doesn't matter
    // for click tracking; it only gates the cron.
    const subscribers = allChatIds.map((chat_id) => ({
      chat_id,
      active: true,
    }))
    const { error: subErr } = await supabase.from('telegram_subscribers').insert(subscribers)
    expect(subErr).toBeNull()

    // Personal reading fixture (suppressed=false + past date → renders publicly
    // but invisible to real users since no one visits a 1900 URL).
    const { error: readingErr } = await supabase.from('readings').insert({
      sign: FIXTURE_SIGN,
      role: FIXTURE_ROLE,
      date: FIXTURE_DATE,
      content: FIXTURE_CONTENT,
      batch_month: FIXTURE_BATCH_MONTH,
      suppressed: false,
    })
    expect(readingErr).toBeNull()

    // Team reading fixture.
    const { data: teamRow, error: teamErr } = await supabase
      .from('team_readings')
      .insert({
        date: FIXTURE_TEAM_DATE,
        slot: FIXTURE_TEAM_SLOT,
        content: FIXTURE_TEAM_CONTENT,
        suppressed: false,
      })
      .select('id')
      .single()
    expect(teamErr).toBeNull()
    teamReadingId = (teamRow as { id: string }).id

    // Push events. Test 1–4 use FIXTURE_PUSH_ID and FIXTURE_PUSH_ID_TEAM.
    // Engagement tests use the four engagement push_ids — seed two as
    // already-clicked, two as sent-but-not-clicked, all within the 7d window.
    const nowIso = new Date().toISOString()
    const { error: insertErr } = await supabase.from('telegram_push_events').insert([
      { push_id: FIXTURE_PUSH_ID, subscriber_id: FIXTURE_CHAT_ID, clicked_at: null },
      { push_id: FIXTURE_PUSH_ID_TEAM, subscriber_id: FIXTURE_CHAT_ID_TEAM, clicked_at: null },
      {
        push_id: FIXTURE_PUSH_IDS_ENGAGEMENT[0],
        subscriber_id: FIXTURE_CHAT_IDS_ENGAGEMENT[0],
        clicked_at: nowIso,
      },
      {
        push_id: FIXTURE_PUSH_IDS_ENGAGEMENT[1],
        subscriber_id: FIXTURE_CHAT_IDS_ENGAGEMENT[1],
        clicked_at: nowIso,
      },
      {
        push_id: FIXTURE_PUSH_IDS_ENGAGEMENT[2],
        subscriber_id: FIXTURE_CHAT_IDS_ENGAGEMENT[2],
        clicked_at: null,
      },
      {
        push_id: FIXTURE_PUSH_IDS_ENGAGEMENT[3],
        subscriber_id: FIXTURE_CHAT_IDS_ENGAGEMENT[3],
        clicked_at: null,
      },
    ])
    expect(insertErr).toBeNull()
  })

  test.afterAll(async () => {
    const allChatIds = [
      FIXTURE_CHAT_ID,
      FIXTURE_CHAT_ID_TEAM,
      ...FIXTURE_CHAT_IDS_ENGAGEMENT,
    ]
    const allPushIds = [
      FIXTURE_PUSH_ID,
      FIXTURE_PUSH_ID_TEAM,
      ...FIXTURE_PUSH_IDS_ENGAGEMENT,
    ]
    await supabase.from('telegram_push_events').delete().in('push_id', allPushIds)
    await supabase.from('telegram_subscribers').delete().in('chat_id', allChatIds)
    await supabase
      .from('readings')
      .delete()
      .eq('sign', FIXTURE_SIGN)
      .eq('role', FIXTURE_ROLE)
      .eq('date', FIXTURE_DATE)
    if (teamReadingId) {
      await supabase.from('team_readings').delete().eq('id', teamReadingId)
    }
  })

  test('personal-page click capture: visit ?t=<push_id> → clicked_at is set', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    await page.goto(`/${FIXTURE_SIGN}/${FIXTURE_ROLE}/${FIXTURE_DATE}?t=${FIXTURE_PUSH_ID}`)

    const clickedAt = await waitForClickedAt(FIXTURE_PUSH_ID)
    expect(clickedAt).not.toBeNull()

    expect(consoleMessages).toEqual([])
  })

  test('idempotency: second visit does NOT overwrite clicked_at', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const firstClickedAt = await fetchClickedAt(FIXTURE_PUSH_ID)
    expect(firstClickedAt).not.toBeNull()

    await page.goto(`/${FIXTURE_SIGN}/${FIXTURE_ROLE}/${FIXTURE_DATE}?t=${FIXTURE_PUSH_ID}`)
    // Give the server a moment to attempt the (no-op) UPDATE. Polling for a
    // value change is impossible here — we expect NO change. Sleep then read.
    await new Promise((r) => setTimeout(r, 500))

    const secondClickedAt = await fetchClickedAt(FIXTURE_PUSH_ID)
    expect(secondClickedAt).toBe(firstClickedAt)

    expect(consoleMessages).toEqual([])
  })

  test('orphan token: unknown ?t= renders page 200 and does NOT mutate any row', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    const teamClickedBefore = await fetchClickedAt(FIXTURE_PUSH_ID_TEAM)
    expect(teamClickedBefore).toBeNull()

    const res = await page.goto(
      `/${FIXTURE_SIGN}/${FIXTURE_ROLE}/${FIXTURE_DATE}?t=${FIXTURE_PUSH_ID_UNKNOWN}`
    )
    expect(res?.status()).toBe(200)
    // Allow time for the no-op UPDATE to settle.
    await new Promise((r) => setTimeout(r, 500))

    // The team-fixture row should still be null — orphan didn't pick a row at random.
    const teamClickedAfter = await fetchClickedAt(FIXTURE_PUSH_ID_TEAM)
    expect(teamClickedAfter).toBeNull()

    expect(consoleMessages).toEqual([])
  })

  test('team-page click capture: visit /team/[id]?t=<push_id> → clicked_at is set', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    await page.goto(`/team/${teamReadingId}?t=${FIXTURE_PUSH_ID_TEAM}`)

    const clickedAt = await waitForClickedAt(FIXTURE_PUSH_ID_TEAM)
    expect(clickedAt).not.toBeNull()

    expect(consoleMessages).toEqual([])
  })

  test('engagement endpoint: unauthenticated GET redirects to /admin/login', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    const res = await page.goto('/api/admin/telegram/engagement')
    // Middleware redirects unauthenticated /api/admin/* requests to login.
    expect(page.url()).toContain('/admin/login')
    expect(res?.status()).toBeLessThan(400)
    expect(consoleMessages).toEqual([])
  })

  test('engagement endpoint authenticated: returns shape with sane window stats', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    const res = await page.request.get('/api/admin/telegram/engagement')

    // If no admin session, request returns 307 or HTML login page — skip.
    const contentType = res.headers()['content-type'] ?? ''
    if (!contentType.includes('application/json')) {
      test.skip(true, 'No admin session in test env')
      return
    }

    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      window_7d: { sent: number; clicked: number; rate: number }
      window_30d: { sent: number; clicked: number; rate: number }
    }
    expect(body).toHaveProperty('window_7d')
    expect(body).toHaveProperty('window_30d')
    expect(typeof body.window_7d.sent).toBe('number')
    expect(typeof body.window_7d.clicked).toBe('number')
    expect(typeof body.window_7d.rate).toBe('number')
    // Our seeded events: 4 total in 7d window, 2 with clicked_at set.
    // Other test/real events may exist — use lower-bound assertions.
    expect(body.window_7d.sent).toBeGreaterThanOrEqual(4)
    expect(body.window_7d.clicked).toBeGreaterThanOrEqual(2)
    expect(body.window_7d.rate).toBeGreaterThan(0)
    expect(body.window_7d.rate).toBeLessThanOrEqual(1)
    expect(consoleMessages).toEqual([])
  })

  test('admin tile: engagement section header visible when authenticated', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    await page.goto('/admin/telegram')
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'No admin session in test env')
      return
    }

    await expect(
      page.locator('h2').filter({ hasText: 'engagement' })
    ).toBeVisible()
    expect(consoleMessages).toEqual([])
  })
})
