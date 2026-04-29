'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const current = searchParams.get('date') ?? ''

  function navigate(date: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (date) {
      params.set('date', date)
      params.set('month', date.slice(0, 7))
    } else {
      params.delete('date')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={current}
        onChange={(e) => navigate(e.target.value)}
        className="font-mono text-sm border border-border bg-surface rounded px-2 py-1 h-9"
      />
      {current && (
        <button
          onClick={() => navigate('')}
          className="text-text-secondary text-xs font-mono hover:text-text-primary"
        >
          {'× clear'}
        </button>
      )}
    </div>
  )
}
