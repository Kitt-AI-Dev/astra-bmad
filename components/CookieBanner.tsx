'use client'

import { useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getConsent, setConsent } from '@/lib/consent'

// subscribe intentionally no-op: consent is read once at mount, no cross-tab reactivity
const noopSubscribe = () => () => {}

export function CookieBanner() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)

  // Server snapshot: pretend consent exists → no banner on server/hydration (SSR safe)
  // Client snapshot: read actual cookie to determine if banner is needed
  const consentExists = useSyncExternalStore(
    noopSubscribe,
    () => getConsent() !== null,
    () => true,
  )

  const shouldShow = !dismissed && !consentExists && !pathname.startsWith('/admin')

  if (!shouldShow) return null

  function handleAccept() {
    setConsent(true)
    setDismissed(true)
  }

  function handleFunctional() {
    setConsent(false)
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border px-6 py-4">
      <div className="max-w-[700px] mx-auto flex flex-wrap items-center gap-4">
        <p className="text-[13px] font-mono text-text-secondary flex-1 min-w-0">
          {'// 404tune uses functional cookies to remember your sign and role. Analytics cookies are optional and not yet active. '}
          <Link href="/privacy" className="text-accent-violet hover:underline">
            learn more
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleFunctional}
            className="text-[13px] font-mono text-text-secondary border border-border rounded px-3 py-1.5 hover:text-text-primary hover:border-text-secondary transition-colors"
          >
            functional only
          </button>
          <button
            onClick={handleAccept}
            className="text-[13px] font-mono text-accent-violet border border-accent-violet rounded px-3 py-1.5 hover:bg-accent-violet/10 transition-colors"
          >
            accept all
          </button>
        </div>
      </div>
    </div>
  )
}
