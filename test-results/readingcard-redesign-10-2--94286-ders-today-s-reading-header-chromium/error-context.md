# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: readingcard-redesign-10-2.spec.ts >> reading page always renders // today's reading header
- Location: tests/readingcard-redesign-10-2.spec.ts:59:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/frontend
Call log:
  - navigating to "http://localhost:3000/aries/frontend", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { asciiBar } from '../components/reading-sections'
  3   | 
  4   | // Story 10.2: Individual ReadingCard Redesign
  5   | //
  6   | // Pure-function tests verify asciiBar and parseContent logic without hitting
  7   | // the browser. Browser tests verify rendering against real DB data.
  8   | //
  9   | // New-format readings (deploy_luck / bug_risk_index / sprint_energy fields) only
  10  | // exist in the DB after a batch runs with the v3.0 prompts from Story 10.1.
  11  | // Until then, all DB readings are old-format (lucky_value / planetary_influence).
  12  | // The new-format browser test is conditional: it verifies the metrics section
  13  | // appears when new-format data is present, and logs a note when it is not.
  14  | 
  15  | // ---------------------------------------------------------------------------
  16  | // asciiBar pure-function tests
  17  | // ---------------------------------------------------------------------------
  18  | 
  19  | test('asciiBar(0) returns empty string', () => {
  20  |   expect(asciiBar(0)).toBe('')
  21  | })
  22  | 
  23  | test('asciiBar(100) fills the full bar width', () => {
  24  |   const bar = asciiBar(100)
  25  |   // fillCount = Math.round(1.0 * 20) = 20
  26  |   // fill = '='.repeat(19) + '>'
  27  |   expect(bar).toBe('===================>')
  28  |   expect(bar.length).toBe(20)
  29  | })
  30  | 
  31  | test('asciiBar(76) matches design spec example', () => {
  32  |   // fillCount = Math.round(0.76 * 20) = 15
  33  |   // fill = '='.repeat(14) + '>'
  34  |   const bar = asciiBar(76)
  35  |   expect(bar).toBe('==============>')
  36  |   expect(bar.length).toBe(15)
  37  | })
  38  | 
  39  | test('asciiBar(50) returns half-width bar', () => {
  40  |   // fillCount = Math.round(0.5 * 20) = 10
  41  |   // fill = '='.repeat(9) + '>'
  42  |   const bar = asciiBar(50)
  43  |   expect(bar).toBe('=========>')
  44  |   expect(bar.length).toBe(10)
  45  | })
  46  | 
  47  | test('asciiBar respects custom width', () => {
  48  |   // width 10, value 80 → fillCount = Math.round(0.8 * 10) = 8
  49  |   // fill = '='.repeat(7) + '>'
  50  |   const bar = asciiBar(80, 10)
  51  |   expect(bar).toBe('=======>')
  52  |   expect(bar.length).toBe(8)
  53  | })
  54  | 
  55  | // ---------------------------------------------------------------------------
  56  | // Browser tests — real DB data (old-format or new-format)
  57  | // ---------------------------------------------------------------------------
  58  | 
  59  | test('reading page always renders // today\'s reading header', async ({ page }) => {
  60  |   // /aries/frontend always has readings in the production DB
> 61  |   await page.goto('/aries/frontend')
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/frontend
  62  |   await expect(page.locator('article')).toBeVisible()
  63  | 
  64  |   const article = page.locator('article')
  65  |   // The section comment "// today's reading" must be present for any non-null reading
  66  |   await expect(article.getByText("today's reading")).toBeVisible()
  67  | })
  68  | 
  69  | test('old-format reading does NOT show daily metrics section', async ({ page }) => {
  70  |   // Navigate to a specific past date that was generated before Story 10.1 (old format).
  71  |   // If this date has no reading, the null state renders — check for that too.
  72  |   await page.goto('/aries/software-engineer')
  73  | 
  74  |   const article = page.locator('article')
  75  |   await expect(article).toBeVisible()
  76  | 
  77  |   const metricsVisible = await article.getByText('daily metrics').isVisible()
  78  | 
  79  |   if (!metricsVisible) {
  80  |     // Old-format reading confirmed — metrics section must be absent and no error
  81  |     await expect(article.getByText('daily metrics')).toHaveCount(0)
  82  |     // Page should not contain any error markers
  83  |     await expect(page.locator('text=Error')).toHaveCount(0)
  84  |   } else {
  85  |     // New-format reading — metrics section present, also verify ASCII bar marker
  86  |     await expect(article.getByText('daily metrics')).toBeVisible()
  87  |     const content = await article.textContent()
  88  |     expect(content).toContain('[')
  89  |     expect(content).toContain(']')
  90  |   }
  91  | })
  92  | 
  93  | test('new-format reading shows daily metrics section when data exists', async ({ page }) => {
  94  |   await page.goto('/aries/frontend')
  95  | 
  96  |   const article = page.locator('article')
  97  |   await expect(article).toBeVisible()
  98  | 
  99  |   const metricsVisible = await article.getByText('daily metrics').isVisible()
  100 | 
  101 |   if (metricsVisible) {
  102 |     // New-format data confirmed — verify full layout
  103 |     await expect(article.getByText('daily metrics')).toBeVisible()
  104 | 
  105 |     // ASCII bar markers must appear (from MetricBar component)
  106 |     const content = await article.textContent()
  107 |     expect(content).toContain('[')
  108 |     expect(content).toContain(']')
  109 | 
  110 |     // Cursed commit block
  111 |     await expect(article.getByText('CURSED COMMIT OF THE DAY')).toBeVisible()
  112 |     await expect(article.getByText('git commit -m')).toBeVisible()
  113 |   } else {
  114 |     // Old-format data in DB — new-format rendering cannot yet be verified via browser.
  115 |     // Run a batch with the v3.0 prompts (Story 10.1) to populate new readings.
  116 |     // This test will then verify the full new-format layout automatically.
  117 |     test.info().annotations.push({
  118 |       type: 'info',
  119 |       description:
  120 |         'No new-format reading in DB yet. Metrics section test skipped. ' +
  121 |         'Run a v3.0 batch to populate new readings and re-run this test.',
  122 |     })
  123 |   }
  124 | })
  125 | 
  126 | test('null state renders correctly for unknown date', async ({ page }) => {
  127 |   // A date far in the future will never have a reading
  128 |   await page.goto('/aries/frontend/2099-01-01')
  129 | 
  130 |   const article = page.locator('article')
  131 |   await expect(article).toBeVisible()
  132 | 
  133 |   // Should show the null placeholder, not crash
  134 |   const text = await article.textContent()
  135 |   expect(text).toMatch(/reading not yet published|reading unavailable/)
  136 | 
  137 |   // No metrics or cursed commit in null state
  138 |   await expect(article.getByText('daily metrics')).toHaveCount(0)
  139 |   await expect(article.getByText('Cursed commit')).toHaveCount(0)
  140 | })
  141 | 
```