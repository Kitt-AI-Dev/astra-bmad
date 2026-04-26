import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO
    if (!githubToken || !githubRepo) {
      return NextResponse.json(
        { success: false, error: 'Missing GITHUB_TOKEN or GITHUB_REPO env var' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({})) as { batch_month?: string }
    const batchMonth = body.batch_month ?? ''

    const res = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/batch-submit.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ ref: 'main', inputs: { batch_month: batchMonth } }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GitHub dispatch failed (${res.status}): ${text}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Dispatch failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
