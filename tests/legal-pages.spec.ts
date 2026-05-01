import { test, expect } from '@playwright/test'

test.describe('Legal pages', () => {
  test('/privacy browser cookie-clearing links are reachable', async ({ page, request }) => {
    await page.goto('http://localhost:3000/privacy')

    for (const browser of ['Chrome', 'Firefox', 'Safari', 'Edge']) {
      const link = page.getByRole('link', { name: browser })
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      expect(href, `${browser} link has no href`).toBeTruthy()
      const response = await request.get(href!)
      expect(
        response.status(),
        `${browser} link returned ${response.status()}: ${href}`,
      ).toBeLessThan(400)
    }
  })

  test('/privacy renders Privacy Policy with Header and clean console', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/privacy')
    await expect(page).toHaveTitle(/Privacy Policy/)
    // Header (NavMenu summary) is visible
    await expect(page.locator('details summary')).toBeVisible()
    // Document headline visible (lowercase, terminal aesthetic)
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible()
    // Section headings present
    await expect(page.getByRole('heading', { name: /cookies we use/i })).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /privacy:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  test('/terms renders Terms of Service with Header and clean console', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/terms')
    await expect(page).toHaveTitle(/Terms of Service/)
    await expect(page.locator('details summary')).toBeVisible()
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /limitation of liability/i })).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /terms:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  // =========================================================================
  // PROTECTED: DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL
  // These assertions verify the mandatory joke-app disclaimer on /terms.
  // The disclaimer text and its presence on the page are requirements set
  // directly by Kitt and must not be weakened, removed, or reworded without
  // Kitt explicitly approving the change in writing.
  // =========================================================================
  test('/terms disclaimer is present and complete [PROTECTED — do not modify without Kitt approval]', async ({
    page,
  }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/terms')

    // Disclaimer section heading must be visible
    await expect(page.getByRole('heading', { name: /^disclaimer$/i })).toBeVisible()

    // Core joke-app statement
    await expect(
      page.getByText('404tune is a joke app', { exact: false }),
    ).toBeVisible()

    // All predictions are jokes — no decision-making basis
    await expect(
      page.getByText('Every reading, prediction, and cosmic pronouncement', { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByText('Nothing here should be used as the basis for any', { exact: false }),
    ).toBeVisible()

    // No liability statement
    await expect(
      page.getByText('404tune accepts no liability whatsoever for any outcome', { exact: false }),
    ).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /terms disclaimer:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })
})
