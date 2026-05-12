import { createClient } from '@/lib/supabase-server'
import { getTelegramSubscriberStats, type TelegramStatsClient } from '@/lib/admin-telegram-stats'

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

export default async function TelegramPage() {
  const supabase = await createClient()
  const { total, active, last7days } = await getTelegramSubscriberStats(
    supabase as unknown as TelegramStatsClient
  )

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
    </div>
  )
}
