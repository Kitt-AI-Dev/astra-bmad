import { test, expect } from '@playwright/test'

test.describe('Site footer', () => {
  test('footer visible on homepage with clean console', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/')
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('link', { name: 'privacy policy' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'terms of service' })).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  test('footer visible on /privacy', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/privacy')
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByRole('link', { name: 'privacy policy' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'terms of service' })).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /privacy:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  test('footer visible on /terms', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/terms')
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('link', { name: 'privacy policy' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'terms of service' })).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /terms:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  test('footer visible on reading page /aries/frontend', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/aries/frontend')
    // DateGuard may redirect to a date-specific URL — wait for either
    await page.waitForURL(/\/aries\/frontend(\/\d{4}-\d{2}-\d{2})?$/, { timeout: 5000 })
    await expect(page.getByRole('contentinfo')).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /aries/frontend:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  test('footer visible on team page', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:3000/team')
    // Footer renders synchronously before the /team/{uuid} redirect fires
    await expect(page.getByRole('contentinfo')).toBeVisible()

    expect(
      consoleMessages,
      `Unexpected console output on /team:\n${consoleMessages.join('\n')}`,
    ).toHaveLength(0)
  })

  test('footer privacy link navigates to /privacy', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await page.getByRole('link', { name: 'privacy policy' }).click()
    await expect(page).toHaveURL(/\/privacy$/)
  })

  test('footer terms link navigates to /terms', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await page.getByRole('link', { name: 'terms of service' }).click()
    await expect(page).toHaveURL(/\/terms$/)
  })

  test('/admin/readings redirects unauthenticated users to /admin/login', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/readings')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
