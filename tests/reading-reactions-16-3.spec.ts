import { test, expect } from '@playwright/test'
import type { Page, BrowserContext, Request as PlaywrightRequest } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Fixture: insert a historical team_readings row so the team page renders
// (publish-gate RLS allows `date <= CURRENT_DATE + 1 AND suppressed = false`).
// Historical (1900-01-01, slot=1) does not collide with any real batch output.
//
// AC #7 (cookie-disabled fallback re-surfaces banner) is covered in 16.2; not
// re-tested here — 16.3 focuses on URL-prefix correctness for the team-readings
// resource path.
const FIXTURE_DATE = '1900-01-01'
const FIXTURE_SLOT = 1
const FIXTURE_CONTENT = '[16.3 fixture body]'

let supabase: SupabaseClient
let readingId = ''
let pageUrl = ''

function collectConsole(page: Page) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

async function resetCounts(id: string) {
  const { error } = await supabase
    .from('team_readings')
    .update({ likes_count: 0, dislikes_count: 0 })
    .eq('id', id)
  expect(error).toBeNull()
}

async function fetchCounts(id: string) {
  const { data, error } = await supabase
    .from('team_readings')
    .select('likes_count, dislikes_count')
    .eq('id', id)
    .single()
  expect(error).toBeNull()
  return data as { likes_count: number; dislikes_count: number }
}

async function seedVoteCookie(context: BrowserContext, id: string, value: 'up' | 'down') {
  await context.addCookies([
    {
      name: '404tune_votes',
      value: encodeURIComponent(JSON.stringify({ [id]: value })),
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ])
}

test.describe('16.3 — like/dislike buttons on team reading page', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Remove only stale copies of this exact fixture from interrupted runs.
    await supabase
      .from('team_readings')
      .delete()
      .eq('date', FIXTURE_DATE)
      .eq('slot', FIXTURE_SLOT)
      .eq('content', FIXTURE_CONTENT)

    const { data, error } = await supabase
      .from('team_readings')
      .insert({
        date: FIXTURE_DATE,
        slot: FIXTURE_SLOT,
        content: FIXTURE_CONTENT,
        suppressed: false,
        likes_count: 0,
        dislikes_count: 0,
      })
      .select('id')
      .single()
    if (error || !data) {
      throw new Error(`[16.3 fixture] Failed to insert sentinel team reading: ${error?.message}`)
    }
    readingId = (data as { id: string }).id
    pageUrl = `/team/${readingId}`
  })

  test.afterAll(async () => {
    if (readingId) {
      await supabase
        .from('team_readings')
        .delete()
        .eq('id', readingId)
        .eq('content', FIXTURE_CONTENT)
    }
  })

  test.beforeEach(async ({ context }) => {
    await resetCounts(readingId)
    await context.clearCookies()
  })

  test('initial state: both buttons muted, no API request fired', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    const apiCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiCalls.push(req.url())
    })

    await page.goto(pageUrl)

    const upIcon = page.getByRole('button', { name: 'Like this reading', exact: true }).locator('svg')
    const downIcon = page.getByRole('button', { name: 'Dislike this reading' }).locator('svg')
    await expect(upIcon).toBeVisible()
    await expect(downIcon).toBeVisible()
    await expect(upIcon).toHaveClass(/text-text-secondary/)
    await expect(downIcon).toHaveClass(/text-text-secondary/)

    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === '404tune_votes')).toBeUndefined()
    const reactionCalls = apiCalls.filter(
      (u) =>
        u.includes(`/api/readings/${readingId}/`) ||
        u.includes(`/api/team-readings/${readingId}/`)
    )
    expect(reactionCalls).toEqual([])
    expect(consoleMessages).toEqual([])
  })

  test('click thumbs-up: hits /api/team-readings, NEVER /api/readings', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    const apiCalls: Array<{ url: string; method: string }> = []
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        apiCalls.push({ url: req.url(), method: req.method() })
      }
    })

    await page.goto(pageUrl)

    const upBtn = page.getByRole('button', { name: 'Like this reading', exact: true })
    const upIcon = upBtn.locator('svg')

    const postLike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/team-readings/${readingId}/like`) &&
        r.request().method() === 'POST' &&
        r.status() === 200
    )
    await upBtn.click()
    await postLike

    await expect(upIcon).toHaveClass(/text-accent-gold/)

    const cookies = await context.cookies()
    const voteCookie = cookies.find((c) => c.name === '404tune_votes')
    expect(voteCookie).toBeDefined()
    expect(JSON.parse(decodeURIComponent(voteCookie!.value))).toEqual({ [readingId]: 'up' })

    expect(await fetchCounts(readingId)).toEqual({ likes_count: 1, dislikes_count: 0 })

    // Critical: the team page must NEVER hit the individual-reading API prefix.
    const wrongPrefix = apiCalls.filter((c) =>
      c.url.includes(`/api/readings/${readingId}/`)
    )
    expect(wrongPrefix, 'team page must NEVER hit /api/readings/[id]/*').toHaveLength(0)
    const rightPrefix = apiCalls.filter(
      (c) =>
        c.url.endsWith(`/api/team-readings/${readingId}/like`) && c.method === 'POST'
    )
    expect(rightPrefix).toHaveLength(1)

    expect(consoleMessages).toEqual([])
  })

  test('switch up → down: parallel DELETE /like + POST /dislike on team-readings prefix', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    await seedVoteCookie(context, readingId, 'up')
    await supabase
      .from('team_readings')
      .update({ likes_count: 1, dislikes_count: 0 })
      .eq('id', readingId)

    const reqTimings: Array<{ url: string; method: string; startedAt: number }> = []
    const captureRequest = (req: PlaywrightRequest) => {
      if (req.url().includes(`/api/team-readings/${readingId}/`)) {
        reqTimings.push({ url: req.url(), method: req.method(), startedAt: Date.now() })
      }
    }
    page.on('request', captureRequest)
    const allApiCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/')) allApiCalls.push(req.url())
    })

    await page.goto(pageUrl)

    const downBtn = page.getByRole('button', { name: 'Dislike this reading' })
    const upIcon = page.getByRole('button', { name: 'Like this reading', exact: true }).locator('svg')
    const downIcon = downBtn.locator('svg')

    const deleteLike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/team-readings/${readingId}/like`) &&
        r.request().method() === 'DELETE' &&
        r.status() === 200
    )
    const postDislike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/team-readings/${readingId}/dislike`) &&
        r.request().method() === 'POST' &&
        r.status() === 200
    )
    await downBtn.click()
    await Promise.all([deleteLike, postDislike])

    await expect(upIcon).toHaveClass(/text-text-secondary/)
    await expect(downIcon).toHaveClass(/text-accent-gold/)

    const switchCalls = reqTimings.filter(
      (r) =>
        (r.url.endsWith(`/api/team-readings/${readingId}/like`) && r.method === 'DELETE') ||
        (r.url.endsWith(`/api/team-readings/${readingId}/dislike`) && r.method === 'POST')
    )
    expect(switchCalls).toHaveLength(2)
    const startGap = Math.abs(switchCalls[0].startedAt - switchCalls[1].startedAt)
    expect(startGap).toBeLessThan(50)

    // Critical: still no /api/readings/[id]/ hits even during a switch.
    const wrongPrefix = allApiCalls.filter((u) => u.includes(`/api/readings/${readingId}/`))
    expect(wrongPrefix, 'switch flow must NEVER hit /api/readings/[id]/*').toHaveLength(0)

    const cookies = await context.cookies()
    const voteCookie = cookies.find((c) => c.name === '404tune_votes')
    expect(voteCookie).toBeDefined()
    expect(JSON.parse(decodeURIComponent(voteCookie!.value))).toEqual({ [readingId]: 'down' })

    expect(await fetchCounts(readingId)).toEqual({ likes_count: 0, dislikes_count: 1 })
    expect(consoleMessages).toEqual([])
  })
})
