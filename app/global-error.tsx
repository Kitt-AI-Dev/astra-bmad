'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <style>{`a:focus-visible { outline: 2px solid #7C6EF5; outline-offset: 2px; }`}</style>
      <body
        style={{
          background: '#010417',
          color: '#AAB4CE',
          fontFamily: 'monospace',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: '400px' }}>
          <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
            {'// kernel panic: the astral plane is unreachable'}<br />
            {'// Even the stars need a restart sometimes.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'block',
              color: '#C9A84C',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
              marginBottom: '0.5rem',
              textAlign: 'left',
            }}
          >
            $ reboot --hard-refresh
          </button>
          {/* global-error wraps the crashed app; a full reload via plain <a> is intentional.
              <Link> would attempt client navigation against a broken React tree. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ display: 'block', color: '#7C6EF5' }}>
            $ 404tune --go-home
          </a>
        </div>
      </body>
    </html>
  )
}
