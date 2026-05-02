import { test, expect } from '@playwright/test'

// Story 12.4: every public page must have exactly one <h1>.

test.describe('semantic h1 — one per page (12.4)', () => {
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

  test('homepage has exactly one h1', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('sign/role page has exactly one h1', async ({ page }) => {
    await page.goto('/aries/software-engineer')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('date page has exactly one h1', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('team reading page has exactly one h1', async ({ page, request }) => {
    let readings: { id: string }[] = []
    try {
      const res = await request.get('http://localhost:3000/api/team/today')
      if (res.ok()) readings = await res.json() as { id: string }[]
    } catch {
      // API unavailable — skip gracefully
    }
    if (!readings.length) {
      test.skip()
      return
    }
    await page.goto(`/team/${readings[0].id}`)
    await expect(page.locator('h1')).toHaveCount(1)
  })
})
