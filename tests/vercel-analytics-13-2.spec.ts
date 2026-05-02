import { test, expect, type Page } from '@playwright/test'

const ANALYTICS_SCRIPT_SELECTOR =
  'script[src*="va.vercel-scripts.com/v1/script.debug.js"], script[src*="/_vercel/insights/script.js"]'

async function expectVercelAnalytics(page: Page) {
  await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).va === 'function')
  await expect(page.locator(ANALYTICS_SCRIPT_SELECTOR)).toHaveCount(1)
}

async function setConsentCookie(page: Page, analytics: boolean) {
  await page.context().addCookies([
    {
      name: '404tune-consent',
      value: JSON.stringify({ necessary: true, analytics }),
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ])
}

test.describe('Vercel Web Analytics 13-2', () => {
  let consoleErrors: string[] = []

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    consoleErrors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
      }
    })
  })

  test('Vercel Analytics script injected on homepage', async ({ page }) => {
    await page.goto('/')
    await expectVercelAnalytics(page)
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('Vercel Analytics script injected on reading page', async ({ page }) => {
    await page.goto('/aries/frontend')
    await expectVercelAnalytics(page)
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('Vercel Analytics script injected on team page', async ({ page }) => {
    await page.goto('/team')
    await expectVercelAnalytics(page)
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('Vercel Analytics remains injected when analytics cookie consent is declined', async ({ page }) => {
    await setConsentCookie(page, false)
    await page.goto('/')
    await expectVercelAnalytics(page)
    expect(consoleErrors, `Console output: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })
})
