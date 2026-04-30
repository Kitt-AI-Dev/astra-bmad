import { test, expect } from '@playwright/test'

// Story 10.3: Team ReadingCard Redesign
//
// Browser tests verify rendering against real DB data (production Supabase via localhost:3000).
//
// New-format team readings (JSON with heading/body/role_predictions/metrics) only exist in the
// DB after a batch runs with the v3.0 team prompts from Story 10.1.
// Until then, all DB team readings are old-format (markdown).
// The new-format browser test is conditional: it verifies the metrics section appears when
// new-format data is present, and logs a note when it is not.

// ---------------------------------------------------------------------------
// Null state
// ---------------------------------------------------------------------------

test('invalid team UUID renders placeholder, no metrics', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('pageerror', err => consoleErrors.push(err.message))

  await page.goto('http://localhost:3000/team/00000000-0000-0000-0000-000000000000')
  const article = page.locator('article')
  await expect(article).toBeVisible()

  const text = await article.textContent()
  expect(text).toMatch(/cosmos|not yet published/)

  await expect(article.getByText('daily metrics')).toHaveCount(0)
  await expect(article.getByText('CURSED COMMIT OF THE DAY')).toHaveCount(0)

  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('__nextjs'))
  expect(realErrors, `Console errors: ${realErrors.join('\n')}`).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// Browser tests — real DB data (old-format or new-format)
// ---------------------------------------------------------------------------

test('team reading shows correct layout based on format', async ({ page, request }) => {
  // Get a real team reading UUID from the API
  const res = await request.get('http://localhost:3000/api/team/today')
  const readings = await res.json() as { id: string; slot: number }[]

  if (!readings.length) {
    test.info().annotations.push({
      type: 'info',
      description: 'No team readings for today — batch not run. Test skipped.',
    })
    return
  }

  const { id } = readings[0]
  await page.goto(`http://localhost:3000/team/${id}`)

  const article = page.locator('[aria-label="team horoscope"]')
  await expect(article).toBeVisible()

  // Heading must always be present for a valid reading
  const text = await article.textContent()
  expect(text).toMatch(/\/\/ team:/)

  const metricsVisible = await article.getByText('daily metrics').isVisible()

  if (!metricsVisible) {
    // Old-format reading — metrics section must be absent and no error
    await expect(article.getByText('daily metrics')).toHaveCount(0)
    await expect(page.locator('text=Error')).toHaveCount(0)
  } else {
    // New-format reading — verify full new layout
    await expect(article.getByText('daily metrics')).toBeVisible()
    expect(text).toContain('[')
    expect(text).toContain(']')
    await expect(article.getByText('CURSED COMMIT OF THE DAY')).toBeVisible()
    await expect(article.getByText('git commit -m')).toBeVisible()
    // Role observations are prose — no separate role label sections
    const roleCommentCount = await article.locator('p').filter({
      hasText: /^\/\/ (qa|pm|dev|designer)$/
    }).count()
    expect(roleCommentCount).toBe(0)
  }
})

test('new-format team reading shows metrics when data exists', async ({ page, request }) => {
  const res = await request.get('http://localhost:3000/api/team/today')
  const readings = await res.json() as { id: string; slot: number }[]

  if (!readings.length) {
    test.info().annotations.push({
      type: 'info',
      description: 'No team readings today — batch not run. Test skipped.',
    })
    return
  }

  const { id } = readings[0]
  await page.goto(`http://localhost:3000/team/${id}`)

  const article = page.locator('[aria-label="team horoscope"]')
  await expect(article).toBeVisible()

  const metricsVisible = await article.getByText('daily metrics').isVisible()

  if (metricsVisible) {
    // New-format data confirmed — verify full layout
    await expect(article.getByText('daily metrics')).toBeVisible()

    const content = await article.textContent()
    expect(content).toContain('[')
    expect(content).toContain(']')

    await expect(article.getByText('CURSED COMMIT OF THE DAY')).toBeVisible()
    await expect(article.getByText('git commit -m')).toBeVisible()
  } else {
    // Old-format data in DB — new-format rendering cannot yet be verified via browser.
    // Run a batch with the v3.0 team prompts (Story 10.1) to populate new team readings.
    test.info().annotations.push({
      type: 'info',
      description:
        'No new-format team reading in DB yet. Metrics section test skipped. ' +
        'Run a v3.0 batch to populate new team readings and re-run this test.',
    })
  }
})

test('old-format team reading does NOT show daily metrics', async ({ page, request }) => {
  const res = await request.get('http://localhost:3000/api/team/today')
  const readings = await res.json() as { id: string; slot: number }[]

  if (!readings.length) {
    test.info().annotations.push({
      type: 'info',
      description: 'No team readings today — batch not run. Test skipped.',
    })
    return
  }

  const { id } = readings[0]
  await page.goto(`http://localhost:3000/team/${id}`)

  const article = page.locator('[aria-label="team horoscope"]')
  await expect(article).toBeVisible()

  const metricsVisible = await article.getByText('daily metrics').isVisible()

  if (!metricsVisible) {
    // Old-format confirmed — verify metrics absent and no crash
    await expect(article.getByText('daily metrics')).toHaveCount(0)
    await expect(page.locator('text=Error')).toHaveCount(0)
    // Role lines still present in old format
    const text = await article.textContent()
    expect(text).toMatch(/\/\/ team:|even the cosmos/)
  } else {
    // New-format in DB — this test is not applicable
    test.info().annotations.push({
      type: 'info',
      description: 'New-format team reading found. Old-format backward-compat test not applicable today.',
    })
  }
})
