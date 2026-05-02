import { test, expect } from '@playwright/test'

// Story 12.2: meta description must contain readable prose extracted from
// general_reading — not raw JSON or ```json code-fence prefix.

test.describe('meta description — prose extraction (12.2)', () => {
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

  test('sign/role page: description is prose, not raw JSON', async ({ page }) => {
    await page.goto('/aries/software-engineer')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).not.toBeNull()

    // Guard: fallback strings end with "— 404tune"; prose is truncated with "…".
    // If this fires, no reading is in the DB for this fixture and extraction never ran.
    expect(description, 'Description is the site fallback — no reading in DB; extraction path untested').not.toMatch(/— 404tune$/)
    // Must not start with code fence or opening brace
    expect(description).not.toMatch(/^```/)
    expect(description).not.toMatch(/^\{/)
    // Must not contain JSON field names
    expect(description).not.toContain('"general_reading"')
    expect(description).not.toContain('"deploy_luck"')
    // Must not exceed 156 chars (155 + ellipsis)
    expect(description!.length).toBeLessThanOrEqual(156)
  })

  test('sign/role page: og:description matches description and is prose', async ({ page }) => {
    await page.goto('/aries/software-engineer')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content')

    expect(ogDescription).toBe(description)
    expect(twitterDescription).toBe(description)
    expect(ogDescription).not.toMatch(/^```/)
    expect(ogDescription).not.toMatch(/^\{/)
  })

  test('date page: description is prose, not raw JSON', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).not.toBeNull()

    // Guard: fallback strings end with "— 404tune"; prose is truncated with "…".
    // If this fires, no reading is in the DB for this fixture and extraction never ran.
    expect(description, 'Description is the site fallback — no reading in DB; extraction path untested').not.toMatch(/— 404tune$/)
    expect(description).not.toMatch(/^```/)
    expect(description).not.toMatch(/^\{/)
    expect(description).not.toContain('"general_reading"')
    expect(description!.length).toBeLessThanOrEqual(156)
  })

  test('date page: og:description and twitter:description match and are prose', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content')

    expect(ogDescription).toBe(description)
    expect(twitterDescription).toBe(description)
    expect(ogDescription).not.toMatch(/^```/)
    expect(ogDescription).not.toMatch(/^\{/)
  })
})
