import { test, expect } from '@playwright/test'

// Verifies the generate routes are registered and protected by auth middleware.
// A 302/307 redirect means the route exists and middleware fired.
// A 404 would mean the route was never registered.

test('POST /api/admin/day/generate is protected (not a 404)', async ({ request }) => {
  const res = await request.post('/api/admin/day/generate', {
    data: { sign: 'aries', role: 'software-engineer', date: '2026-01-01' },
    maxRedirects: 0,
  })
  expect([301, 302, 307, 308]).toContain(res.status())
})

test('POST /api/admin/day/generate-team is protected (not a 404)', async ({ request }) => {
  const res = await request.post('/api/admin/day/generate-team', {
    data: { slot: 1, date: '2026-01-01' },
    maxRedirects: 0,
  })
  expect([301, 302, 307, 308]).toContain(res.status())
})
