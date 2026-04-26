import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { SIGNS, ROLES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  for (const sign of SIGNS) {
    for (const role of ROLES) {
      revalidatePath(`/${sign}/${role}`)
    }
  }

  return NextResponse.json({ revalidated: true, count: SIGNS.length * ROLES.length })
}
