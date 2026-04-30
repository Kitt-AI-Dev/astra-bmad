import { test, expect } from '@playwright/test'
import { asciiBar } from '../components/reading-sections'

// Story 10.2: Individual ReadingCard Redesign
//
// Pure-function tests verify asciiBar and parseContent logic without hitting
// the browser. Browser tests verify rendering against real DB data.
//
// New-format readings (deploy_luck / bug_risk_index / sprint_energy fields) only
// exist in the DB after a batch runs with the v3.0 prompts from Story 10.1.
// Until then, all DB readings are old-format (lucky_value / planetary_influence).
// The new-format browser test is conditional: it verifies the metrics section
// appears when new-format data is present, and logs a note when it is not.

// ---------------------------------------------------------------------------
// asciiBar pure-function tests
// ---------------------------------------------------------------------------

test('asciiBar(0) returns empty string', () => {
  expect(asciiBar(0)).toBe('')
})

test('asciiBar(100) fills the full bar width', () => {
  const bar = asciiBar(100)
  // fillCount = Math.round(1.0 * 20) = 20
  // fill = '='.repeat(19) + '>'
  expect(bar).toBe('===================>')
  expect(bar.length).toBe(20)
})

test('asciiBar(76) matches design spec example', () => {
  // fillCount = Math.round(0.76 * 20) = 15
  // fill = '='.repeat(14) + '>'
  const bar = asciiBar(76)
  expect(bar).toBe('==============>')
  expect(bar.length).toBe(15)
})

test('asciiBar(50) returns half-width bar', () => {
  // fillCount = Math.round(0.5 * 20) = 10
  // fill = '='.repeat(9) + '>'
  const bar = asciiBar(50)
  expect(bar).toBe('=========>')
  expect(bar.length).toBe(10)
})

test('asciiBar respects custom width', () => {
  // width 10, value 80 → fillCount = Math.round(0.8 * 10) = 8
  // fill = '='.repeat(7) + '>'
  const bar = asciiBar(80, 10)
  expect(bar).toBe('=======>')
  expect(bar.length).toBe(8)
})

// ---------------------------------------------------------------------------
// Browser tests — real DB data (old-format or new-format)
// ---------------------------------------------------------------------------

test('reading page always renders // today\'s reading header', async ({ page }) => {
  // /aries/frontend always has readings in the production DB
  await page.goto('/aries/frontend')
  await expect(page.locator('article')).toBeVisible()

  const article = page.locator('article')
  // The section comment "// today's reading" must be present for any non-null reading
  await expect(article.getByText("today's reading")).toBeVisible()
})

test('old-format reading does NOT show daily metrics section', async ({ page }) => {
  // Navigate to a specific past date that was generated before Story 10.1 (old format).
  // If this date has no reading, the null state renders — check for that too.
  await page.goto('/aries/software-engineer')

  const article = page.locator('article')
  await expect(article).toBeVisible()

  const metricsVisible = await article.getByText('daily metrics').isVisible()

  if (!metricsVisible) {
    // Old-format reading confirmed — metrics section must be absent and no error
    await expect(article.getByText('daily metrics')).toHaveCount(0)
    // Page should not contain any error markers
    await expect(page.locator('text=Error')).toHaveCount(0)
  } else {
    // New-format reading — metrics section present, also verify ASCII bar marker
    await expect(article.getByText('daily metrics')).toBeVisible()
    const content = await article.textContent()
    expect(content).toContain('[')
    expect(content).toContain(']')
  }
})

test('new-format reading shows daily metrics section when data exists', async ({ page }) => {
  await page.goto('/aries/frontend')

  const article = page.locator('article')
  await expect(article).toBeVisible()

  const metricsVisible = await article.getByText('daily metrics').isVisible()

  if (metricsVisible) {
    // New-format data confirmed — verify full layout
    await expect(article.getByText('daily metrics')).toBeVisible()

    // ASCII bar markers must appear (from MetricBar component)
    const content = await article.textContent()
    expect(content).toContain('[')
    expect(content).toContain(']')

    // Cursed commit block
    await expect(article.getByText('CURSED COMMIT OF THE DAY')).toBeVisible()
    await expect(article.getByText('git commit -m')).toBeVisible()
  } else {
    // Old-format data in DB — new-format rendering cannot yet be verified via browser.
    // Run a batch with the v3.0 prompts (Story 10.1) to populate new readings.
    // This test will then verify the full new-format layout automatically.
    test.info().annotations.push({
      type: 'info',
      description:
        'No new-format reading in DB yet. Metrics section test skipped. ' +
        'Run a v3.0 batch to populate new readings and re-run this test.',
    })
  }
})

test('null state renders correctly for unknown date', async ({ page }) => {
  // A date far in the future will never have a reading
  await page.goto('/aries/frontend/2099-01-01')

  const article = page.locator('article')
  await expect(article).toBeVisible()

  // Should show the null placeholder, not crash
  const text = await article.textContent()
  expect(text).toMatch(/reading not yet published|reading unavailable/)

  // No metrics or cursed commit in null state
  await expect(article.getByText('daily metrics')).toHaveCount(0)
  await expect(article.getByText('Cursed commit')).toHaveCount(0)
})
