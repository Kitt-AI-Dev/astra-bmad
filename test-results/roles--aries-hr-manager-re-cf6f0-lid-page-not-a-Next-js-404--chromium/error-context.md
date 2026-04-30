# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: roles.spec.ts >> /aries/hr-manager renders a valid page (not a Next.js 404)
- Location: tests/roles.spec.ts:18:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/hr-manager
Call log:
  - navigating to "http://localhost:3000/aries/hr-manager", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Verifies new and renamed roles render a reading page, not a Next.js error.
  4  | // New roles (project-manager, pr-manager, hr-manager, marketing) will show
  5  | // "not yet published" until readings for those roles are generated and in the DB.
  6  | // The renamed role (designer, formerly ux-designer) will also show "not yet
  7  | // published" until existing readings are migrated or a new batch is generated.
  8  | 
  9  | const ROLES_TO_CHECK = [
  10 |   'designer',          // renamed from ux-designer
  11 |   'project-manager',
  12 |   'pr-manager',
  13 |   'hr-manager',
  14 |   'marketing',
  15 | ]
  16 | 
  17 | for (const role of ROLES_TO_CHECK) {
  18 |   test(`/aries/${role} renders a valid page (not a Next.js 404)`, async ({ page }) => {
> 19 |     const response = await page.goto(`/aries/${role}`)
     |                                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/aries/hr-manager
  20 |     expect(response?.status()).toBe(200)
  21 |     // The app is named "404tune" so we can't grep the title for "404".
  22 |     // Instead assert the app shell is present, which proves we're not on
  23 |     // the Next.js unhandled-error or not-found page.
  24 |     await expect(page.locator('header')).toBeVisible()
  25 |   })
  26 | }
  27 | 
  28 | test('role selector shows exactly 12 role chips', async ({ page }) => {
  29 |   await page.goto('/')
  30 |   // Scope to the "select role" fieldset to avoid matching sign chips
  31 |   const roleFieldset = page.locator('fieldset').filter({ hasText: '// select role' })
  32 |   const roleButtons = roleFieldset.locator('[role="radio"]')
  33 |   await expect(roleButtons).toHaveCount(12)
  34 | })
  35 | 
```