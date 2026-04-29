import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
import { Badge } from '@/components/ui/badge'
import { TEAM_ARCHETYPES } from '@/lib/constants'
import { TeamReadingEditForm } from '@/components/admin/TeamReadingEditForm'

export default async function TeamReadingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: reading } = await supabase
    .from('team_readings')
    .select('id, slot, date, content, suppressed')
    .eq('id', id)
    .single()

  if (!reading) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const isLive = reading.date <= today && !reading.suppressed

  const status = reading.suppressed
    ? 'suppressed'
    : reading.date <= today
      ? 'published'
      : 'scheduled'

  const archetype = TEAM_ARCHETYPES[reading.slot] ?? `slot ${reading.slot}`

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/team-readings"
          className="text-text-secondary text-sm font-mono hover:text-text-primary transition-colors"
        >
          {'← team readings'}
        </Link>
      </div>
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-text-secondary">{reading.date}</span>
        <span className="text-text-secondary">/</span>
        <span className="text-text-secondary">slot {reading.slot}</span>
        <span className="text-text-secondary">/</span>
        <span className="text-text-secondary">{archetype}</span>
        <Badge
          variant={
            status === 'published' ? 'default' : status === 'suppressed' ? 'destructive' : 'secondary'
          }
        >
          {status}
        </Badge>
      </div>
      <TeamReadingEditForm
        id={reading.id}
        initialContent={reading.content ?? ''}
        initialSuppressed={reading.suppressed}
        isLive={isLive}
        slot={reading.slot}
        date={reading.date}
      />
    </div>
  )
}
