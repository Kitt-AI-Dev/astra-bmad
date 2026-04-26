import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for admin/cron paths. Auth is enforced by middleware
// (admin) or CRON_SECRET (cron) before any caller reaches this; using the SSR
// client here would attach the user's JWT and break RLS-protected writes.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
  if (!key) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
