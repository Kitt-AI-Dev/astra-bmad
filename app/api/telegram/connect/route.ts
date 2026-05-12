import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { SIGNS, ROLES } from '@/lib/constants'

function decodeTid(tid: string): number | null {
  try {
    const base64 = tid.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    const n = BigInt(decoded)
    if (n <= BigInt(0)) return null
    return Number(n)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid request body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ success: false, error: 'invalid request body' }, { status: 400 })
  }

  const { tid, sign, role } = body as Record<string, unknown>

  if (typeof tid !== 'string' || !tid) {
    return NextResponse.json({ success: false, error: 'missing tid' }, { status: 400 })
  }
  const chatId = decodeTid(tid)
  if (chatId === null) {
    return NextResponse.json({ success: false, error: 'invalid tid' }, { status: 400 })
  }

  if (typeof sign !== 'string' || !SIGNS.includes(sign as typeof SIGNS[number])) {
    return NextResponse.json({ success: false, error: 'invalid sign' }, { status: 400 })
  }

  if (typeof role !== 'string' || !ROLES.includes(role as typeof ROLES[number])) {
    return NextResponse.json({ success: false, error: 'invalid role' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('telegram_subscribers')
      .upsert(
        { chat_id: chatId, sign, role },
        { onConflict: 'chat_id', ignoreDuplicates: false }
      )

    if (error) {
      console.error('[api/telegram/connect] upsert failed:', error.message)
      return NextResponse.json({ success: false, error: 'database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/telegram/connect] unexpected error:', err)
    return NextResponse.json({ success: false, error: 'internal error' }, { status: 500 })
  }
}
