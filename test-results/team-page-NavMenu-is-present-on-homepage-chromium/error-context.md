# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: team-page.spec.ts >> NavMenu is present on homepage
- Location: tests/team-page.spec.ts:26:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('/api/team/today responds 200', async ({ request }) => {
  4  |   const res = await request.get('http://localhost:3000/api/team/today')
  5  |   // 200 = route is live (migration applied); array may be empty if batch not run
  6  |   expect(res.status()).toBe(200)
  7  |   const body = await res.json()
  8  |   expect(Array.isArray(body)).toBe(true)
  9  | })
  10 | 
  11 | test('/team/[invalid-uuid] renders placeholder, not error page', async ({ page }) => {
  12 |   await page.goto('http://localhost:3000/team/00000000-0000-0000-0000-000000000000')
  13 |   // Check page contains the placeholder text (use content check to avoid apostrophe regex issue)
  14 |   const content = await page.content()
  15 |   expect(content).toContain('even the cosmos')
  16 | })
  17 | 
  18 | test('/team renders without crashing', async ({ page }) => {
  19 |   await page.goto('http://localhost:3000/team')
  20 |   await page.waitForLoadState('networkidle')
  21 |   // Either redirected to /team/{uuid} or shows placeholder — either is acceptable
  22 |   const url = page.url()
  23 |   expect(url).toMatch(/\/team(\/[0-9a-f-]+)?$/)
  24 | })
  25 | 
  26 | test('NavMenu is present on homepage', async ({ page }) => {
> 27 |   await page.goto('http://localhost:3000/')
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  28 |   await expect(page.locator('details summary')).toBeVisible()
  29 | })
  30 | 
```