import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = '404tune — your daily IT horoscope'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = false

export default async function Image() {
  let fontData: Buffer | null = null
  try {
    fontData = await readFile(join(process.cwd(), 'app/fonts/JetBrainsMono-Regular.ttf'))
  } catch (err) {
    console.warn('[opengraph-image] font load failed:', err)
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
        <div style={{ color: '#AAB4CE', fontSize: 22, marginBottom: 40 }}>{'// 404tune'}</div>
        <div style={{ color: '#7C6EF5', fontSize: 72, flex: 1 }}>404tune</div>
        <div style={{ color: '#AAB4CE', fontSize: 28, marginBottom: 12 }}>your daily IT horoscope</div>
        <div style={{ color: '#4A5568', fontSize: 20 }}>{'// for your sign and role'}</div>
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
