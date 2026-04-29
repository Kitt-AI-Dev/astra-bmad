import { test, expect } from '@playwright/test'

test('/api/team/today responds 200', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/team/today')
  // 200 = route is live (migration applied); array may be empty if batch not run
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body)).toBe(true)
})

test('/team/[invalid-uuid] renders placeholder, not error page', async ({ page }) => {
  await page.goto('http://localhost:3000/team/00000000-0000-0000-0000-000000000000')
  // Check page contains the placeholder text (use content check to avoid apostrophe regex issue)
  const content = await page.content()
  expect(content).toContain('even the cosmos')
})

test('/team renders without crashing', async ({ page }) => {
  await page.goto('http://localhost:3000/team')
  await page.waitForLoadState('networkidle')
  // Either redirected to /team/{uuid} or shows placeholder — either is acceptable
  const url = page.url()
  expect(url).toMatch(/\/team(\/[0-9a-f-]+)?$/)
})

test('NavMenu is present on homepage', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await expect(page.locator('details summary')).toBeVisible()
})
