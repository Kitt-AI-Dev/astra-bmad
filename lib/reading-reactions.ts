import 'server-only'
import { createClient } from '@/lib/supabase-server'

export type ReactionTable = 'readings' | 'team_readings'
export type ReactionColumn = 'likes_count' | 'dislikes_count'
export type ReactionCounts = { likes_count: number; dislikes_count: number }

// Returns the post-update counts, or null if the id is malformed (Postgres
// 22P02 on bad UUID syntax) or the row does not exist (PGRST116 from .single).
// Read-modify-write under concurrent requests can lose at most ±1 increment —
// accepted per Story 16.1 spec (counts are signal, not currency).
export async function applyReaction(
  table: ReactionTable,
  id: string,
  column: ReactionColumn,
  delta: 1 | -1
): Promise<ReactionCounts | null> {
  const supabase = await createClient()

  const { data: row, error: readErr } = await supabase
    .from(table)
    .select('likes_count, dislikes_count')
    .eq('id', id)
    .single<ReactionCounts>()

  if (readErr || !row) return null

  const nextValue = Math.max(0, row[column] + delta)

  const { data, error } = await supabase
    .from(table)
    .update({ [column]: nextValue })
    .eq('id', id)
    .select('likes_count, dislikes_count')
    .single<ReactionCounts>()

  if (error || !data) return null

  return data
}
