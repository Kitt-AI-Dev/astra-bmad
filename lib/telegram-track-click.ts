import 'server-only'
import { createClient } from '@/lib/supabase-server'

const UUID_RE = /^[0-9a-f-]{36}$/i

// Fire-and-forget UPDATE on first click. Never throws, never logs on the
// happy path. Orphan tokens are silent. Caller (server component) MUST
// be safe to invoke without awaiting; the page render must not block.
export async function recordTelegramClick(pushId: string): Promise<void> {
  if (!UUID_RE.test(pushId)) return
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('telegram_push_events')
      .update({ clicked_at: new Date().toISOString() })
      .eq('push_id', pushId)
      .is('clicked_at', null)
    if (error) {
      console.warn('[telegram-track-click] update failed:', error.message)
    }
  } catch (err) {
    console.warn(
      '[telegram-track-click] unexpected error:',
      err instanceof Error ? err.message : err,
    )
  }
}
