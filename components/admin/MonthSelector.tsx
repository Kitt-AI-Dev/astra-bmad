'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function MonthSelector({
  months,
  current,
  basePath = '/admin/readings',
}: {
  months: string[]
  current: string
  basePath?: string
}) {
  const router = useRouter()
  return (
    <Select value={current} onValueChange={(v) => router.push(`${basePath}?month=${v}`)}>
      <SelectTrigger className="w-36 border-border bg-surface font-mono text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m} value={m} className="font-mono text-sm">
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
