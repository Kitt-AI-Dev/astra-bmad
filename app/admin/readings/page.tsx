import { Suspense } from 'react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
import { MonthSelector } from '@/components/admin/MonthSelector'
import { DateFilter } from '@/components/admin/DateFilter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GenerateReadingPanel } from '@/components/admin/GenerateReadingPanel'

type Status = 'published' | 'suppressed' | 'scheduled'

function getPublicationStatus(date: string, suppressed: boolean): Status {
  if (suppressed) return 'suppressed'
  const today = new Date().toISOString().slice(0, 10) // true UTC YYYY-MM-DD
  return date <= today ? 'published' : 'scheduled'
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

const BADGE_VARIANT: Record<Status, 'default' | 'destructive' | 'secondary'> = {
  published: 'default',
  suppressed: 'destructive',
  scheduled: 'secondary',
}

export default async function ReadingsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>
}) {
  const { month, date } = await searchParams
  const currentMonth = getCurrentMonth()

  const supabase = await createClient()

  // Use batches table for month list — O(batches) not O(readings)
  const { data: batchRows, error: batchError } = await supabase
    .from('batches')
    .select('batch_month')
    .order('batch_month', { ascending: false })

  if (batchError) {
    console.error('[admin/readings] failed to load batch months:', batchError.message)
  }

  const allMonths = [
    ...new Set((batchRows ?? []).map((r) => (r.batch_month as string).trim())),
  ].sort((a, b) => b.localeCompare(a))
  if (!allMonths.includes(currentMonth)) allMonths.unshift(currentMonth)

  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined

  // When date is set, derive month from date (date is source of truth)
  const selectedMonth = selectedDate
    ? selectedDate.slice(0, 7)
    : (month && allMonths.includes(month) ? month : currentMonth)

  let readingsQuery = supabase
    .from('readings')
    .select('id, sign, role, date, content, suppressed')

  if (selectedDate) {
    readingsQuery = readingsQuery.eq('date', selectedDate)
  } else {
    readingsQuery = readingsQuery.eq('batch_month', selectedMonth)
  }

  const { data: readings, error: readingsError } = await readingsQuery
    .order('date', { ascending: true })
    .order('sign', { ascending: true })
    .order('role', { ascending: true })

  if (readingsError) {
    console.error('[admin/readings] failed to load readings:', readingsError.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <p className="text-text-secondary text-sm font-mono">{'// readings'}</p>
        <MonthSelector months={allMonths} current={selectedMonth} />
        <Suspense fallback={null}><DateFilter /></Suspense>
      </div>

      {readingsError ? (
        <p className="text-error text-sm font-mono">
          {'// error loading readings — check server logs'}
        </p>
      ) : !readings || readings.length === 0 ? (
        <p className="text-text-secondary text-sm font-mono">
          {'// no readings generated for this month yet'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono">sign</TableHead>
              <TableHead className="font-mono">role</TableHead>
              <TableHead className="font-mono">date</TableHead>
              <TableHead className="font-mono">content</TableHead>
              <TableHead className="font-mono">status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r) => {
              const status = getPublicationStatus(r.date, r.suppressed)
              const href = `/admin/readings/${r.id}`
              return (
                <TableRow key={r.id}>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2">{r.sign}</Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2">{r.role}</Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2 font-mono text-xs">{r.date}</Link>
                  </TableCell>
                  <TableCell className="p-0 max-w-xs">
                    <Link href={href} className="block truncate px-4 py-2 text-xs text-text-secondary">
                      {(r.content ?? '').slice(0, 100)}
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2">
                      <Badge variant={BADGE_VARIANT[status]}>{status}</Badge>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      {selectedDate && (
        <Suspense fallback={null}>
          <GenerateReadingPanel date={selectedDate} />
        </Suspense>
      )}
    </div>
  )
}
