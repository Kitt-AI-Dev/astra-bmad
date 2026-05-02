import { test, expect } from '@playwright/test'

// Story 12.5: homepage must have complete SEO metadata.

test.describe('homepage SEO completeness (12.5)', () => {
  const consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
      }
    })
  })

  test.afterEach(async () => {
    expect(consoleErrors, `Console errors/warnings:\n${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('homepage title contains IT horoscope keyword', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/IT Horoscope/)
  })

  test('homepage meta description contains value prop', async ({ page }) => {
    await page.goto('/')
    const desc = page.locator('meta[name="description"]')
    await expect(desc).toHaveAttribute('content', /zodiac sign and IT role/)
  })

  test('homepage has canonical URL', async ({ page }) => {
    await page.goto('/')
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://404tune.dev/')
  })

  test('homepage has full og block', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /404tune/)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /IT role/)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://404tune.dev/')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', '404tune')
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
  })

  test('homepage has twitter title and description', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', /404tune/)
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', /IT role/)
  })
})
