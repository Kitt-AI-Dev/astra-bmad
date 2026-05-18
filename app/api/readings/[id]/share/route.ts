import { NextResponse } from 'next/server'
import { incrementShareCount } from '@/lib/reading-share'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ok = await incrementShareCount('readings', id)
  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
