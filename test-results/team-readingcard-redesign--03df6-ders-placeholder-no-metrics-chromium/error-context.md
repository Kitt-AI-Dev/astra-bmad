# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: team-readingcard-redesign-10-3.spec.ts >> invalid team UUID renders placeholder, no metrics
- Location: tests/team-readingcard-redesign-10-3.spec.ts:17:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/team/00000000-0000-0000-0000-000000000000
Call log:
  - navigating to "http://localhost:3000/team/00000000-0000-0000-0000-000000000000", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | // Story 10.3: Team ReadingCard Redesign
  4   | //
  5   | // Browser tests verify rendering against real DB data (production Supabase via localhost:3000).
  6   | //
  7   | // New-format team readings (JSON with heading/body/role_predictions/metrics) only exist in the
  8   | // DB after a batch runs with the v3.0 team prompts from Story 10.1.
  9   | // Until then, all DB team readings are old-format (markdown).
  10  | // The new-format browser test is conditional: it verifies the metrics section appears when
  11  | // new-format data is present, and logs a note when it is not.
  12  | 
  13  | // ---------------------------------------------------------------------------
  14  | // Null state
  15  | // ---------------------------------------------------------------------------
  16  | 
  17  | test('invalid team UUID renders placeholder, no metrics', async ({ page }) => {
  18  |   const consoleErrors: string[] = []
  19  |   page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  20  |   page.on('pageerror', err => consoleErrors.push(err.message))
  21  | 
> 22  |   await page.goto('http://localhost:3000/team/00000000-0000-0000-0000-000000000000')
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/team/00000000-0000-0000-0000-000000000000
  23  |   const article = page.locator('article')
  24  |   await expect(article).toBeVisible()
  25  | 
  26  |   const text = await article.textContent()
  27  |   expect(text).toMatch(/cosmos|not yet published/)
  28  | 
  29  |   await expect(article.getByText('daily metrics')).toHaveCount(0)
  30  |   await expect(article.getByText('CURSED COMMIT OF THE DAY')).toHaveCount(0)
  31  | 
  32  |   const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('__nextjs'))
  33  |   expect(realErrors, `Console errors: ${realErrors.join('\n')}`).toHaveLength(0)
  34  | })
  35  | 
  36  | // ---------------------------------------------------------------------------
  37  | // Browser tests — real DB data (old-format or new-format)
  38  | // ---------------------------------------------------------------------------
  39  | 
  40  | test('team reading shows correct layout based on format', async ({ page, request }) => {
  41  |   // Get a real team reading UUID from the API
  42  |   const res = await request.get('http://localhost:3000/api/team/today')
  43  |   const readings = await res.json() as { id: string; slot: number }[]
  44  | 
  45  |   if (!readings.length) {
  46  |     test.info().annotations.push({
  47  |       type: 'info',
  48  |       description: 'No team readings for today — batch not run. Test skipped.',
  49  |     })
  50  |     return
  51  |   }
  52  | 
  53  |   const { id } = readings[0]
  54  |   await page.goto(`http://localhost:3000/team/${id}`)
  55  | 
  56  |   const article = page.locator('[aria-label="team horoscope"]')
  57  |   await expect(article).toBeVisible()
  58  | 
  59  |   // Heading must always be present for a valid reading
  60  |   const text = await article.textContent()
  61  |   expect(text).toMatch(/\/\/ team:/)
  62  | 
  63  |   const metricsVisible = await article.getByText('daily metrics').isVisible()
  64  | 
  65  |   if (!metricsVisible) {
  66  |     // Old-format reading — metrics section must be absent and no error
  67  |     await expect(article.getByText('daily metrics')).toHaveCount(0)
  68  |     await expect(page.locator('text=Error')).toHaveCount(0)
  69  |   } else {
  70  |     // New-format reading — verify full new layout
  71  |     await expect(article.getByText('daily metrics')).toBeVisible()
  72  |     expect(text).toContain('[')
  73  |     expect(text).toContain(']')
  74  |     await expect(article.getByText('CURSED COMMIT OF THE DAY')).toBeVisible()
  75  |     await expect(article.getByText('git commit -m')).toBeVisible()
  76  |     // Role observations are prose — no separate role label sections
  77  |     const roleCommentCount = await article.locator('p').filter({
  78  |       hasText: /^\/\/ (qa|pm|dev|designer)$/
  79  |     }).count()
  80  |     expect(roleCommentCount).toBe(0)
  81  |   }
  82  | })
  83  | 
  84  | test('new-format team reading shows metrics when data exists', async ({ page, request }) => {
  85  |   const res = await request.get('http://localhost:3000/api/team/today')
  86  |   const readings = await res.json() as { id: string; slot: number }[]
  87  | 
  88  |   if (!readings.length) {
  89  |     test.info().annotations.push({
  90  |       type: 'info',
  91  |       description: 'No team readings today — batch not run. Test skipped.',
  92  |     })
  93  |     return
  94  |   }
  95  | 
  96  |   const { id } = readings[0]
  97  |   await page.goto(`http://localhost:3000/team/${id}`)
  98  | 
  99  |   const article = page.locator('[aria-label="team horoscope"]')
  100 |   await expect(article).toBeVisible()
  101 | 
  102 |   const metricsVisible = await article.getByText('daily metrics').isVisible()
  103 | 
  104 |   if (metricsVisible) {
  105 |     // New-format data confirmed — verify full layout
  106 |     await expect(article.getByText('daily metrics')).toBeVisible()
  107 | 
  108 |     const content = await article.textContent()
  109 |     expect(content).toContain('[')
  110 |     expect(content).toContain(']')
  111 | 
  112 |     await expect(article.getByText('CURSED COMMIT OF THE DAY')).toBeVisible()
  113 |     await expect(article.getByText('git commit -m')).toBeVisible()
  114 |   } else {
  115 |     // Old-format data in DB — new-format rendering cannot yet be verified via browser.
  116 |     // Run a batch with the v3.0 team prompts (Story 10.1) to populate new team readings.
  117 |     test.info().annotations.push({
  118 |       type: 'info',
  119 |       description:
  120 |         'No new-format team reading in DB yet. Metrics section test skipped. ' +
  121 |         'Run a v3.0 batch to populate new team readings and re-run this test.',
  122 |     })
```