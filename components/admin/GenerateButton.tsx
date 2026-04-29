'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type IndividualProps = {
  type: 'individual'
  sign: string
  role: string
  date: string
  onSuccess: (content: string) => void
  label?: string
}

type TeamProps = {
  type: 'team'
  slot: number
  date: string
  onSuccess: (content: string) => void
  label?: string
}

type Props = IndividualProps | TeamProps

export function GenerateButton({ onSuccess, label = 'regenerate', ...props }: Props) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    const endpoint = props.type === 'individual'
      ? '/api/admin/day/generate'
      : '/api/admin/day/generate-team'
    const body = props.type === 'individual'
      ? { sign: props.sign, role: props.role, date: props.date }
      : { slot: props.slot, date: props.date }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const json = (await res.json()) as { success: boolean; content?: string; id?: string; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Generation failed')
      onSuccess(json.content ?? '')
      const successMsg = props.type === 'individual'
        ? 'reading generated — slot filled'
        : 'team reading generated — slot filled'
      toast.success(successMsg, { duration: 3000 })
    } catch {
      toast.error('generation failed — try again', { duration: 3000 })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm">
      {generating ? 'generating...' : label}
    </Button>
  )
}
