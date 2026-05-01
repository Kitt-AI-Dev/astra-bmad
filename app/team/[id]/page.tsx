import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase-server-public'
import { Header } from '@/components/Header'
import { ShareFooter } from '@/components/ShareFooter'
import { TeamReadingCard } from '@/components/TeamReadingCard'
import { Footer } from '@/components/Footer'

export const revalidate = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://404tune.app'
  return {
    title: 'Team Horoscope — 404tune',
    description: "Your team's daily reading from 404tune",
    alternates: { canonical: `${base}/team/${id}` },
    openGraph: {
      title: 'Team Horoscope — 404tune',
      description: "Your team's daily reading from 404tune",
      url: `${base}/team/${id}`,
      siteName: '404tune',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Team Horoscope — 404tune',
    },
  }
}

export default async function TeamReadingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://404tune.app'

  const supabase = createPublicClient()
  const { data: reading, error } = await supabase
    .from('team_readings')
    .select('id, slot, date, content, suppressed')
    .eq('id', id)
    .maybeSingle()

  if (error) console.error('[team/[id]] Supabase error:', error.message)

  const state: 'ok' | 'not-found' | 'suppressed' = reading
    ? reading.suppressed
      ? 'suppressed'
      : 'ok'
    : 'not-found'

  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div id="reading" className="max-w-[700px] mx-auto">
        <Header />
        <p className="text-[13px] font-mono text-accent-gold mb-5">
          {'$ '}<span className="text-accent-violet">404tune</span>{' --team'}
        </p>
        <TeamReadingCard reading={state === 'ok' ? reading : null} state={state} />
        {state === 'ok' && reading && (
          <ShareFooter url={`${base}/team/${reading.id}`} />
        )}
        <Footer />
      </div>
    </main>
  )
}
