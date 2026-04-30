# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: logo-clears-identity.spec.ts >> logo click clears prefs and shows identity selector
- Location: tests/logo-clears-identity.spec.ts:6:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/software-engineer
Call log:
  - navigating to "http://localhost:3000/aries/software-engineer", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Clicking the logo clears the identity cookie and navigates to /,
  4  | // where HomeRedirect (finding no cookie) shows the selector instead of redirecting.
  5  | 
  6  | test('logo click clears prefs and shows identity selector', async ({ page, context }) => {
  7  |   // Seed the identity cookie so HomeRedirect would normally redirect
  8  |   await context.addCookies([{
  9  |     name: '404tune_prefs',
  10 |     value: JSON.stringify({ sign: 'aries', role: 'software-engineer' }),
  11 |     domain: 'localhost',
  12 |     path: '/',
  13 |   }])
  14 | 
> 15 |   await page.goto('/aries/software-engineer')
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/software-engineer
  16 | 
  17 |   // Click the logo
  18 |   await page.getByRole('link', { name: '404tune — change identity' }).click()
  19 | 
  20 |   // Should land on / (no ?change=1 needed — cookie is already cleared)
  21 |   await expect(page).toHaveURL('/')
  22 | 
  23 |   // Selector is visible (HomeRedirect did not redirect away)
  24 |   await expect(page.locator('fieldset').filter({ hasText: '// select role' })).toBeVisible()
  25 | 
  26 |   // Cookie is gone
  27 |   const cookies = await context.cookies()
  28 |   const prefsCookie = cookies.find(c => c.name === '404tune_prefs')
  29 |   expect(prefsCookie).toBeUndefined()
  30 | })
  31 | 
```