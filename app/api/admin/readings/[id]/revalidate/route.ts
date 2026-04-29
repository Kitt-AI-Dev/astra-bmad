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
    .from('readings')
    .select('sign, role, date')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Reading not found' }, { status: 404 })
  }

  revalidatePath(`/${data.sign}/${data.role}/${data.date}`)
  revalidatePath(`/${data.sign}/${data.role}`)

  return NextResponse.json({
    success: true,
    paths: [`/${data.sign}/${data.role}/${data.date}`, `/${data.sign}/${data.role}`],
  })
}
