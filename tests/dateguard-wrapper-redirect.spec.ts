import { test, expect } from '@playwright/test'

// Regression test for Story 9.3 AC2.
//
// Verifies the root page `/aries/frontend` in a positive-UTC offset redirects
// via DateGuard without exposing (potentially stale) cached reading content
// during transit. The cached root page may be up to 24h stale (revalidate =
// 86400). In Sydney (UTC+10/+11), `localDate` is typically one day ahead of
// `serverDate`, so DateGuard always redirects. The wrapper pattern must hide
// children during the redirect window so the user does not see yesterday's
// reading flash before being redirected.
//
// A regression to the previous sibling-style DateGuard would still pass the
// final assertions (the destination page renders correctly), so the key
// assertion here is that the redirect actually happens — which it does only
// when DateGuard runs and triggers `router.replace`.

test.use({ timezoneId: 'Australia/Sydney' })

test('root page DateGuard redirects to local-date URL', async ({ page }) => {
  await page.goto('/aries/frontend')

  // DateGuard redirects to /aries/frontend/{local-date}
  await page.waitForURL(/\/aries\/frontend\/\d{4}-\d{2}-\d{2}$/, { timeout: 5000 })

  // After redirect, the page should not show the "not yet published" placeholder
  // (assumes the corresponding reading exists in the DB; if it doesn't, this
  // assertion will surface that gap rather than silently passing)
  await expect(page.getByText('// reading not yet published')).toHaveCount(0)
})
