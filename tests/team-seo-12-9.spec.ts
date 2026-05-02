import { test, expect, type APIRequestContext } from '@playwright/test'

async function getTeamReadingId(request: APIRequestContext) {
  const response = await request.get('/api/team/today')
  expect(response.status()).toBe(200)
  const readings = await response.json() as { id: string }[]
  if (!readings.length) {
    test.skip()
    return null
  }
  return readings[0].id
}

test.describe('team page SEO (12.9)', () => {
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

  test('/team page has title tag', async ({ page }) => {
    await page.goto('/team')
    await expect(page).toHaveTitle(/Team Horoscope.*404tune/)
  })

  test('/team page has meta description', async ({ page }) => {
    await page.goto('/team')
    const desc = page.locator('meta[name="description"]')
    await expect(desc).toHaveAttribute('content', /.+/)
  })

  test('/team/[invalid-uuid] renders placeholder without crashing', async ({ page }) => {
    await page.goto('/team/00000000-0000-0000-0000-000000000000')
    // Should render the page with a heading, not a 404
    await expect(page.locator('h1')).toBeVisible()
  })

  test('/team/[id] page has dynamic metadata and og:image', async ({ page, request }) => {
    const id = await getTeamReadingId(request)
    if (!id) return

    await page.goto(`/team/${id}`)
    await expect(page).not.toHaveTitle('Team Horoscope — 404tune')
    const desc = page.locator('meta[name="description"]')
    await expect(desc).not.toHaveAttribute('content', "Your team's daily reading from 404tune")
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveCount(1)
  })
})
