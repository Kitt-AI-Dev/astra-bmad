import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Sentinel fixture data — past-dated (1900-01-02) + suppressed=false so the
// public reading page renders for the UI click test, but no real user would
// ever visit a 1900 date URL. The role name pins this fixture to story 17.1.
const FIXTURE_SIGN = 'aries'
const FIXTURE_ROLE = 'test-role-17-1'
const FIXTURE_DATE = '1900-01-02'
const FIXTURE_BATCH_MONTH = '1900-01'
const FIXTURE_CONTENT = '[17.1 fixture body]'
const FIXTURE_SLOT = 1
const FIXTURE_TEAM_CONTENT = '[17.1 team fixture body]'

let supabase: SupabaseClient
let readingId = ''
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

async function resetShareCount(table: 'readings' | 'team_readings', id: string) {
  const { error } = await supabase
    .from(table)
    .update({ share_count: 0 })
    .eq('id', id)
  expect(error).toBeNull()
}

async function fetchShareCount(table: 'readings' | 'team_readings', id: string): Promise<number> {
  const { data, error } = await supabase
    .from(table)
    .select('share_count')
    .eq('id', id)
    .single()
  expect(error).toBeNull()
  return (data as { share_count: number }).share_count
}

test.describe('17.1 — share click counter (API contract)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Clean any stale fixture rows from a previous interrupted run.
    await supabase
      .from('readings')
      .delete()
      .eq('sign', FIXTURE_SIGN)
      .eq('role', FIXTURE_ROLE)
      .eq('date', FIXTURE_DATE)
    await supabase
      .from('team_readings')
      .delete()
      .eq('date', FIXTURE_DATE)
      .eq('slot', FIXTURE_SLOT)
      .eq('content', FIXTURE_TEAM_CONTENT)

    const { data: readingRow, error: readingErr } = await supabase
      .from('readings')
      .insert({
        sign: FIXTURE_SIGN,
        role: FIXTURE_ROLE,
        date: FIXTURE_DATE,
        content: FIXTURE_CONTENT,
        batch_month: FIXTURE_BATCH_MONTH,
        suppressed: false,
      })
      .select('id')
      .single()
    expect(readingErr).toBeNull()
    readingId = (readingRow as { id: string }).id

    const { data: teamRow, error: teamErr } = await supabase
      .from('team_readings')
      .insert({
        date: FIXTURE_DATE,
        slot: FIXTURE_SLOT,
        content: FIXTURE_TEAM_CONTENT,
        suppressed: false,
      })
      .select('id')
      .single()
    expect(teamErr).toBeNull()
    teamReadingId = (teamRow as { id: string }).id
  })

  test.afterAll(async () => {
    if (readingId) {
      await supabase.from('readings').delete().eq('id', readingId)
    }
    if (teamReadingId) {
      await supabase.from('team_readings').delete().eq('id', teamReadingId)
    }
  })

  test.beforeEach(async () => {
    await resetShareCount('readings', readingId)
    await resetShareCount('team_readings', teamReadingId)
  })

  test('readings: POST /share → 204 + empty body + DB share_count = 1', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post(`/api/readings/${readingId}/share`)
    expect(res.status()).toBe(204)
    const body = await res.body()
    expect(body.length).toBe(0)
    expect(await fetchShareCount('readings', readingId)).toBe(1)
    expect(consoleMessages).toEqual([])
  })

  test('readings: every click counts — three POSTs → share_count = 3 (no dedup)', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`/api/readings/${readingId}/share`)
      expect(res.status()).toBe(204)
    }
    expect(await fetchShareCount('readings', readingId)).toBe(3)
    expect(consoleMessages).toEqual([])
  })

  test('readings: malformed UUID → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post('/api/readings/not-a-uuid/share')
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Not found' })
    expect(consoleMessages).toEqual([])
  })

  test('readings: well-formed-but-unknown UUID → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post('/api/readings/00000000-0000-0000-0000-000000000000/share')
    expect(res.status()).toBe(404)
    expect(consoleMessages).toEqual([])
  })

  test('team-readings: POST /share → 204 + DB share_count = 1', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post(`/api/team-readings/${teamReadingId}/share`)
    expect(res.status()).toBe(204)
    const body = await res.body()
    expect(body.length).toBe(0)
    expect(await fetchShareCount('team_readings', teamReadingId)).toBe(1)
    expect(consoleMessages).toEqual([])
  })

  test('team-readings: every click counts — three POSTs → share_count = 3 (no dedup)', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`/api/team-readings/${teamReadingId}/share`)
      expect(res.status()).toBe(204)
    }
    expect(await fetchShareCount('team_readings', teamReadingId)).toBe(3)
    expect(consoleMessages).toEqual([])
  })

  test('team-readings: malformed UUID → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post('/api/team-readings/not-a-uuid/share')
    expect(res.status()).toBe(404)
    expect(consoleMessages).toEqual([])
  })

  test('team-readings: well-formed-but-unknown UUID → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post('/api/team-readings/00000000-0000-0000-0000-000000000000/share')
    expect(res.status()).toBe(404)
    expect(consoleMessages).toEqual([])
  })
})

test.describe('17.1 — share button click on reading page (UI)', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  let uiReadingId = ''
  let uiSupabase: SupabaseClient

  test.beforeAll(async () => {
    uiSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // UI tests must use a role from the ROLES constant — the personal reading
    // route validates `role` against that list and 404s on unknown values
    // (app/[sign]/[role]/[date]/page.tsx). Use `devops` + a past date that
    // doesn't collide with the 16.2 fixture (aries/software-engineer/1900-01-01).
    const UI_ROLE = 'devops'
    const UI_DATE = '1900-02-02'
    const UI_BATCH_MONTH = '1900-02'
    await uiSupabase
      .from('readings')
      .delete()
      .eq('sign', FIXTURE_SIGN)
      .eq('role', UI_ROLE)
      .eq('date', UI_DATE)

    const { data, error } = await uiSupabase
      .from('readings')
      .insert({
        sign: FIXTURE_SIGN,
        role: UI_ROLE,
        date: UI_DATE,
        content: FIXTURE_CONTENT,
        batch_month: UI_BATCH_MONTH,
        suppressed: false,
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    uiReadingId = (data as { id: string }).id
  })

  test.afterAll(async () => {
    if (uiReadingId) {
      await uiSupabase.from('readings').delete().eq('id', uiReadingId)
    }
  })

  test.beforeEach(async () => {
    await uiSupabase
      .from('readings')
      .update({ share_count: 0 })
      .eq('id', uiReadingId)
  })

  test('click $ share --copy-link: POST fires, clipboard gets UTM-tagged URL, DB increments', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    const sharePost = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/readings/${uiReadingId}/share`) &&
        r.request().method() === 'POST' &&
        r.status() === 204
    )

    await page.goto(`/${FIXTURE_SIGN}/devops/1900-02-02`)

    const shareBtn = page.getByRole('button', { name: 'Copy shareable link to this reading' })
    await expect(shareBtn).toBeVisible()
    await shareBtn.click()

    await sharePost

    // Clipboard should contain the URL with UTM tags
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardContent).toContain(`/${FIXTURE_SIGN}/devops/1900-02-02`)
    expect(clipboardContent).toContain('utm_source=share')
    expect(clipboardContent).toContain('utm_medium=clipboard')
    expect(clipboardContent).toContain('utm_campaign=reading')

    // DB increment landed
    const { data, error } = await uiSupabase
      .from('readings')
      .select('share_count')
      .eq('id', uiReadingId)
      .single()
    expect(error).toBeNull()
    expect((data as { share_count: number }).share_count).toBe(1)

    expect(consoleMessages).toEqual([])
  })
})
