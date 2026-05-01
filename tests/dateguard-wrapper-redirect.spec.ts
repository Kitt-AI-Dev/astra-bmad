import { test, expect } from '@playwright/test'

// Regression test for Story 9.3 AC2.
//
// Verifies the root page `/aries/frontend` in a non-UTC timezone redirects via
// DateGuard without exposing (potentially stale) cached reading content during
// transit. The wrapper pattern must hide children during the redirect window so
// the user does not see yesterday's reading flash before being redirected.
//
// A regression to the previous sibling-style DateGuard would still pass the
// final assertions (the destination page renders correctly), so the key
// assertion here is that the redirect actually happens — which it does only
// when DateGuard runs and triggers `router.replace`.
//
// The redirect only fires when localDate !== serverDate. UTC's day spans 24
// hours but no single timezone offset is always different from UTC (max ±14h),
// so we pick dynamically based on the current UTC hour:
//   - UTC hour < 11: Etc/GMT+12 (which means UTC-12) → previous calendar day
//   - UTC hour ≥ 11: Pacific/Kiritimati (UTC+14)     → next calendar day
// The boundary at 11 (rather than 12) gives a 1+ hour safety margin so a slow
// test that crosses the UTC 12:00 boundary mid-run still picks a timezone that
// differs from UTC. Both timezones are valid at HH=11.
const utcHour = new Date().getUTCHours()
const timezoneId = utcHour < 11 ? 'Etc/GMT+12' : 'Pacific/Kiritimati'

test.use({ timezoneId })

test('root page DateGuard redirects to local-date URL', async ({ page }) => {
  await page.goto('/aries/frontend')

  // DateGuard redirects to /aries/frontend/{local-date}
  await page.waitForURL(/\/aries\/frontend\/\d{4}-\d{2}-\d{2}$/, { timeout: 5000 })

  // After redirect, the page should not show the "not yet published" placeholder
  // (assumes the corresponding reading exists in the DB; if it doesn't, this
  // assertion will surface that gap rather than silently passing)
  await expect(page.getByText('// reading not yet published')).toHaveCount(0)
})
