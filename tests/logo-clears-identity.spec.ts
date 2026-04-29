import { test, expect } from '@playwright/test'

// Clicking the logo clears the identity cookie and navigates to /,
// where HomeRedirect (finding no cookie) shows the selector instead of redirecting.

test('logo click clears prefs and shows identity selector', async ({ page, context }) => {
  // Seed the identity cookie so HomeRedirect would normally redirect
  await context.addCookies([{
    name: '404tune_prefs',
    value: JSON.stringify({ sign: 'aries', role: 'software-engineer' }),
    domain: 'localhost',
    path: '/',
  }])

  await page.goto('/aries/software-engineer')

  // Click the logo
  await page.getByRole('link', { name: '404tune — change identity' }).click()

  // Should land on / (no ?change=1 needed — cookie is already cleared)
  await expect(page).toHaveURL('/')

  // Selector is visible (HomeRedirect did not redirect away)
  await expect(page.locator('fieldset').filter({ hasText: '// select role' })).toBeVisible()

  // Cookie is gone
  const cookies = await context.cookies()
  const prefsCookie = cookies.find(c => c.name === '404tune_prefs')
  expect(prefsCookie).toBeUndefined()
})
