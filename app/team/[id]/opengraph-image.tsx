import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createPublicClient } from '@/lib/supabase-server-public'
import { TEAM_ARCHETYPES } from '@/lib/constants'

export const alt = '404tune team horoscope'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = false

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let fontData: Buffer | null = null
  try {
    fontData = await readFile(join(process.cwd(), 'app/fonts/JetBrainsMono-Regular.ttf'))
  } catch (err) {
    console.warn('[og/team] font load failed:', err)
  }

  let headline = '// 404tune — Team Horoscope'
  let excerpt: string | null = null

  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('team_readings')
      .select('slot, content')
      .eq('id', id)
      .maybeSingle()

    if (data) {
      const archetype = TEAM_ARCHETYPES[data.slot]
      if (archetype) headline = `## ${archetype}`
      const firstParagraph = data.content
        .split('\n\n')
        .find((b: string) => b.trim() && !b.trim().startsWith('#') && !b.trim().startsWith('**'))
      excerpt = firstParagraph?.slice(0, 200) ?? null
    }
  } catch (err) {
    console.warn('[og/team] DB fetch failed:', err)
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#010417',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: fontData ? 'JetBrainsMono' : 'monospace',
        }}
      >
        <div style={{ color: '#AAB4CE', fontSize: 20, marginBottom: 32 }}>{headline}</div>
        {excerpt ? (
          <div style={{ color: '#F1F5F9', fontSize: 26, lineHeight: 1.7, flex: 1 }}>{excerpt}</div>
        ) : (
          <div style={{ color: '#AAB4CE', fontSize: 22, flex: 1 }}>
            {'// 404tune — Team Horoscope'}
          </div>
        )}
        <div style={{ color: '#7C6EF5', fontSize: 18, marginTop: 32 }}>404tune</div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'JetBrainsMono',
              data: fontData,
              style: 'normal' as const,
              weight: 400 as const,
            },
          ]
        : undefined,
    }
  )
}
