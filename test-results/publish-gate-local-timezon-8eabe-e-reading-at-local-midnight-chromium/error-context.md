# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: publish-gate-local-timezone.spec.ts >> reader east of UTC sees their local-date reading at local midnight
- Location: tests/publish-gate-local-timezone.spec.ts:13:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByText('// reading not yet published')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByText('// reading not yet published')
    9 × locator resolved to 1 element
      - unexpected value "1"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to reading" [ref=e2] [cursor=pointer]:
    - /url: "#reading"
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - link "404tune — change identity" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e7]
          - generic [ref=e8]: 404tune
        - group [ref=e9]:
          - generic "☰" [ref=e10] [cursor=pointer]
      - paragraph [ref=e11]: $ 404tune --sign aries --role frontend --date 2026-04-30
      - article [ref=e13]:
        - paragraph [ref=e14]: // reading not yet published
  - button "Open Next.js Dev Tools" [ref=e20] [cursor=pointer]:
    - img [ref=e21]
  - alert [ref=e24]
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
  18 |   await page.goto(`/aries/frontend/${localDate}`)
  19 | 
> 20 |   await expect(page.getByText('// reading not yet published')).toHaveCount(0)
     |                                                                ^ Error: expect(locator).toHaveCount(expected) failed
  21 |   await expect(page.locator('article')).toBeVisible()
  22 | })
  23 | 
```