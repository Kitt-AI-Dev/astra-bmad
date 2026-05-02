import { test, expect, type Page } from '@playwright/test'

const GA_HOST_RE = /googletagmanager\.com|google-analytics\.com/

async function setConsentCookie(page: Page, analytics: boolean) {
  const value = JSON.stringify({
    functional: true,
    analytics,
    timestamp: new Date().toISOString(),
  })
  await page.context().addCookies([
    {
      name: '404tune_consent',
      value: encodeURIComponent(value),
      domain: 'localhost',
      path: '/',
    },
  ])
}

test.describe('Google Analytics 13-1 — consent gate', () => {
  let consoleErrors: string[] = []
  let gaRequests: string[] = []

  test.beforeEach(async ({ page, context }) => {
    consoleErrors = []
    gaRequests = []
    await context.clearCookies()
    page.on('request', (request) => {
      const url = request.url()
      if (GA_HOST_RE.test(url)) gaRequests.push(url)
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
      }
    })
  })

  test('no consent — no GA script injected', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const count = await page.locator('script[src*="googletagmanager"]').count()
    expect(count).toBe(0)
    expect(gaRequests).toHaveLength(0)
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('functional-only consent — no GA script injected', async ({ page }) => {
    await setConsentCookie(page, false)
    await page.goto('http://localhost:3000/')
    const count = await page.locator('script[src*="googletagmanager"]').count()
    expect(count).toBe(0)
    expect(gaRequests).toHaveLength(0)
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('analytics consent — GA script present in DOM', async ({ page }) => {
    await setConsentCookie(page, true)
    await page.goto('http://localhost:3000/')
    await page.waitForSelector('script[src*="googletagmanager"]', { state: 'attached', timeout: 5000 })
    const count = await page.locator('script[src*="googletagmanager"]').count()
    expect(count).toBeGreaterThan(0)
    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])
    expect(JSON.stringify(dataLayer)).toContain('config')
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('clicking accept all injects GA script in the current page session', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0)

    await page.getByRole('button', { name: 'accept all' }).click()
    await page.waitForSelector('script[src*="googletagmanager"]', { state: 'attached', timeout: 5000 })
    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])
    expect(JSON.stringify(dataLayer)).toContain('config')
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('cookie banner does not say "not yet active"', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const bannerText = await page.locator('body').textContent()
    expect(bannerText).not.toContain('not yet active')
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('privacy policy section 4 lists Google Analytics 4', async ({ page }) => {
    await page.goto('http://localhost:3000/privacy')
    await expect(page.getByText('Google Analytics 4 (analytics)')).toBeVisible()
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('privacy policy section 4 lists Vercel Web Analytics', async ({ page }) => {
    await page.goto('http://localhost:3000/privacy')
    await expect(page.getByText('Vercel Web Analytics (usage metrics)')).toBeVisible()
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })
})
