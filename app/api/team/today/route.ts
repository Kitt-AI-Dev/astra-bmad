import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase-server-public'

export const revalidate = 60

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('team_readings')
    .select('id, slot')
    .eq('date', today)
    .eq('suppressed', false)

  if (error) {
    console.error('[api/team/today] Supabase error:', error.message)
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(data ?? [])
}
