# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: publish-gate-local-timezone.spec.ts >> reader east of UTC sees their local-date reading at local midnight
- Location: tests/publish-gate-local-timezone.spec.ts:13:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/frontend/2026-05-01
Call log:
  - navigating to "http://localhost:3000/aries/frontend/2026-05-01", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Verifies the RLS publish gate (`date <= CURRENT_DATE + 1`) lets a positive-UTC
  4  | // reader see today's local-date reading even when UTC is still on yesterday.
  5  | //
  6  | // Strategy: emulate a UTC+10 timezone, navigate to the explicit local-date URL,
  7  | // and assert the page renders an actual reading (not the "not yet published"
  8  | // placeholder). We pick a date one day ahead of UTC; the RLS +1 buffer must
  9  | // permit it.
  10 | 
  11 | test.use({ timezoneId: 'Australia/Sydney' })
  12 | 
  13 | test('reader east of UTC sees their local-date reading at local midnight', async ({ page }) => {
  14 |   const tomorrowUtc = new Date()
  15 |   tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1)
  16 |   const localDate = tomorrowUtc.toISOString().slice(0, 10)
  17 | 
> 18 |   await page.goto(`/aries/frontend/${localDate}`)
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/frontend/2026-05-01
  19 | 
  20 |   await expect(page.getByText('// reading not yet published')).toHaveCount(0)
  21 |   await expect(page.locator('article')).toBeVisible()
  22 | })
  23 | 
```