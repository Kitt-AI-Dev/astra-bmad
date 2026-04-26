import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createPublicClient } from '@/lib/supabase-server-public'
import { SIGNS, ROLES } from '@/lib/constants'
import type { Sign, Role } from '@/lib/constants'
import { formatSign, formatRole } from '@/lib/format'

export const alt = '404tune reading'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = false

export default async function Image({
  params,
}: {
  params: Promise<{ sign: string; role: string; date: string }>
}) {
  const { sign, role, date } = await params

  let fontData: Buffer | null = null
  try {
    fontData = await readFile(join(process.cwd(), 'app/fonts/JetBrainsMono-Regular.ttf'))
  } catch (err) {
    console.warn('[opengraph-image] font load failed:', err)
  }

  const signLabel = formatSign(sign)
  const roleLabel = formatRole(role)

  let excerpt: string | null = null
  if (SIGNS.includes(sign as Sign) && ROLES.includes(role as Role)) {
    try {
      const supabase = createPublicClient()
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('readings')
        .select('content')
        .eq('sign', sign)
        .eq('role', role)
        .eq('date', date)
        .eq('suppressed', false)
        .lte('date', today)
        .maybeSingle()
      if (data?.content) {
        excerpt = data.content.slice(0, 200)
      }
    } catch (err) {
      console.warn('[opengraph-image] DB fetch failed:', err)
    }
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
        <div
          style={{
            color: '#AAB4CE',
            fontSize: 20,
            marginBottom: 32,
          }}
        >
          {`// reading: ${sign}/${role} · ${date}`}
        </div>
        {excerpt ? (
          <div
            style={{
              color: '#F1F5F9',
              fontSize: 26,
              lineHeight: 1.7,
              flex: 1,
            }}
          >
            {excerpt}
          </div>
        ) : (
          <div
            style={{
              color: '#AAB4CE',
              fontSize: 22,
              flex: 1,
            }}
          >
            {`// ${signLabel} ${roleLabel}`}
          </div>
        )}
        <div
          style={{
            color: '#7C6EF5',
            fontSize: 18,
            marginTop: 32,
          }}
        >
          404tune
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: 'JetBrainsMono', data: fontData, style: 'normal' as const, weight: 400 as const }]
        : undefined,
    }
  )
}
