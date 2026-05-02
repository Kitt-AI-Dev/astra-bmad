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

test.describe('BreadcrumbList JSON-LD (12.10)', () => {
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

  test('sign/role page has BreadcrumbList with 2 items', async ({ page }) => {
    await page.goto('/aries/software-engineer')
    const schema = await findJsonLd(page, 'BreadcrumbList')
    expect(schema).not.toBeNull()
    expect(schema!['@context']).toBe('https://schema.org')
    const items = schema!.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(2)
    expect(items[0].position).toBe(1)
    expect(items[0].name).toBe('404tune')
    expect(items[0].item).toBe('https://404tune.dev/')
    expect(items[1].position).toBe(2)
    expect(items[1].item).toBe('https://404tune.dev/aries/software-engineer')
  })

  test('date page has BreadcrumbList with 3 items', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')
    const schema = await findJsonLd(page, 'BreadcrumbList')
    expect(schema).not.toBeNull()
    expect(schema!['@context']).toBe('https://schema.org')
    const items = schema!.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items[0].position).toBe(1)
    expect(items[0].name).toBe('404tune')
    expect(items[0].item).toBe('https://404tune.dev/')
    expect(items[1].position).toBe(2)
    expect(items[1].item).toBe('https://404tune.dev/aries/software-engineer')
    expect(items[2].position).toBe(3)
    expect(items[2].name).toBe('2026-05-01')
    expect(items[2].item).toBe('https://404tune.dev/aries/software-engineer/2026-05-01')
  })

  test('sign/role page still has CreativeWork JSON-LD (regression)', async ({ page }) => {
    await page.goto('/aries/software-engineer')
    const schema = await findJsonLd(page, 'CreativeWork')
    expect(schema).not.toBeNull()
  })

  test('date page still has CreativeWork JSON-LD (regression)', async ({ page }) => {
    await page.goto('/aries/software-engineer/2026-05-01')
    const schema = await findJsonLd(page, 'CreativeWork')
    expect(schema).not.toBeNull()
  })
})
