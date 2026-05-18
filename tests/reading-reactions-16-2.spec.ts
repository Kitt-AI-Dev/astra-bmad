import { test, expect } from '@playwright/test'
import type { Page, BrowserContext, Request as PlaywrightRequest } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Fixture: create an isolated historical row with a valid sign/role so the real
// page route renders it, then delete that exact row by id after the suite.
//
// AC #7 (cookie-disabled fallback re-surfaces banner) is verified manually —
// Playwright cannot disable browser cookies on the default context without a
// custom browser launch.
const FIXTURE_SIGN = 'aries'
const FIXTURE_ROLE = 'software-engineer'
const FIXTURE_DATE = '1900-01-01'
const FIXTURE_BATCH_MONTH = '1900-01'
const FIXTURE_CONTENT = '[16.2 fixture body]'

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
    .from('readings')
    .update({ likes_count: 0, dislikes_count: 0 })
    .eq('id', id)
  expect(error).toBeNull()
}

async function fetchCounts(id: string) {
  const { data, error } = await supabase
    .from('readings')
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

test.describe('16.2 — like/dislike buttons on individual reading page', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    pageUrl = `/${FIXTURE_SIGN}/${FIXTURE_ROLE}/${FIXTURE_DATE}`

    // Remove only stale copies of this exact fixture from interrupted runs.
    await supabase
      .from('readings')
      .delete()
      .eq('sign', FIXTURE_SIGN)
      .eq('role', FIXTURE_ROLE)
      .eq('date', FIXTURE_DATE)
      .eq('content', FIXTURE_CONTENT)

    const { data, error } = await supabase
      .from('readings')
      .insert({
        sign: FIXTURE_SIGN,
        role: FIXTURE_ROLE,
        date: FIXTURE_DATE,
        content: FIXTURE_CONTENT,
        batch_month: FIXTURE_BATCH_MONTH,
        suppressed: false,
        likes_count: 0,
        dislikes_count: 0,
      })
      .select('id')
      .single()
    if (error || !data) {
      throw new Error(`[16.2 fixture] Failed to insert sentinel reading: ${error?.message}`)
    }
    readingId = (data as { id: string }).id
  })

  test.afterAll(async () => {
    if (readingId) {
      await supabase
        .from('readings')
        .delete()
        .eq('id', readingId)
        .eq('content', FIXTURE_CONTENT)
    }
  })

  test.beforeEach(async ({ context }) => {
    await resetCounts(readingId)
    await context.clearCookies()
  })

  test('initial state: both buttons muted, no cookie, no API request fired', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    const apiCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/readings/')) apiCalls.push(req.url())
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
    expect(apiCalls).toEqual([])
    expect(consoleMessages).toEqual([])
  })

  test('click thumbs-up from neutral: gold, cookie set, server +1 like', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    await page.goto(pageUrl)

    const upBtn = page.getByRole('button', { name: 'Like this reading', exact: true })
    const upIcon = upBtn.locator('svg')
    const downIcon = page.getByRole('button', { name: 'Dislike this reading' }).locator('svg')

    const postLike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/readings/${readingId}/like`) &&
        r.request().method() === 'POST' &&
        r.status() === 200
    )
    await upBtn.click()
    await postLike

    await expect(upIcon).toHaveClass(/text-accent-gold/)
    await expect(downIcon).toHaveClass(/text-text-secondary/)

    const cookies = await context.cookies()
    const voteCookie = cookies.find((c) => c.name === '404tune_votes')
    expect(voteCookie).toBeDefined()
    expect(JSON.parse(decodeURIComponent(voteCookie!.value))).toEqual({ [readingId]: 'up' })

    expect(await fetchCounts(readingId)).toEqual({ likes_count: 1, dislikes_count: 0 })
    expect(consoleMessages).toEqual([])
  })

  test('click thumbs-up again: muted, cookie removed, server -1 (back to 0)', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    // Pre-seed 'up' state at both layers: cookie + server count.
    await seedVoteCookie(context, readingId, 'up')
    await supabase
      .from('readings')
      .update({ likes_count: 1, dislikes_count: 0 })
      .eq('id', readingId)

    await page.goto(pageUrl)

    const upBtn = page.getByRole('button', { name: 'Like this reading', exact: true })
    const upIcon = upBtn.locator('svg')
    // Sanity: initial render shows gold from the seeded cookie.
    await expect(upIcon).toHaveClass(/text-accent-gold/)

    const deleteLike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/readings/${readingId}/like`) &&
        r.request().method() === 'DELETE' &&
        r.status() === 200
    )
    await upBtn.click()
    await deleteLike

    await expect(upIcon).toHaveClass(/text-text-secondary/)

    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === '404tune_votes')).toBeUndefined()
    expect(await fetchCounts(readingId)).toEqual({ likes_count: 0, dislikes_count: 0 })
    expect(consoleMessages).toEqual([])
  })

  test('click thumbs-down from neutral: gold dislike, cookie down, server +1 dislike', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    await page.goto(pageUrl)

    const downBtn = page.getByRole('button', { name: 'Dislike this reading' })
    const downIcon = downBtn.locator('svg')
    const upIcon = page.getByRole('button', { name: 'Like this reading', exact: true }).locator('svg')

    const postDislike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/readings/${readingId}/dislike`) &&
        r.request().method() === 'POST' &&
        r.status() === 200
    )
    await downBtn.click()
    await postDislike

    await expect(downIcon).toHaveClass(/text-accent-gold/)
    await expect(upIcon).toHaveClass(/text-text-secondary/)

    const cookies = await context.cookies()
    const voteCookie = cookies.find((c) => c.name === '404tune_votes')
    expect(voteCookie).toBeDefined()
    expect(JSON.parse(decodeURIComponent(voteCookie!.value))).toEqual({ [readingId]: 'down' })

    expect(await fetchCounts(readingId)).toEqual({ likes_count: 0, dislikes_count: 1 })
    expect(consoleMessages).toEqual([])
  })

  test('switch up → down: both API calls fire in parallel, cookie flips, counts update', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    await seedVoteCookie(context, readingId, 'up')
    await supabase
      .from('readings')
      .update({ likes_count: 1, dislikes_count: 0 })
      .eq('id', readingId)

    const reqTimings: Array<{ url: string; method: string; startedAt: number }> = []
    const captureRequest = (req: PlaywrightRequest) => {
      if (req.url().includes(`/api/readings/${readingId}/`)) {
        reqTimings.push({ url: req.url(), method: req.method(), startedAt: Date.now() })
      }
    }
    page.on('request', captureRequest)

    await page.goto(pageUrl)

    const downBtn = page.getByRole('button', { name: 'Dislike this reading' })
    const upIcon = page.getByRole('button', { name: 'Like this reading', exact: true }).locator('svg')
    const downIcon = downBtn.locator('svg')

    const deleteLike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/readings/${readingId}/like`) &&
        r.request().method() === 'DELETE' &&
        r.status() === 200
    )
    const postDislike = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/readings/${readingId}/dislike`) &&
        r.request().method() === 'POST' &&
        r.status() === 200
    )
    await downBtn.click()
    await Promise.all([deleteLike, postDislike])

    await expect(upIcon).toHaveClass(/text-text-secondary/)
    await expect(downIcon).toHaveClass(/text-accent-gold/)

    // Both API calls were fired close in time (proves Promise.all, not chained).
    const switchCalls = reqTimings.filter(
      (r) =>
        (r.url.endsWith(`/api/readings/${readingId}/like`) && r.method === 'DELETE') ||
        (r.url.endsWith(`/api/readings/${readingId}/dislike`) && r.method === 'POST')
    )
    expect(switchCalls).toHaveLength(2)
    const startGap = Math.abs(switchCalls[0].startedAt - switchCalls[1].startedAt)
    expect(startGap).toBeLessThan(50)

    const cookies = await context.cookies()
    const voteCookie = cookies.find((c) => c.name === '404tune_votes')
    expect(voteCookie).toBeDefined()
    expect(JSON.parse(decodeURIComponent(voteCookie!.value))).toEqual({ [readingId]: 'down' })

    expect(await fetchCounts(readingId)).toEqual({ likes_count: 0, dislikes_count: 1 })
    expect(consoleMessages).toEqual([])
  })

  test('header logo click clears the 404tune_votes cookie via clearPrefs()', async ({
    page,
    context,
  }) => {
    const consoleMessages = collectConsole(page)
    await seedVoteCookie(context, readingId, 'up')

    await page.goto(pageUrl)

    // Sanity: cookie is present before the click.
    const before = await context.cookies()
    expect(before.find((c) => c.name === '404tune_votes')).toBeDefined()

    await page.getByRole('link', { name: '404tune — change identity' }).click()
    // Header logo navigates to '/' — wait for the navigation to settle.
    await page.waitForURL('http://localhost:3000/')

    const after = await context.cookies()
    expect(after.find((c) => c.name === '404tune_votes')).toBeUndefined()
    expect(consoleMessages).toEqual([])
  })
})
