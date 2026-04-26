'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-sm space-y-4 max-w-md">
        <p className="text-muted-foreground">
          {'// fatal: an unexpected alignment occurred'}<br />
          {'// Our on-call engineer is blaming a solar flare.'}<br />
          {'// Saturn squares the call stack today.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="block text-accent-gold hover:underline focus-visible:ring focus-visible:ring-ring focus-visible:outline-none"
        >
          $ retry --reset-boundary
        </button>
        <Link
          href="/"
          className="block text-accent-violet hover:underline focus-visible:ring focus-visible:ring-ring focus-visible:outline-none"
        >
          $ 404tune --go-home
        </Link>
      </div>
    </main>
  )
}
