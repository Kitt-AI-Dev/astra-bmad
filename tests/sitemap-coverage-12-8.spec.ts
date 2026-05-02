import { test, expect } from '@playwright/test'

type SitemapEntry = {
  loc: string
  changefreq: string
  priority: string
}

function parseSitemapEntries(xml: string): SitemapEntry[] {
  return (xml.match(/<url>[\s\S]*?<\/url>/g) ?? []).map((block) => ({
    loc: block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '',
    changefreq: block.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1] ?? '',
    priority: block.match(/<priority>([^<]+)<\/priority>/)?.[1] ?? '',
  }))
}

function findEntry(entries: SitemapEntry[], pathname: string): SitemapEntry | undefined {
  return entries.find((entry) => new URL(entry.loc).pathname === pathname)
}

test.describe('sitemap coverage (12.8)', () => {
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

  test('sitemap.xml includes homepage and team entries with required metadata', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('<urlset')
    const entries = parseSitemapEntries(text)

    expect(findEntry(entries, '/')).toMatchObject({ changefreq: 'weekly', priority: '1' })
    expect(findEntry(entries, '/team')).toMatchObject({ changefreq: 'daily', priority: '0.5' })
  })

  test('sitemap.xml excludes legal pages', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const text = await response.text()
    const entries = parseSitemapEntries(text)

    // Protected decision: /privacy and /terms must not be added to the sitemap without explicit Kitt approval.
    expect(findEntry(entries, '/privacy')).toBeUndefined()
    expect(findEntry(entries, '/terms')).toBeUndefined()
  })
})
