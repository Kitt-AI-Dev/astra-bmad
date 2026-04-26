import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { runBatchSubmit, getNextMonth } from '@/lib/batch/submit'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runBatchSubmit(getNextMonth())
    return NextResponse.json({ success: true })
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Batch submit failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
