'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

function getTeamSlotCookie(): { date: string; reading_id: string } | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find((r) => r.startsWith('404tune_team_slot='))
      ?.split('=')
      .slice(1)
      .join('=')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw)) as { date: string; reading_id: string }
  } catch {
    return null
  }
}

function setTeamSlotCookie(date: string, reading_id: string) {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const maxAge = Math.floor((tomorrow.getTime() - now.getTime()) / 1000)
  document.cookie = `404tune_team_slot=${encodeURIComponent(
    JSON.stringify({ date, reading_id })
  )}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export default function TeamPage() {
  const router = useRouter()
  const [placeholder, setPlaceholder] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const saved = getTeamSlotCookie()
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (saved?.date === today && saved?.reading_id && UUID_RE.test(saved.reading_id)) {
      router.replace(`/team/${saved.reading_id}`)
      return
    }

    fetch('/api/team/today')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((readings: { id: string; slot: number }[]) => {
        if (!readings.length) {
          setPlaceholder(true)
          return
        }
        const chosen = readings[Math.floor(Math.random() * readings.length)]
        setTeamSlotCookie(today, chosen.id)
        router.replace(`/team/${chosen.id}`)
      })
      .catch(() => setPlaceholder(true))
  }, [router])

  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />
        {placeholder && (
          <p className="text-[13px] font-mono text-text-secondary mt-4">
            {"// the stars haven't clocked in yet — check back after standup"}
          </p>
        )}
      </div>
    </main>
  )
}
