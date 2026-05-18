import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Verifies the admin readings tables surface the likes/dislikes columns shipped
// in Story 16.4. Two unauthenticated-redirect tests always run (route + middleware
// registration); the authenticated-only tests skip cleanly with a clear message
// when no admin session is present in the test env — mirrors the established
// pattern from tests/admin-telegram-14-4.spec.ts.

function collectConsole(page: Page) {
  const messages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return messages
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

test.describe('16.4 — admin readings tables surface likes/dislikes columns', () => {
  test.describe.configure({ mode: 'serial' })

  test('/admin/readings unauthenticated redirects to /admin/login', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const res = await page.goto('/admin/readings')
    expect(res?.url()).toContain('/admin/login')
    expect(consoleMessages).toEqual([])
  })

  test('/admin/team-readings unauthenticated redirects to /admin/login', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    const res = await page.goto('/admin/team-readings')
    expect(res?.url()).toContain('/admin/login')
    expect(consoleMessages).toEqual([])
  })

  test('authenticated admin sees likes + dislikes columns on /admin/readings', async ({ page }) => {
    const consoleMessages = collectConsole(page)
    await page.goto('/admin/readings')
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'No admin session in test env')
    }
    await expect(
      page.getByRole('columnheader', { name: 'likes', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: 'dislikes', exact: true })
    ).toBeVisible()
    expect(consoleMessages).toEqual([])
  })

  test('authenticated admin sees likes + dislikes columns on /admin/team-readings (month view)', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    await page.goto('/admin/team-readings')
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'No admin session in test env')
    }
    await expect(
      page.getByRole('columnheader', { name: 'likes', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: 'dislikes', exact: true })
    ).toBeVisible()
    expect(consoleMessages).toEqual([])
  })

  test('authenticated admin sees likes + dislikes columns on /admin/team-readings (date view)', async ({
    page,
  }) => {
    const consoleMessages = collectConsole(page)
    await page.goto(`/admin/team-readings?date=${todayUtc()}`)
    if (page.url().includes('/admin/login')) {
      test.skip(true, 'No admin session in test env')
    }
    await expect(
      page.getByRole('columnheader', { name: 'likes', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: 'dislikes', exact: true })
    ).toBeVisible()
    expect(consoleMessages).toEqual([])
  })
})
