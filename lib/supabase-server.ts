import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client. Three caller classes today:
//   - /admin pages and /api/admin/* — auth enforced by middleware.ts
//   - /api/cron/*                   — auth enforced by CRON_SECRET in the route
//   - /api/{readings,team-readings}/[id]/{like,dislike} — PUBLIC by design
//     (v1 reaction endpoints; see Epic 16 / Story 16.1). Counter writes are
//     the only mutation; trust model is "anyone with a reading id can vote".
// Using the SSR client here would attach the user's JWT and break
// RLS-protected writes for the first two classes.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
  if (!key) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
