type CountResult = {
  count: number | null
  error: { message: string } | null
}

type CountQuery = PromiseLike<CountResult> & {
  eq(column: string, value: unknown): CountQuery
  gte(column: string, value: unknown): CountQuery
  lte(column: string, value: unknown): CountQuery
  not(column: string, operator: 'is', value: null): CountQuery
  or(filterString: string): CountQuery
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

export type TelegramUnsubscribeRate = {
  active_at_start: number
  unsubs: number
  rate: number
}

export type TelegramEngagementWindow = {
  sent: number
  clicked: number
  rate: number
  unsubscribe_rate: TelegramUnsubscribeRate
}

export type TelegramEngagementStats = {
  window_7d: TelegramEngagementWindow
  window_30d: TelegramEngagementWindow
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

type CtrCounts = { sent: number; clicked: number; rate: number }

async function fetchCtrWindow(
  supabase: TelegramStatsClient,
  cutoffIso: string,
  label: string,
): Promise<CtrCounts> {
  const sentQuery = supabase
    .from('telegram_push_events')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', cutoffIso)

  const clickedQuery = supabase
    .from('telegram_push_events')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', cutoffIso)
    .not('clicked_at', 'is', null)

  const [sent, clicked] = await Promise.all([
    resolveCount(sentQuery, `${label} sent count failed`),
    resolveCount(clickedQuery, `${label} clicked count failed`),
  ])

  const rate = sent === 0 ? 0 : clicked / sent
  return { sent, clicked, rate }
}

async function fetchUnsubscribeWindow(
  supabase: TelegramStatsClient,
  cutoffIso: string,
  nowIso: string,
  label: string,
): Promise<TelegramUnsubscribeRate> {
  // Subscribers who existed AND were active at the window start:
  //   subscribed_at <= cutoff AND (unsubscribed_at IS NULL OR unsubscribed_at > cutoff)
  const activeAtStartQuery = supabase
    .from('telegram_subscribers')
    .select('*', { count: 'exact', head: true })
    .lte('subscribed_at', cutoffIso)
    .or(`unsubscribed_at.is.null,unsubscribed_at.gt.${cutoffIso}`)

  const unsubsQuery = supabase
    .from('telegram_subscribers')
    .select('*', { count: 'exact', head: true })
    .gte('unsubscribed_at', cutoffIso)
    .lte('unsubscribed_at', nowIso)

  const [active_at_start, unsubs] = await Promise.all([
    resolveCount(activeAtStartQuery, `${label} active_at_start failed`),
    resolveCount(unsubsQuery, `${label} unsubs failed`),
  ])

  const rate = active_at_start === 0 ? 0 : unsubs / active_at_start
  return { active_at_start, unsubs, rate }
}

export async function getTelegramEngagementStats(
  supabase: TelegramStatsClient,
  now = new Date(),
): Promise<TelegramEngagementStats> {
  const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [ctr7d, unsub7d, ctr30d, unsub30d] = await Promise.all([
    fetchCtrWindow(supabase, cutoff7d, '7d'),
    fetchUnsubscribeWindow(supabase, cutoff7d, now.toISOString(), '7d'),
    fetchCtrWindow(supabase, cutoff30d, '30d'),
    fetchUnsubscribeWindow(supabase, cutoff30d, now.toISOString(), '30d'),
  ])

  return {
    window_7d: { ...ctr7d, unsubscribe_rate: unsub7d },
    window_30d: { ...ctr30d, unsubscribe_rate: unsub30d },
  }
}
