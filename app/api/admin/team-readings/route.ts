import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)

  const [y, m] = month.split('-').map(Number)
  const nextMonth = m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, '0')}`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_readings')
    .select('id, date, slot, content, suppressed')
    .gte('date', `${month}-01`)
    .lt('date', `${nextMonth}-01`)
    .order('date', { ascending: false })
    .order('slot', { ascending: true })

  if (error) {
    console.error('[api/admin/team-readings] query failed:', error.message)
    return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
