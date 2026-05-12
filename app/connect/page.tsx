'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SIGNS, ROLES } from '@/lib/constants'
import type { Sign, Role } from '@/lib/constants'
import { getPrefs } from '@/lib/cookies'
import { formatSign, formatRole } from '@/lib/format'

function isValidTid(tid: string | null): tid is string {
  if (!tid) return false
  try {
    const base64 = tid.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    const n = Number(decoded)
    return !isNaN(n) && n > 0
  } catch {
    return false
  }
}

// API call result — separate from the page-level state derivation
type ApiResult =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; sign: Sign; role: Role }
  | { kind: 'error'; message: string }

function ConnectPageContent() {
  const searchParams = useSearchParams()
  const rawTid = searchParams.get('tid')
  const validTid = isValidTid(rawTid) ? rawTid : null

  // Read prefs at render time — SSR-safe: server returns null, client reads cookie.
  // Return a JSON string (primitive) so Object.is comparison is stable — returning an
  // object from getSnapshot causes an infinite loop because every call creates a new ref.
  const prefsJson = useSyncExternalStore(
    () => () => {},
    (): string | null => { const p = getPrefs(); return p ? JSON.stringify(p) : null },
    (): null => null
  )
  const prefs = prefsJson !== null ? (JSON.parse(prefsJson) as { sign: Sign; role: Role }) : null

  const [apiResult, setApiResult] = useState<ApiResult>({ kind: 'idle' })
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const callConnectApi = useCallback(async (connectTid: string, sign: Sign, role: Role) => {
    setApiResult({ kind: 'submitting' })
    try {
      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tid: connectTid, sign, role }),
      })
      if (res.ok) {
        setApiResult({ kind: 'success', sign, role })
      } else {
        const json = await res.json().catch(() => ({}))
        setApiResult({ kind: 'error', message: json.error ?? 'connection failed — please try again.' })
      }
    } catch {
      setApiResult({ kind: 'error', message: 'network error — please try again.' })
    }
  }, [])

  // Auto-submit when prefs and validTid are both known.
  // setState is only called inside async Promise callbacks, not in the synchronous effect body.
  useEffect(() => {
    if (!validTid || !prefs || apiResult.kind !== 'idle') return

    const { sign, role } = prefs
    fetch('/api/telegram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tid: validTid, sign, role }),
    })
      .then((res) => {
        if (res.ok) {
          setApiResult({ kind: 'success', sign, role })
        } else {
          return res.json()
            .catch(() => ({}))
            .then((json: Record<string, string>) => {
              setApiResult({ kind: 'error', message: json?.error ?? 'connection failed — please try again.' })
            })
        }
      })
      .catch(() => {
        setApiResult({ kind: 'error', message: 'network error — please try again.' })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTid, prefs?.sign, prefs?.role, apiResult.kind])

  function handleSignSelect(sign: Sign) {
    setSelectedSign(sign)
    if (selectedRole && validTid) {
      callConnectApi(validTid, sign, selectedRole)
    }
  }

  function handleRoleSelect(role: Role) {
    setSelectedRole(role)
    if (selectedSign && validTid) {
      callConnectApi(validTid, selectedSign, role)
    }
  }

  // ── Render — fully derived from validTid, prefs, apiResult ────────────────
  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />

        <div className="mt-8">
          {!validTid && (
            <p className="text-[13px] font-mono text-text-secondary" role="alert">
              {'// invalid link — please use the link sent by the 404tune bot.'}
            </p>
          )}

          {validTid && apiResult.kind === 'success' && (
            <p className="text-[13px] font-mono text-accent-violet" role="status">
              {`// connected. readings for ${formatSign(apiResult.sign)} × ${formatRole(apiResult.role)} will arrive at 08:00 your time.`}
            </p>
          )}

          {validTid && apiResult.kind === 'error' && (
            <p className="text-[13px] font-mono text-text-secondary" role="alert">
              {`// error — ${apiResult.message}`}
            </p>
          )}

          {validTid && (apiResult.kind === 'submitting' || (prefs && apiResult.kind === 'idle')) && (
            <p className="text-[13px] font-mono text-text-secondary">
              {apiResult.kind === 'submitting' ? '// connecting...' : '// initialising...'}
            </p>
          )}

          {validTid && !prefs && apiResult.kind === 'idle' && (
            <div>
              <p className="text-[13px] font-mono text-text-secondary mb-6">
                {'// select your sign and role to complete setup.'}
              </p>

              <fieldset className="border-0 p-0 m-0 min-w-0">
                <legend className="text-[13px] font-mono text-text-secondary mb-4">
                  {'// sign'}
                </legend>
                <div className="grid grid-cols-2 min-[390px]:grid-cols-3 gap-2">
                  {SIGNS.map((s) => {
                    const selected = selectedSign === s
                    return (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleSignSelect(s)}
                        className={[
                          'bg-transparent px-2 sm:px-3 py-1.5 border rounded-[4px] text-[11px] sm:text-[12px] font-mono cursor-pointer transition-all duration-150 w-full',
                          selected
                            ? 'border-accent-gold text-accent-gold'
                            : 'border-border text-text-secondary hover:border-text-secondary hover:text-text-primary',
                        ].join(' ')}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset className="border-0 p-0 m-0 min-w-0 mt-6">
                <legend className="text-[13px] font-mono text-text-secondary mb-4">
                  {'// role'}
                </legend>
                <div className="flex flex-wrap gap-3">
                  {ROLES.map((r) => {
                    const selected = selectedRole === r
                    return (
                      <button
                        key={r}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleRoleSelect(r)}
                        className={[
                          'bg-transparent px-2 sm:px-3 py-1.5 border rounded-[4px] text-[11px] sm:text-[12px] font-mono cursor-pointer transition-all duration-150',
                          selected
                            ? 'border-accent-gold text-accent-gold'
                            : 'border-border text-text-secondary hover:border-text-secondary hover:text-text-primary',
                        ].join(' ')}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </main>
  )
}

export default function ConnectPage() {
  return (
    <Suspense>
      <ConnectPageContent />
    </Suspense>
  )
}
