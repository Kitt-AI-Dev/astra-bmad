import { test, expect } from '@playwright/test'

// Story 12.3: og:image and twitter:image must be present on all pages,
// pointing to the correct opengraph-image route URL.

test.describe('OG image and Twitter image tags (12.3)', () => {
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

  test('date page has og:image and twitter:image pointing to opengraph-image route', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).not.toBeNull()
    expect(ogImage).toContain('/opengraph-image')

    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content')
    expect(twitterImage).not.toBeNull()
    expect(twitterImage).toContain('/opengraph-image')
  })

  test('sign/role page has og:image and twitter:image pointing to root opengraph-image route', async ({ page }) => {
    await page.goto('/aries/software-engineer')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).not.toBeNull()
    expect(ogImage).toContain('/opengraph-image')

    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content')
    expect(twitterImage).not.toBeNull()
    expect(twitterImage).toContain('/opengraph-image')
  })

  test('homepage has og:image', async ({ page }) => {
    await page.goto('/')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).not.toBeNull()
    expect(ogImage).toContain('/opengraph-image')
  })
})
