import { createClient } from '@/lib/supabase-server'
import {
  getTelegramSubscriberStats,
  getTelegramEngagementStats,
  type TelegramStatsClient,
} from '@/lib/admin-telegram-stats'

export const dynamic = 'force-dynamic'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded bg-surface p-4 space-y-1">
      <p className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
        {label}
      </p>
      <p className="text-3xl font-mono text-text-primary tabular-nums">{value}</p>
    </div>
  )
}

function EngagementCard({
  label,
  sent,
  clicked,
  rate,
}: {
  label: string
  sent: number
  clicked: number
  rate: number
}) {
  return (
    <div className="border border-border rounded bg-surface p-4 space-y-1">
      <p className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
        {label}
      </p>
      <p className="text-3xl font-mono text-text-primary tabular-nums">
        {sent === 0 ? '—' : `${(rate * 100).toFixed(1)}%`}
      </p>
      <p className="text-[11px] font-mono text-text-secondary tabular-nums">
        {sent} sent · {clicked} clicked
      </p>
    </div>
  )
}

function UnsubRateCard({
  label,
  active_at_start,
  unsubs,
  rate,
}: {
  label: string
  active_at_start: number
  unsubs: number
  rate: number
}) {
  return (
    <div className="border border-border rounded bg-surface p-4 space-y-1">
      <p className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
        {label}
      </p>
      <p className="text-3xl font-mono text-text-primary tabular-nums">
        {active_at_start === 0 ? '—' : `${(rate * 100).toFixed(1)}%`}
      </p>
      <p className="text-[11px] font-mono text-text-secondary tabular-nums">
        {unsubs} unsubs · {active_at_start} active at start
      </p>
    </div>
  )
}

export default async function TelegramPage() {
  const supabase = await createClient()
  const [{ total, active, last7days }, engagement] = await Promise.all([
    getTelegramSubscriberStats(supabase as unknown as TelegramStatsClient),
    getTelegramEngagementStats(supabase as unknown as TelegramStatsClient),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
        {'// telegram subscribers'}
      </h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="total" value={total ?? 0} />
        <StatCard label="active" value={active ?? 0} />
        <StatCard label="last 7 days" value={last7days ?? 0} />
      </div>
      <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
        {'// engagement (push click-through)'}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <EngagementCard
          label="7d ctr"
          sent={engagement.window_7d.sent}
          clicked={engagement.window_7d.clicked}
          rate={engagement.window_7d.rate}
        />
        <EngagementCard
          label="30d ctr"
          sent={engagement.window_30d.sent}
          clicked={engagement.window_30d.clicked}
          rate={engagement.window_30d.rate}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <UnsubRateCard
          label="7d unsub rate"
          active_at_start={engagement.window_7d.unsubscribe_rate.active_at_start}
          unsubs={engagement.window_7d.unsubscribe_rate.unsubs}
          rate={engagement.window_7d.unsubscribe_rate.rate}
        />
        <UnsubRateCard
          label="30d unsub rate"
          active_at_start={engagement.window_30d.unsubscribe_rate.active_at_start}
          unsubs={engagement.window_30d.unsubscribe_rate.unsubs}
          rate={engagement.window_30d.unsubscribe_rate.rate}
        />
      </div>
    </div>
  )
}
