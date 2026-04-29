import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildPrompt, getMonthTheme } from '@/scripts/batch-utils'
import { SIGNS, ROLES } from '@/lib/constants'
import type { Sign, Role } from '@/lib/constants'

export async function POST(request: Request) {
  const body = (await request.json()) as { sign: string; role: string; date: string }
  const { sign, role, date } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  if (!SIGNS.includes(sign as Sign) || !ROLES.includes(role as Role) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, error: 'Invalid sign, role, or date' }, { status: 400 })
  }

  const monthTheme = getMonthTheme(date.slice(0, 7))
  const prompt = buildPrompt(sign, role, date, monthTheme)

  let content: string
  try {
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    content = (message.content[0] as Anthropic.TextBlock).text
  } catch (err) {
    console.error('[api/admin/day/generate] Anthropic error:', err)
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: upserted, error: upsertError } = await supabase
    .from('readings')
    .upsert(
      { sign, role, date, content, batch_month: date.slice(0, 7), suppressed: false },
      { onConflict: 'sign,role,date' }
    )
    .select('id')
    .single()

  if (upsertError || !upserted) {
    console.error('[api/admin/day/generate] upsert error:', upsertError?.message)
    return NextResponse.json({ success: false, error: 'DB write failed' }, { status: 500 })
  }

  revalidatePath(`/${sign}/${role}/${date}`)
  revalidatePath(`/${sign}/${role}`)

  return NextResponse.json({ success: true, content, id: upserted.id })
}
