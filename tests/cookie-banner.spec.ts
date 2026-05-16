import { test, expect } from '@playwright/test'

test.describe('Cookie banner', () => {
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page, context }) => {
    consoleErrors = []
    await context.clearCookies()
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
      }
    })
  })

  test('banner visible on fresh visit', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.getByText('functional only')).toBeVisible()
    await expect(page.getByText('accept all')).toBeVisible()
    await expect(page.getByRole('link', { name: 'learn more' })).toBeVisible()
    expect(consoleErrors).toHaveLength(0)
  })

  test('accept all sets analytics cookie and hides banner', async ({ page, context }) => {
    await page.goto('http://localhost:3000/')
    await page.getByText('accept all').click()
    await expect(page.getByText('functional only')).not.toBeVisible()
    const cookies = await context.cookies()
    const consent = cookies.find((c) => c.name === '404tune_consent')
    expect(consent).toBeDefined()
    const value = JSON.parse(decodeURIComponent(consent!.value))
    expect(value.analytics).toBe(true)
    expect(value.functional).toBe(true)
    expect(value.timestamp).toBeTruthy()
    expect(consoleErrors, `Unexpected console output on accept all: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('functional only sets analytics: false and hides banner', async ({ page, context }) => {
    await page.goto('http://localhost:3000/')
    await page.getByText('functional only').click()
    await expect(page.getByText('accept all')).not.toBeVisible()
    const cookies = await context.cookies()
    const consent = cookies.find((c) => c.name === '404tune_consent')
    const value = JSON.parse(decodeURIComponent(consent!.value))
    expect(value.analytics).toBe(false)
    expect(value.functional).toBe(true)
    expect(value.timestamp).toBeTruthy()
    expect(consoleErrors, `Unexpected console output on functional only: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('banner hidden on revisit after accepting', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await page.getByText('accept all').click()
    await page.reload()
    await expect(page.getByText('functional only')).not.toBeVisible()
    expect(consoleErrors, `Unexpected console output on revisit: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('banner does not appear on admin pages', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/readings', { waitUntil: 'networkidle' })
    await expect(page.getByText('functional only')).not.toBeVisible()
    expect(consoleErrors, `Unexpected console output on admin page: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('banner reappears when consent cookie is older than 365 days', async ({ page, context }) => {
    const oldTimestamp = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString()
    const value = encodeURIComponent(JSON.stringify({ functional: true, analytics: true, timestamp: oldTimestamp }))
    await context.addCookies([{ name: '404tune_consent', value, domain: 'localhost', path: '/' }])
    await page.goto('http://localhost:3000/')
    await expect(page.getByText('functional only')).toBeVisible()
    expect(consoleErrors, `Unexpected console output on expired consent: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('mobile layout: banner body has full readable width, no horizontal scroll (15.1)', async ({ page }) => {
    // iPhone 14 baseline viewport — reproduces the bug from the retro screenshot
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/')

    const body = page.locator('p').filter({ hasText: '// 404tune uses functional cookies' })
    await expect(body).toBeVisible()

    // Bug was: text wrapped one character per line because the button row
    // consumed ~320px of a ~342px-after-padding viewport. Body width should
    // now use the full available width (minus px-6 padding ~ 342px).
    const bodyWidth = await body.evaluate((el) => el.getBoundingClientRect().width)
    expect(bodyWidth, `banner body width was ${bodyWidth}px — expected > 200`).toBeGreaterThan(200)

    // Page must not scroll horizontally
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(overflow.scrollWidth, `horizontal scroll detected: ${overflow.scrollWidth} > ${overflow.clientWidth}`).toBeLessThanOrEqual(overflow.clientWidth)

    // Buttons remain reachable
    await expect(page.getByText('functional only')).toBeVisible()
    await expect(page.getByText('accept all')).toBeVisible()

    expect(consoleErrors, `Unexpected console output on mobile layout: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })
})
