import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json()) as { content?: string; suppressed?: boolean }

  if (typeof body.content !== 'string' && typeof body.suppressed !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'No valid fields to update' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.content === 'string') updates.content = body.content
  if (typeof body.suppressed === 'boolean') updates.suppressed = body.suppressed

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_readings')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('[api/admin/team-readings] update failed:', error.message)
    return NextResponse.json(
      { success: false, error: 'Update failed' },
      { status: 500 }
    )
  }

  revalidatePath(`/team/${id}`)

  return NextResponse.json({ success: true })
}
