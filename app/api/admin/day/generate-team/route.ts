import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildTeamPrompt, getMonthTheme } from '@/scripts/batch-utils'

export async function POST(request: Request) {
  const body = (await request.json()) as { slot: number; date: string }
  const { slot, date } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  if (typeof slot !== 'number' || !Number.isInteger(slot) || slot < 1 || slot > 12 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, error: 'Invalid slot or date' }, { status: 400 })
  }

  const monthTheme = getMonthTheme(date.slice(0, 7))
  const prompt = buildTeamPrompt(date, slot, monthTheme)

  let content: string
  try {
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    content = (message.content[0] as Anthropic.TextBlock).text
  } catch (err) {
    console.error('[api/admin/day/generate-team] Anthropic error:', err)
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: upserted, error: upsertError } = await supabase
    .from('team_readings')
    .upsert(
      { date, slot, content, suppressed: false },
      { onConflict: 'date,slot' }
    )
    .select('id')
    .single()

  if (upsertError || !upserted) {
    console.error('[api/admin/day/generate-team] upsert error:', upsertError?.message)
    return NextResponse.json({ success: false, error: 'DB write failed' }, { status: 500 })
  }

  revalidatePath(`/team/${upserted.id}`)

  return NextResponse.json({ success: true, content, id: upserted.id })
}
