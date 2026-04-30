# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dateguard-wrapper-redirect.spec.ts >> root page DateGuard redirects to local-date URL
- Location: tests/dateguard-wrapper-redirect.spec.ts:20:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/frontend
Call log:
  - navigating to "http://localhost:3000/aries/frontend", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Regression test for Story 9.3 AC2.
  4  | //
  5  | // Verifies the root page `/aries/frontend` in a positive-UTC offset redirects
  6  | // via DateGuard without exposing (potentially stale) cached reading content
  7  | // during transit. The cached root page may be up to 24h stale (revalidate =
  8  | // 86400). In Sydney (UTC+10/+11), `localDate` is typically one day ahead of
  9  | // `serverDate`, so DateGuard always redirects. The wrapper pattern must hide
  10 | // children during the redirect window so the user does not see yesterday's
  11 | // reading flash before being redirected.
  12 | //
  13 | // A regression to the previous sibling-style DateGuard would still pass the
  14 | // final assertions (the destination page renders correctly), so the key
  15 | // assertion here is that the redirect actually happens — which it does only
  16 | // when DateGuard runs and triggers `router.replace`.
  17 | 
  18 | test.use({ timezoneId: 'Australia/Sydney' })
  19 | 
  20 | test('root page DateGuard redirects to local-date URL', async ({ page }) => {
> 21 |   await page.goto('/aries/frontend')
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/frontend
  22 | 
  23 |   // DateGuard redirects to /aries/frontend/{local-date}
  24 |   await page.waitForURL(/\/aries\/frontend\/\d{4}-\d{2}-\d{2}$/, { timeout: 5000 })
  25 | 
  26 |   // After redirect, the page should not show the "not yet published" placeholder
  27 |   // (assumes the corresponding reading exists in the DB; if it doesn't, this
  28 |   // assertion will surface that gap rather than silently passing)
  29 |   await expect(page.getByText('// reading not yet published')).toHaveCount(0)
  30 | })
  31 | 
```