import { test, expect, type Page } from '@playwright/test'

// Story 12.6: every content page must have JSON-LD structured data.

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

test.describe('JSON-LD structured data (12.6)', () => {
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

  test('homepage has WebSite JSON-LD', async ({ page }) => {
    await page.goto('/')
    const schema = await findJsonLd(page, 'WebSite')
    expect(schema).not.toBeNull()
    expect(schema!['@context']).toBe('https://schema.org')
    expect(schema!.name).toBe('404tune')
    expect(schema!.url).toBe('https://404tune.dev')
  })

  test('date page has WebSite JSON-LD from layout', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')
    const schema = await findJsonLd(page, 'WebSite')
    expect(schema).not.toBeNull()
    expect(schema!.name).toBe('404tune')
  })

  test('date page has CreativeWork JSON-LD', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')
    const schema = await findJsonLd(page, 'CreativeWork')
    expect(schema).not.toBeNull()
    expect(schema!['@context']).toBe('https://schema.org')
    expect(String(schema!.url)).toContain('/aries/software-engineer/2026-05-01')
    expect(schema!.datePublished).toBe('2026-05-01')
    expect(typeof schema!.description).toBe('string')
    expect(String(schema!.description).length).toBeGreaterThan(0)
  })

  test('sign/role page has CreativeWork JSON-LD', async ({ page }) => {
    await page.goto('/aries/software-engineer')
    const schema = await findJsonLd(page, 'CreativeWork')
    expect(schema).not.toBeNull()
    expect(schema!['@context']).toBe('https://schema.org')
    expect(String(schema!.url)).toContain('/aries/software-engineer')
    expect(String(schema!.datePublished)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(typeof schema!.description).toBe('string')
    expect(String(schema!.description).length).toBeGreaterThan(0)
  })
})
