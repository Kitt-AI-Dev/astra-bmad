import { test, expect } from '@playwright/test'

// Verifies the revalidate route is registered and protected by auth middleware.
// Full admin UI testing (button click → toast) requires an authenticated session
// which cannot be set up via Playwright without Supabase magic link flow.
//
// A 302 redirect to /admin/login means the route exists and middleware fired.
// A 404 would mean the route was never registered.

test('POST /api/admin/readings/[id]/revalidate is protected (not a 404)', async ({ request }) => {
  const res = await request.post('/api/admin/readings/00000000-0000-0000-0000-000000000000/revalidate', {
    maxRedirects: 0,
  })
  // Middleware redirects unauthenticated requests — any redirect confirms the route exists
  expect([301, 302, 307, 308]).toContain(res.status())
})
