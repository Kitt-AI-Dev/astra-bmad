import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_readings')
    .select('id')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Team reading not found' }, { status: 404 })
  }

  revalidatePath(`/team/${id}`)

  return NextResponse.json({ revalidated: true, path: `/team/${id}` })
}
