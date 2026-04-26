'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type BatchRow = {
  id: string
  anthropic_batch_id: string
  batch_month: string
  status: string
  total_requests: number
  succeeded: number
  errored: number
  is_retry: boolean
  parent_batch_id: string | null
  submitted_at: string
  completed_at: string | null
}

const BATCH_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  submitted: 'secondary',
  processing: 'secondary',
  ended: 'default',
  processed: 'default',
  failed: 'destructive',
}

function getNextMonth(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toISOString().slice(0, 7)
}

function getMonthOptions(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push(d.toISOString().slice(0, 7))
  }
  return months
}

function formatTs(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts)
    .toLocaleString('en-CA', { timeZone: 'UTC', hour12: false })
    .replace(',', '')
}

export function BatchControlPanel({ batches }: { batches: BatchRow[] }) {
  const router = useRouter()
  const [batchMonth, setBatchMonth] = useState(getNextMonth)
  const [triggerSaving, setTriggerSaving] = useState(false)
  const [retrieveSaving, setRetrieveSaving] = useState(false)
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set())

  async function callApi(url: string, body?: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      let message = `Request failed (${res.status})`
      try {
        const json = (await res.json()) as { error?: string }
        if (json.error) message = json.error
      } catch {}
      throw new Error(message)
    }
    const json = (await res.json()) as { success: boolean; error?: string }
    if (!json.success) throw new Error(json.error ?? 'Action failed')
  }

  async function handleTrigger() {
    setTriggerSaving(true)
    try {
      await callApi('/api/admin/batches/submit', { batch_month: batchMonth })
      toast.success(`batch submitted for ${batchMonth}`, { duration: 3000 })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'submit failed', { duration: 3000 })
    } finally {
      setTriggerSaving(false)
    }
  }

  async function handleRetrieve() {
    setRetrieveSaving(true)
    try {
      await callApi('/api/admin/batches/retrieve')
      toast.success('retrieve complete — refresh to see results', {
        duration: 3000,
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'retrieve failed', { duration: 3000 })
    } finally {
      setRetrieveSaving(false)
    }
  }

  async function handleRetry(batchId: string) {
    setRetryingIds((prev) => new Set(prev).add(batchId))
    try {
      await callApi(`/api/admin/batches/retry?batchId=${batchId}`)
      toast.success('retry batch submitted', { duration: 3000 })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'retry failed', { duration: 3000 })
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev)
        next.delete(batchId)
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={batchMonth} onValueChange={(v) => { if (v) setBatchMonth(v) }}>
          <SelectTrigger className="w-36 font-mono text-sm border-border bg-surface">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((m) => (
              <SelectItem key={m} value={m} className="font-mono text-sm">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleTrigger} disabled={triggerSaving} size="sm">
          {triggerSaving ? 'dispatching...' : 'trigger batch'}
        </Button>
        <Button onClick={handleRetrieve} disabled={retrieveSaving} size="sm" variant="outline">
          {retrieveSaving ? 'dispatching...' : 'retrieve results'}
        </Button>
      </div>

      {batches.length === 0 ? (
        <p className="text-text-secondary text-sm font-mono">
          {'// no batch jobs yet — trigger a batch to get started'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono">batch id</TableHead>
              <TableHead className="font-mono">month</TableHead>
              <TableHead className="font-mono">status</TableHead>
              <TableHead className="font-mono">succeeded</TableHead>
              <TableHead className="font-mono">errored</TableHead>
              <TableHead className="font-mono">submitted</TableHead>
              <TableHead className="font-mono">completed</TableHead>
              <TableHead className="font-mono">actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((row) => (
              <TableRow key={row.id} className={row.is_retry ? 'opacity-75' : undefined}>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1">
                    {row.is_retry && (
                      <span className="text-text-secondary text-xs">{'↳'}</span>
                    )}
                    {row.anthropic_batch_id.slice(0, 20)}…
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.batch_month}</TableCell>
                <TableCell>
                  <Badge variant={BATCH_BADGE_VARIANT[row.status] ?? 'secondary'}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.succeeded}</TableCell>
                <TableCell className="font-mono text-xs">{row.errored}</TableCell>
                <TableCell className="font-mono text-xs">{formatTs(row.submitted_at)}</TableCell>
                <TableCell className="font-mono text-xs">{formatTs(row.completed_at)}</TableCell>
                <TableCell>
                  {row.errored > 0 && (
                    <Button
                      onClick={() => handleRetry(row.id)}
                      disabled={retryingIds.has(row.id)}
                      size="sm"
                      variant="destructive"
                    >
                      {retryingIds.has(row.id) ? 'retrying...' : 'retry errors'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
