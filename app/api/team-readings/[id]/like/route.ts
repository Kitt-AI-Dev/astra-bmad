import { NextResponse } from 'next/server'
import { applyReaction } from '@/lib/reading-reactions'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await applyReaction('team_readings', id, 'likes_count', 1)
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(result)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await applyReaction('team_readings', id, 'likes_count', -1)
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(result)
}
