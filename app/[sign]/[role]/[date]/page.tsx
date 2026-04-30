import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient as createBareClient } from '@supabase/supabase-js'
import { createPublicClient } from '@/lib/supabase-server-public'
import { SIGNS, ROLES } from '@/lib/constants'
import type { Sign, Role } from '@/lib/constants'
import { ReadingCard } from '@/components/ReadingCard'
import { ShareFooter } from '@/components/ShareFooter'
import { Header } from '@/components/Header'
import { formatSign, formatRole } from '@/lib/format'

export const dynamicParams = true
export const revalidate = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string; role: string; date: string }>
}): Promise<Metadata> {
  const { sign, role, date } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://404tune.app'
  const signLabel = formatSign(sign)
  const roleLabel = formatRole(role)

  let description = `${signLabel} ${roleLabel} horoscope for ${date} — 404tune`
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('readings')
      .select('content')
      .eq('sign', sign)
      .eq('role', role)
      .eq('date', date)
      .eq('suppressed', false)
      .maybeSingle()
    if (data?.content) {
      try {
        const parsed = JSON.parse(data.content)
        if (typeof parsed?.general_reading === 'string') {
          description = parsed.general_reading.slice(0, 150) + '…'
        } else {
          description = data.content.slice(0, 150) + '…'
        }
      } catch {
        description = data.content.slice(0, 150) + '…'
      }
    }
  } catch (err) {
    console.warn('[generateMetadata] description fetch failed:', err)
  }

  return {
    title: `${signLabel} ${roleLabel} · ${date} — 404tune`,
    description,
    alternates: { canonical: `${base}/${sign}/${role}/${date}` },
    openGraph: {
      title: `${signLabel} ${roleLabel} · ${date} — 404tune`,
      description,
      url: `${base}/${sign}/${role}/${date}`,
      siteName: '404tune',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${signLabel} ${roleLabel} · ${date} — 404tune`,
      description,
    },
  }
}

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createBareClient(url, key)
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('readings')
    .select('sign, role, date')
    .eq('suppressed', false)
    .lte('date', today)
    .range(0, 9999)

  return (data ?? []).map((r) => ({ sign: r.sign, role: r.role, date: r.date }))
}

export default async function DatePage({
  params,
}: {
  params: Promise<{ sign: string; role: string; date: string }>
}) {
  const { sign, role, date } = await params

  if (!SIGNS.includes(sign as Sign) || !ROLES.includes(role as Role)) {
    notFound()
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
    notFound()
  }

  const today = new Date().toISOString().slice(0, 10)
  // Mirror the RLS policy in 0002_publish_gate_local_timezone.sql: allow up to
  // tomorrow-UTC so positive-offset readers (CEST, JST, AEST...) see their
  // local-date reading at local midnight, not UTC midnight.
  const maxDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://404tune.app'

  let reading = null
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('readings')
      .select('id, sign, role, date, content')
      .eq('sign', sign)
      .eq('role', role)
      .eq('date', date)
      .eq('suppressed', false)
      .lte('date', maxDate)
      .maybeSingle()
    if (error) console.error('[readings] Supabase error:', error)
    reading = data
  } catch (error) {
    console.error('[readings] DB fetch failed:', error)
  }

  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div id="reading" className="max-w-[700px] mx-auto">
        <Header />
        <p className="text-[13px] font-mono text-accent-gold mb-5">
          {'$ '}<span className="text-accent-violet">404tune</span>{` --sign ${sign} --role ${role} --date ${date}`}
        </p>
        <ReadingCard reading={reading} nullVariant={date < today ? 'unavailable' : 'not-published'} />
        {reading && <ShareFooter url={`${base}/${sign}/${role}/${reading.date}`} />}
      </div>
    </main>
  )
}
