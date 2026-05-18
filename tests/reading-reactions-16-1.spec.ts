import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Sentinel fixture data — future-dated + suppressed so the rows are invisible
// to any public page if the suite is interrupted (publish-gate RLS excludes
// both `date > CURRENT_DATE + 1` and `suppressed = true`).
const FIXTURE_DATE = '2099-12-31'
const FIXTURE_SIGN = 'aries'
const FIXTURE_ROLE = 'test-role-16-1'
const FIXTURE_BATCH_MONTH = '2099-12'
const FIXTURE_SLOT = 1

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

async function resetCounts(table: 'readings' | 'team_readings', id: string) {
  const { error } = await supabase
    .from(table)
    .update({ likes_count: 0, dislikes_count: 0 })
    .eq('id', id)
  expect(error).toBeNull()
}

async function fetchCounts(table: 'readings' | 'team_readings', id: string) {
  const { data, error } = await supabase
    .from(table)
    .select('likes_count, dislikes_count')
    .eq('id', id)
    .single()
  expect(error).toBeNull()
  return data as { likes_count: number; dislikes_count: number }
}

test.describe('16.1 — reading reaction API', () => {
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
      .eq('content', '[16.1 fixture]')
      .eq('suppressed', true)

    const { data: readingRow, error: readingErr } = await supabase
      .from('readings')
      .insert({
        sign: FIXTURE_SIGN,
        role: FIXTURE_ROLE,
        date: FIXTURE_DATE,
        content: '[16.1 fixture]',
        batch_month: FIXTURE_BATCH_MONTH,
        suppressed: true,
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
        content: '[16.1 fixture]',
        suppressed: true,
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
    await resetCounts('readings', readingId)
    await resetCounts('team_readings', teamReadingId)
  })

  // ----------------------------------------------------------------- readings

  test('readings: POST /like → (1,0); DELETE clamps; POST /dislike → (0,1); DELETE clamps', async ({
    page,
    request,
  }) => {
    const consoleMessages = collectConsole(page)

    let res = await request.post(`/api/readings/${readingId}/like`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 1, dislikes_count: 0 })
    expect(await fetchCounts('readings', readingId)).toEqual({
      likes_count: 1,
      dislikes_count: 0,
    })

    res = await request.delete(`/api/readings/${readingId}/like`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('readings', readingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    // Second DELETE on 0 must clamp at 0, not go negative.
    res = await request.delete(`/api/readings/${readingId}/like`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('readings', readingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    res = await request.post(`/api/readings/${readingId}/dislike`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 1 })
    expect(await fetchCounts('readings', readingId)).toEqual({
      likes_count: 0,
      dislikes_count: 1,
    })

    res = await request.delete(`/api/readings/${readingId}/dislike`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('readings', readingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    // Clamp.
    res = await request.delete(`/api/readings/${readingId}/dislike`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('readings', readingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    expect(consoleMessages).toEqual([])
  })

  // ------------------------------------------------------------ team_readings

  test('team-readings: POST /like → (1,0); DELETE clamps; POST /dislike → (0,1); DELETE clamps', async ({
    page,
    request,
  }) => {
    const consoleMessages = collectConsole(page)

    let res = await request.post(`/api/team-readings/${teamReadingId}/like`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 1, dislikes_count: 0 })
    expect(await fetchCounts('team_readings', teamReadingId)).toEqual({
      likes_count: 1,
      dislikes_count: 0,
    })

    res = await request.delete(`/api/team-readings/${teamReadingId}/like`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('team_readings', teamReadingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    res = await request.delete(`/api/team-readings/${teamReadingId}/like`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('team_readings', teamReadingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    res = await request.post(`/api/team-readings/${teamReadingId}/dislike`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 1 })
    expect(await fetchCounts('team_readings', teamReadingId)).toEqual({
      likes_count: 0,
      dislikes_count: 1,
    })

    res = await request.delete(`/api/team-readings/${teamReadingId}/dislike`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('team_readings', teamReadingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    res = await request.delete(`/api/team-readings/${teamReadingId}/dislike`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(await fetchCounts('team_readings', teamReadingId)).toEqual({
      likes_count: 0,
      dislikes_count: 0,
    })

    expect(consoleMessages).toEqual([])
  })

  // ---------------------------------------------------------------------- 404

  test('readings: malformed UUID → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post('/api/readings/not-a-uuid/like')
    expect(res.status()).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(consoleMessages).toEqual([])
  })

  test('readings: well-formed UUID with no row → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.post(
      '/api/readings/00000000-0000-0000-0000-000000000000/dislike'
    )
    expect(res.status()).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(consoleMessages).toEqual([])
  })

  test('team-readings: malformed UUID → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.delete('/api/team-readings/not-a-uuid/dislike')
    expect(res.status()).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(consoleMessages).toEqual([])
  })

  test('team-readings: well-formed UUID with no row → 404', async ({ page, request }) => {
    const consoleMessages = collectConsole(page)
    const res = await request.delete(
      '/api/team-readings/00000000-0000-0000-0000-000000000000/like'
    )
    expect(res.status()).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(consoleMessages).toEqual([])
  })
})
