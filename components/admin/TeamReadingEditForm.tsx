'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { GenerateButton } from './GenerateButton'

type Props = {
  id: string
  initialContent: string
  initialSuppressed: boolean
  isLive: boolean
  slot: number
  date: string
}

export function TeamReadingEditForm({ id, initialContent, initialSuppressed, isLive, slot, date }: Props) {
  const [content, setContent] = useState(initialContent)
  const [suppressed, setSuppressed] = useState(initialSuppressed)
  const [saving, setSaving] = useState(false)
  const [revalidating, setRevalidating] = useState(false)

  async function patchReading(updates: { content?: string; suppressed?: boolean }) {
    const res = await fetch(`/api/admin/team-readings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    const json = (await res.json()) as { success: boolean; error?: string }
    if (!json.success) throw new Error(json.error ?? 'Update failed')
  }

  async function handleSave() {
    setSaving(true)
    try {
      await patchReading({ content })
      toast.success('reading saved', { duration: 3000 })
    } catch {
      toast.error('save failed', { duration: 3000, action: { label: 'retry', onClick: handleSave } })
    } finally {
      setSaving(false)
    }
  }

  async function handleRevalidate() {
    setRevalidating(true)
    try {
      const res = await fetch(`/api/admin/team-readings/${id}/revalidate`, { method: 'POST' })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      toast.success('cache cleared — next visit renders fresh', { duration: 3000 })
    } catch {
      toast.error('revalidation failed', { duration: 3000 })
    } finally {
      setRevalidating(false)
    }
  }

  async function handleToggleSuppress() {
    const next = !suppressed
    try {
      await patchReading({ suppressed: next })
      setSuppressed(next)
      toast.success(next ? 'reading suppressed' : 'suppression removed', { duration: 3000 })
    } catch {
      toast.error('action failed', { duration: 3000 })
    }
  }

  return (
    <div className="space-y-4">
      {isLive && (
        <p className="text-warning text-sm font-mono">
          {'// this reading is already live — changes take effect immediately'}
        </p>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="font-mono text-sm min-h-48 resize-y"
        disabled={saving}
      />
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? 'saving...' : 'save'}
        </Button>
        <Button
          onClick={handleToggleSuppress}
          disabled={saving}
          variant={suppressed ? 'outline' : 'destructive'}
          size="sm"
        >
          {suppressed ? 'remove suppression' : 'suppress'}
        </Button>
        <Button
          onClick={handleRevalidate}
          disabled={revalidating}
          variant="outline"
          size="sm"
        >
          {revalidating ? 'clearing...' : 'revalidate cache'}
        </Button>
        <GenerateButton
          type="team"
          slot={slot}
          date={date}
          onSuccess={(c) => setContent(c)}
        />
      </div>
    </div>
  )
}
