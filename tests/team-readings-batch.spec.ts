import { test, expect } from '@playwright/test'

// Confirms the team_readings migration is applied and /api/team/today is reachable.
// 200 = team readings exist for today (batch has run).
// 404 = table exists but no readings yet — acceptable before first batch.
// 500 = migration not applied or route broken — failure.

test('team_readings table exists — /api/team/today is reachable', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/team/today')
  expect([200, 404]).toContain(res.status())
})
