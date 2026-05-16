import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { SIGNS, ROLES } from '@/lib/constants'

// Warm-up phase fans out 720 fetches (144 canonical + 144 today-dated + 144
// today-OG + 144 tomorrow-dated + 144 tomorrow-OG). Tomorrow is included so
// readers east of UTC+8 (Tokyo, Sydney, Auckland) — whose local "today" is
// tomorrow UTC — hit a warm cache when their telegram push fires. Keep
// generous headroom over default 60s.
export const maxDuration = 300

// Parallel fetches per chunk. Each warm-up fetch may take 1-3s when the
// target route is cold, ~0.3s when already cached. 10 keeps wall-clock low
// without overwhelming the function pool.
const WARMUP_CONCURRENCY = 10

// Per-request timeout. Cold renders observed at 2-3s; 30s gives generous
// headroom and prevents a single hung upstream from wedging the cron near
// maxDuration.
const WARMUP_TIMEOUT_MS = 30_000

type WarmupFailure = { url: string; reason: string }
type WarmupResult = { ok: number; failed: number; failures: WarmupFailure[] }

async function warmInChunks(urls: string[]): Promise<WarmupResult> {
  let ok = 0
  const failures: WarmupFailure[] = []

  for (let i = 0; i < urls.length; i += WARMUP_CONCURRENCY) {
    const chunk = urls.slice(i, i + WARMUP_CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map(async (url) => {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(WARMUP_TIMEOUT_MS),
        })
        // Release the socket — undici holds connections open until the body
        // is consumed or cancelled. Important when fanning out 432 requests.
        await res.body?.cancel()
        return { status: res.status, ok: res.ok }
      })
    )
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      const url = chunk[j]
      if (r.status === 'fulfilled' && r.value.ok) {
        ok++
      } else {
        const reason =
          r.status === 'rejected'
            ? r.reason instanceof Error ? r.reason.message : String(r.reason)
            : `HTTP ${r.value.status}`
        failures.push({ url, reason })
      }
    }
  }
  return { ok, failed: failures.length, failures }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 1: mark canonical /sign/role pages stale so the next request regenerates with
  // today's reading. Original behavior of this cron.
  for (const sign of SIGNS) {
    for (const role of ROLES) {
      revalidatePath(`/${sign}/${role}`)
    }
  }

  // Step 2: pre-warm everything a user might land on today OR tomorrow (UTC):
  // - canonical `/sign/role` pages (just invalidated; first organic visitor would
  //   otherwise pay the regen cost — homepage redirects land here)
  // - dated `/sign/role/today` pages (Telegram bot sends these; dynamic on first
  //   request because generateStaticParams only built dates <= today AT BUILD TIME)
  // - dated `/sign/role/tomorrow` pages (readers east of UTC+8 — Tokyo, Sydney,
  //   Auckland — are on the next UTC date for most of their waking hours; the
  //   Telegram push for those cohorts fires at UTC 21:00-23:00 today and sends
  //   tomorrow-UTC URLs. The publish-gate RLS allows `date <= CURRENT_DATE + 1`
  //   so tomorrow's reading is visible.)
  // - OG images for both dated sets (Telegram unfurls these for previews)
  const base = process.env.NEXT_PUBLIC_APP_URL!
  const now = Date.now()
  const today = new Date(now).toISOString().slice(0, 10)
  const tomorrow = new Date(now + 86_400_000).toISOString().slice(0, 10)
  const warmupUrls: string[] = []
  for (const sign of SIGNS) {
    for (const role of ROLES) {
      warmupUrls.push(`${base}/${sign}/${role}`)
      warmupUrls.push(`${base}/${sign}/${role}/${today}`)
      warmupUrls.push(`${base}/${sign}/${role}/${today}/opengraph-image`)
      warmupUrls.push(`${base}/${sign}/${role}/${tomorrow}`)
      warmupUrls.push(`${base}/${sign}/${role}/${tomorrow}/opengraph-image`)
    }
  }

  const warmup = await warmInChunks(warmupUrls)
  if (warmup.failed > 0) {
    const sample = warmup.failures.slice(0, 5).map((f) => `${f.url} → ${f.reason}`).join('; ')
    console.warn(
      `[revalidate] warm-up: ${warmup.ok} succeeded, ${warmup.failed} failed (out of ${warmupUrls.length}). First failures: ${sample}`
    )
  }

  return NextResponse.json({
    revalidated: true,
    paths: SIGNS.length * ROLES.length,
    warmed: warmup.ok,
    warmupFailed: warmup.failed,
  })
}
