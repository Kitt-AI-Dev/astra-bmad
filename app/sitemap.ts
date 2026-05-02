import type { MetadataRoute } from 'next'
import { createClient as createBareClient } from '@supabase/supabase-js'
import { SIGNS, ROLES } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL!
  const today = new Date().toISOString().slice(0, 10)

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/team`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
  ]

  const rootEntries: MetadataRoute.Sitemap = SIGNS.flatMap((sign) =>
    ROLES.map((role) => ({
      url: `${base}/${sign}/${role}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  )

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return [...staticEntries, ...rootEntries]

  try {
    const supabase = createBareClient(url, key)
    const { data } = await supabase
      .from('readings')
      .select('sign, role, date')
      .eq('suppressed', false)
      .lte('date', today)
      .range(0, 9999)

    const dateEntries: MetadataRoute.Sitemap = (data ?? []).map((r) => ({
      url: `${base}/${r.sign}/${r.role}/${r.date}`,
      lastModified: new Date(r.date),
      changeFrequency: 'never' as const,
      priority: 0.6,
    }))

    return [...staticEntries, ...rootEntries, ...dateEntries]
  } catch {
    return [...staticEntries, ...rootEntries]
  }
}
