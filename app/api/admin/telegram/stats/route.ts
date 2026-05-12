import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getTelegramSubscriberStats, type TelegramStatsClient } from '@/lib/admin-telegram-stats'

export async function GET() {
  try {
    const supabase = await createClient()
    const stats = await getTelegramSubscriberStats(supabase as unknown as TelegramStatsClient)
    return NextResponse.json(stats)
  } catch (err) {
    console.error(
      '[api/admin/telegram/stats] DB error:',
      err instanceof Error ? err.message : err
    )
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
  }
}
