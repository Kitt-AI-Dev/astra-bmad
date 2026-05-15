import { test, expect } from '@playwright/test'

// The $ subscribe button on the reading page must build a Telegram deep-link
// containing the visitor's timezone offset, and — when the prefs cookie is set —
// their sign and role. The webhook then receives /start with this payload and
// configures the subscriber in one shot. See lib/telegram-webhook.ts.

const READING_URL = 'http://localhost:3000/aries/software-engineer'
const PREFS_COOKIE = '404tune_prefs'

test.describe('$ subscribe button — Telegram deep-link payload', () => {
  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.error(`[browser ${msg.type()}]`, msg.text())
      }
    })
  })

  test('without prefs cookie, payload is tz-only', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(READING_URL)

    const link = page.locator('a:has-text("$ subscribe")')
    await expect(link).toBeVisible()

    const href = await link.getAttribute('href')
    expect(href).toMatch(/^https:\/\/t\.me\/.+\?start=tz_-?\d+$/)
  })

  test('with prefs cookie, payload includes sign and role', async ({ page }) => {
    await page.context().addCookies([{
      name: PREFS_COOKIE,
      value: encodeURIComponent(JSON.stringify({ sign: 'aries', role: 'software-engineer' })),
      domain: 'localhost',
      path: '/',
    }])
    await page.goto(READING_URL)

    const link = page.locator('a:has-text("$ subscribe")')
    await expect(link).toBeVisible()

    const href = await link.getAttribute('href')
    expect(href).toMatch(/^https:\/\/t\.me\/.+\?start=tz_-?\d+_aries_software-engineer$/)
  })

  test('payload offset matches the browser timezone', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(READING_URL)

    const link = page.locator('a:has-text("$ subscribe")')
    await expect(link).toBeVisible()

    const href = await link.getAttribute('href')
    const payloadOffset = href!.match(/\?start=tz_(-?\d+)/)?.[1]
    const browserOffset = await page.evaluate(() => -new Date().getTimezoneOffset())
    expect(Number(payloadOffset)).toBe(browserOffset)
  })
})
