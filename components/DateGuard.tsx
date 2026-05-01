'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

// useSyncExternalStore subscribe is intentionally a no-op: we read localDate once at
// mount and do not react to clock drift, cross-tab changes, or midnight crossings.
// Matches the original useEffect-based behavior — upgrade only if cross-tab sync is needed.
const noopSubscribe = () => () => {}

export function DateGuard({
  serverDate,
  sign,
  role,
  children,
}: {
  serverDate: string
  sign: string
  role: string
  children: React.ReactNode
}) {
  const router = useRouter()
  // Server snapshot returns '' (sentinel that never matches a YYYY-MM-DD serverDate) so
  // children render invisible during SSR + initial hydration. Once React swaps to the
  // client snapshot post-hydration, `matches` becomes true (same date) → reveal, or
  // false (mismatch) → useEffect fires the redirect. This preserves the original
  // "invisible until verified" invariant — no flash of stale cached content.
  const localDate = useSyncExternalStore(
    noopSubscribe,
    () => new Date().toLocaleDateString('en-CA'),
    () => '',
  )

  const verified = localDate !== ''
  const matches = verified && localDate === serverDate

  useEffect(() => {
    if (verified && !matches) router.replace(`/${sign}/${role}/${localDate}`)
  }, [verified, matches, localDate, sign, role, router])

  return <div className={matches ? '' : 'invisible'}>{children}</div>
}
