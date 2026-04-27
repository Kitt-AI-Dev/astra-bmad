import { test, expect } from '@playwright/test'

// Verifies new and renamed roles render a reading page, not a Next.js error.
// New roles (project-manager, pr-manager, hr-manager, marketing) will show
// "not yet published" until readings for those roles are generated and in the DB.
// The renamed role (designer, formerly ux-designer) will also show "not yet
// published" until existing readings are migrated or a new batch is generated.

const ROLES_TO_CHECK = [
  'designer',          // renamed from ux-designer
  'project-manager',
  'pr-manager',
  'hr-manager',
  'marketing',
]

for (const role of ROLES_TO_CHECK) {
  test(`/aries/${role} renders a valid page (not a Next.js 404)`, async ({ page }) => {
    const response = await page.goto(`/aries/${role}`)
    expect(response?.status()).toBe(200)
    // The app is named "404tune" so we can't grep the title for "404".
    // Instead assert the app shell is present, which proves we're not on
    // the Next.js unhandled-error or not-found page.
    await expect(page.locator('header')).toBeVisible()
  })
}

test('role selector shows exactly 12 role chips', async ({ page }) => {
  await page.goto('/')
  // Scope to the "select role" fieldset to avoid matching sign chips
  const roleFieldset = page.locator('fieldset').filter({ hasText: '// select role' })
  const roleButtons = roleFieldset.locator('[role="radio"]')
  await expect(roleButtons).toHaveCount(12)
})
