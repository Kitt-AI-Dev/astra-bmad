import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase-server-public'
import { TEAM_ARCHETYPES } from '@/lib/constants'
import { Header } from '@/components/Header'
import { ShareFooter } from '@/components/ShareFooter'
import { TeamReadingCard } from '@/components/TeamReadingCard'
import { Footer } from '@/components/Footer'

export const revalidate = false

function truncateDescription(text: string, maxLength = 155): string {
  const prose = text.replace(/\s+/g, ' ').trim()
  return prose.length > maxLength ? prose.slice(0, maxLength) + '…' : prose
}

function extractTeamDescription(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as { body?: unknown }
    if (typeof parsed.body === 'string') return truncateDescription(parsed.body)
  } catch {
    // fall through to legacy markdown fallback
  }

  const firstParagraph = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('**'))

  return firstParagraph ? truncateDescription(firstParagraph) : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL!

  let title = 'Team Horoscope — 404tune'
  let description = "Your team's daily reading from 404tune"

  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('team_readings')
      .select('slot, content, suppressed')
      .eq('id', id)
      .eq('suppressed', false)
      .maybeSingle()

    if (data) {
      const archetype = TEAM_ARCHETYPES[data.slot]
      if (archetype) title = `${archetype} — 404tune`
      description = extractTeamDescription(data.content) ?? description
    }
  } catch (err) {
    console.warn('[team/[id] generateMetadata] failed:', err)
  }

  return {
    title,
    description,
    alternates: { canonical: `${base}/team/${id}` },
    openGraph: {
      title,
      description,
      url: `${base}/team/${id}`,
      siteName: '404tune',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function TeamReadingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL!

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
        <h1 className="text-[13px] font-mono text-accent-gold mb-5">
          {'$ '}<span className="text-accent-violet">404tune</span>{' --team'}
        </h1>
        <TeamReadingCard reading={state === 'ok' ? reading : null} state={state} />
        {state === 'ok' && reading && (
          <ShareFooter url={`${base}/team/${reading.id}`} />
        )}
        <Footer />
      </div>
    </main>
  )
}
