import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase-server-public'
import { SIGNS, ROLES } from '@/lib/constants'
import type { Sign, Role } from '@/lib/constants'
import { ReadingCard } from '@/components/ReadingCard'
import { DateGuard } from '@/components/DateGuard'
import { ShareFooter } from '@/components/ShareFooter'
import { formatSign, formatRole } from '@/lib/format'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string; role: string }>
}): Promise<Metadata> {
  const { sign, role } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://404tune.app'
  const signLabel = formatSign(sign)
  const roleLabel = formatRole(role)

  let description = `Daily ${signLabel} horoscope for ${roleLabel}s — 404tune`
  try {
    const supabase = createPublicClient()
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('readings')
      .select('content')
      .eq('sign', sign)
      .eq('role', role)
      .eq('date', today)
      .eq('suppressed', false)
      .maybeSingle()
    if (data?.content) {
      description = data.content.slice(0, 150) + '…'
    }
  } catch (err) {
    console.warn('[generateMetadata] description fetch failed:', err)
  }

  return {
    title: `${signLabel} ${roleLabel} Horoscope — 404tune`,
    description,
    alternates: { canonical: `${base}/${sign}/${role}` },
    openGraph: {
      title: `${signLabel} ${roleLabel} Horoscope — 404tune`,
      description,
      url: `${base}/${sign}/${role}`,
      siteName: '404tune',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${signLabel} ${roleLabel} Horoscope — 404tune`,
      description,
    },
  }
}

export function generateStaticParams() {
  return SIGNS.flatMap((sign) => ROLES.map((role) => ({ sign, role })))
}

export default async function SignRolePage({
  params,
}: {
  params: Promise<{ sign: string; role: string }>
}) {
  const { sign, role } = await params

  if (!SIGNS.includes(sign as Sign) || !ROLES.includes(role as Role)) {
    notFound()
  }

  const today = new Date().toISOString().slice(0, 10)
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://404tune.app'

  let reading = null
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('readings')
      .select('id, sign, role, date, content')
      .eq('sign', sign)
      .eq('role', role)
      .eq('date', today)
      .eq('suppressed', false)
      .maybeSingle()
    if (error) console.error('[readings] Supabase error:', error)
    reading = data
  } catch (error) {
    console.error('[readings] DB fetch failed:', error)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div id="reading" className="max-w-[680px] mx-auto">
        <DateGuard serverDate={today} sign={sign} role={role} />
        <div className="animate-in fade-in duration-150">
          <ReadingCard reading={reading} nullVariant="not-published" />
          {reading && <ShareFooter url={`${base}/${sign}/${role}/${reading.date}`} />}
        </div>
      </div>
    </main>
  )
}
