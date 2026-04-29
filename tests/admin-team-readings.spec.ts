import { test, expect } from '@playwright/test'

// Verifies admin team-readings routes are registered and protected by auth middleware.
// Full UI testing requires an authenticated session (not feasible in Playwright without
// Supabase magic link flow). A redirect to /admin/login confirms the route exists and
// middleware fired; a 404 would mean the route was never registered.

test('GET /api/admin/team-readings is protected', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/admin/team-readings', {
    maxRedirects: 0,
  })
  expect([301, 302, 307, 308]).toContain(res.status())
})

test('PATCH /api/admin/team-readings/[id] is protected', async ({ request }) => {
  const res = await request.patch(
    'http://localhost:3000/api/admin/team-readings/00000000-0000-0000-0000-000000000000',
    { maxRedirects: 0, data: { content: 'test' } }
  )
  expect([301, 302, 307, 308]).toContain(res.status())
})

test('POST /api/admin/team-readings/[id]/revalidate is protected', async ({ request }) => {
  const res = await request.post(
    'http://localhost:3000/api/admin/team-readings/00000000-0000-0000-0000-000000000000/revalidate',
    { maxRedirects: 0 }
  )
  expect([301, 302, 307, 308]).toContain(res.status())
})
