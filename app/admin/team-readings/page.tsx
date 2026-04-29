import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
import { MonthSelector } from '@/components/admin/MonthSelector'
import { DateFilter } from '@/components/admin/DateFilter'
import { TEAM_ARCHETYPES } from '@/lib/constants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GenerateTeamSlotButton } from '@/components/admin/GenerateTeamSlotButton'

type Status = 'published' | 'suppressed' | 'scheduled'

function getPublicationStatus(date: string, suppressed: boolean): Status {
  if (suppressed) return 'suppressed'
  const today = new Date().toISOString().slice(0, 10)
  return date <= today ? 'published' : 'scheduled'
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

const BADGE_VARIANT: Record<Status, 'default' | 'destructive' | 'secondary'> = {
  published: 'default',
  suppressed: 'destructive',
  scheduled: 'secondary',
}

export default async function TeamReadingsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>
}) {
  const { month, date } = await searchParams
  const currentMonth = getCurrentMonth()

  const supabase = await createClient()

  const { data: batchRows, error: batchError } = await supabase
    .from('batches')
    .select('batch_month')
    .order('batch_month', { ascending: false })

  if (batchError) {
    console.error('[admin/team-readings] failed to load batch months:', batchError.message)
  }

  const allMonths = [
    ...new Set((batchRows ?? []).map((r) => (r.batch_month as string).trim())),
  ].sort((a, b) => b.localeCompare(a))
  if (!allMonths.includes(currentMonth)) allMonths.unshift(currentMonth)

  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined

  const selectedMonth = selectedDate
    ? selectedDate.slice(0, 7)
    : (month && allMonths.includes(month) ? month : currentMonth)

  let readingsQuery = supabase
    .from('team_readings')
    .select('id, date, slot, content, suppressed')

  if (selectedDate) {
    readingsQuery = readingsQuery.eq('date', selectedDate)
  } else {
    const [y, m] = selectedMonth.split('-').map(Number)
    const nextMonth = m === 12
      ? `${y + 1}-01`
      : `${y}-${String(m + 1).padStart(2, '0')}`
    readingsQuery = readingsQuery
      .gte('date', `${selectedMonth}-01`)
      .lt('date', `${nextMonth}-01`)
  }

  const { data: readings, error: readingsError } = await readingsQuery
    .order('date', { ascending: false })
    .order('slot', { ascending: true })

  if (readingsError) {
    console.error('[admin/team-readings] failed to load readings:', readingsError.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <p className="text-text-secondary text-sm font-mono">{'// team readings'}</p>
        <MonthSelector months={allMonths} current={selectedMonth} basePath="/admin/team-readings" />
        <Suspense fallback={null}><DateFilter /></Suspense>
      </div>

      {readingsError ? (
        <p className="text-error text-sm font-mono">
          {'// error loading team readings — check server logs'}
        </p>
      ) : selectedDate ? (
        (() => {
          const bySlot = new Map((readings ?? []).map((r) => [r.slot, r]))
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">slot</TableHead>
                  <TableHead className="font-mono">archetype</TableHead>
                  <TableHead className="font-mono">content</TableHead>
                  <TableHead className="font-mono">status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((slot) => {
                  const r = bySlot.get(slot)
                  const archetype = TEAM_ARCHETYPES[slot] ?? `slot ${slot}`
                  if (r) {
                    const status = getPublicationStatus(r.date, r.suppressed)
                    const href = `/admin/team-readings/${r.id}`
                    return (
                      <TableRow key={slot}>
                        <TableCell className="p-0">
                          <Link href={href} className="block px-4 py-2">{slot}</Link>
                        </TableCell>
                        <TableCell className="p-0">
                          <Link href={href} className="block px-4 py-2 text-sm">{archetype}</Link>
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
                  }
                  return (
                    <TableRow key={slot}>
                      <TableCell className="px-4 py-2 text-text-secondary">{slot}</TableCell>
                      <TableCell className="px-4 py-2 text-sm text-text-secondary">{archetype}</TableCell>
                      <TableCell className="px-4 py-2 text-xs text-text-secondary font-mono">{'// missing'}</TableCell>
                      <TableCell className="px-4 py-2">
                        <GenerateTeamSlotButton slot={slot} date={selectedDate} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )
        })()
      ) : !readings || readings.length === 0 ? (
        <p className="text-text-secondary text-sm font-mono">
          {'// no team readings generated for this month yet'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono">date</TableHead>
              <TableHead className="font-mono">slot</TableHead>
              <TableHead className="font-mono">archetype</TableHead>
              <TableHead className="font-mono">content</TableHead>
              <TableHead className="font-mono">status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r) => {
              const status = getPublicationStatus(r.date, r.suppressed)
              const href = `/admin/team-readings/${r.id}`
              const archetype = TEAM_ARCHETYPES[r.slot] ?? `slot ${r.slot}`
              return (
                <TableRow key={r.id}>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2 font-mono text-xs">{r.date}</Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2">{r.slot}</Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link href={href} className="block px-4 py-2 text-sm">{archetype}</Link>
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
    </div>
  )
}
