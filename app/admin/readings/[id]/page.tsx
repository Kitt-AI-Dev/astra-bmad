import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { ReadingEditForm } from '@/components/admin/ReadingEditForm'

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: reading } = await supabase
    .from('readings')
    .select('id, sign, role, date, content, suppressed')
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/readings"
          className="text-text-secondary text-sm font-mono hover:text-text-primary transition-colors"
        >
          {'← readings'}
        </Link>
      </div>
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-text-secondary">{reading.sign}</span>
        <span className="text-text-secondary">/</span>
        <span className="text-text-secondary">{reading.role}</span>
        <span className="text-text-secondary">/</span>
        <span className="text-text-secondary">{reading.date}</span>
        <Badge
          variant={
            status === 'published' ? 'default' : status === 'suppressed' ? 'destructive' : 'secondary'
          }
        >
          {status}
        </Badge>
      </div>
      <ReadingEditForm
        id={reading.id}
        initialContent={reading.content ?? ''}
        initialSuppressed={reading.suppressed}
        isLive={isLive}
      />
    </div>
  )
}
