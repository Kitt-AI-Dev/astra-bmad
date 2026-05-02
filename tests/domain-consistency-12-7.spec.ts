import { test, expect, type Page } from '@playwright/test'

async function findJsonLd(page: Page, type: string): Promise<Record<string, unknown> | null> {
  const scripts = await page.locator('script[type="application/ld+json"]').all()
  for (const script of scripts) {
    const text = await script.textContent()
    if (!text) continue
    try {
      const schema = JSON.parse(text) as Record<string, unknown>
      if (schema['@type'] === type) return schema
    } catch { /* not JSON */ }
  }
  return null
}

test.describe('URL domain consistency (12.7)', () => {
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

  test('robots.txt sitemap pointer does not reference 404tune.app', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('Sitemap:')
    expect(text).not.toContain('404tune.app')
  })

  test('sitemap.xml entries do not reference 404tune.app', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('<urlset')
    expect(text).not.toContain('404tune.app')
  })

  test('WebSite JSON-LD url has trailing slash', async ({ page }) => {
    await page.goto('/')
    const schema = await findJsonLd(page, 'WebSite')
    expect(schema).not.toBeNull()
    expect(schema!.url).toBe('https://404tune.dev/')
  })
})
