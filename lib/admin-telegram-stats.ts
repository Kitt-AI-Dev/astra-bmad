type CountResult = {
  count: number | null
  error: { message: string } | null
}

type CountQuery = PromiseLike<CountResult> & {
  eq(column: string, value: unknown): CountQuery
  gte(column: string, value: unknown): CountQuery
}

export type TelegramStatsClient = {
  from(table: string): {
    select(columns: string, options: { count: 'exact'; head: true }): CountQuery
  }
}

export type TelegramSubscriberStats = {
  total: number
  active: number
  last7days: number
}

async function resolveCount(query: CountQuery, label: string): Promise<number> {
  const { count, error } = await query
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return count ?? 0
}

export async function getTelegramSubscriberStats(
  supabase: TelegramStatsClient,
  now = new Date()
): Promise<TelegramSubscriberStats> {
  const totalQuery = supabase
    .from('telegram_subscribers')
    .select('*', { count: 'exact', head: true })

  const activeQuery = supabase
    .from('telegram_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const last7daysQuery = supabase
    .from('telegram_subscribers')
    .select('*', { count: 'exact', head: true })
    .gte('subscribed_at', cutoff)

  const [total, active, last7days] = await Promise.all([
    resolveCount(totalQuery, 'total count failed'),
    resolveCount(activeQuery, 'active count failed'),
    resolveCount(last7daysQuery, 'last 7 days count failed'),
  ])

  return { total, active, last7days }
}
