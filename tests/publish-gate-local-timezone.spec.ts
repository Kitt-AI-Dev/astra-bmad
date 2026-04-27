import { test, expect } from '@playwright/test'

// Verifies the RLS publish gate (`date <= CURRENT_DATE + 1`) lets a positive-UTC
// reader see today's local-date reading even when UTC is still on yesterday.
//
// Strategy: emulate a UTC+10 timezone, navigate to the explicit local-date URL,
// and assert the page renders an actual reading (not the "not yet published"
// placeholder). We pick a date one day ahead of UTC; the RLS +1 buffer must
// permit it.

test.use({ timezoneId: 'Australia/Sydney' })

test('reader east of UTC sees their local-date reading at local midnight', async ({ page }) => {
  const tomorrowUtc = new Date()
  tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1)
  const localDate = tomorrowUtc.toISOString().slice(0, 10)

  await page.goto(`/aries/frontend/${localDate}`)

  await expect(page.getByText('// reading not yet published')).toHaveCount(0)
  await expect(page.locator('article')).toBeVisible()
})
