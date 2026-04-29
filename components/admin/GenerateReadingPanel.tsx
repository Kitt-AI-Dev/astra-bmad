'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SIGNS, ROLES } from '@/lib/constants'
import { GenerateButton } from './GenerateButton'

export function GenerateReadingPanel({ date }: { date: string }) {
  const [sign, setSign] = useState<string>(SIGNS[0])
  const [role, setRole] = useState<string>(ROLES[0])
  const router = useRouter()

  return (
    <div className="border border-border rounded p-4 font-mono text-sm space-y-3 mt-4">
      <p className="text-text-secondary">{`// generate reading for ${date}`}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={sign}
          onChange={(e) => setSign(e.target.value)}
          className="bg-surface border border-border rounded px-2 py-1 text-sm font-mono h-9"
        >
          {SIGNS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-surface border border-border rounded px-2 py-1 text-sm font-mono h-9"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <GenerateButton
          type="individual"
          sign={sign}
          role={role}
          date={date}
          label="generate"
          onSuccess={() => router.refresh()}
        />
      </div>
    </div>
  )
}
