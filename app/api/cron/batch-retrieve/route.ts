import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { runBatchRetrieve } from '@/lib/batch/retrieve'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runBatchRetrieve()
    return NextResponse.json({ success: true })
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Batch retrieve failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
