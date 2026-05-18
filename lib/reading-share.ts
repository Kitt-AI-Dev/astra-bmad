import 'server-only'
import { createClient } from '@/lib/supabase-server'

export type ShareTable = 'readings' | 'team_readings'

// Returns true on successful increment, false if the id is malformed
// (Postgres 22P02) or the row does not exist (PGRST116 from .single()).
// Read-modify-write under concurrent requests can lose at most ±1 increment —
// accepted per Story 17.1 spec (counts are signal, not currency).
export async function incrementShareCount(
  table: ShareTable,
  id: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: row, error: readErr } = await supabase
    .from(table)
    .select('share_count')
    .eq('id', id)
    .single<{ share_count: number }>()

  if (readErr || !row) return false

  const { error } = await supabase
    .from(table)
    .update({ share_count: row.share_count + 1 })
    .eq('id', id)

  return !error
}
