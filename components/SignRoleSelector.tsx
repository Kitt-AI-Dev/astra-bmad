'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SIGNS, ROLES } from '@/lib/constants'
import type { Sign, Role } from '@/lib/constants'
import { getPrefs, setPrefs } from '@/lib/cookies'

function chipClass(selected: boolean): string {
  const base =
    'min-h-[44px] min-w-[44px] px-3 py-2 border rounded text-[13px] font-mono transition-none focus-visible:outline-2 focus-visible:outline-accent-violet cursor-pointer'
  return selected
    ? `${base} border-accent-violet text-accent-violet`
    : `${base} border-border text-text-secondary hover:border-accent-violet/50`
}

export default function SignRoleSelector() {
  const router = useRouter()
  const [sign, setSign] = useState<Sign | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const signContainerRef = useRef<HTMLDivElement>(null)
  const roleContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefs = getPrefs()
    if (prefs) {
      setSign(prefs.sign)
      setRole(prefs.role)
    }
  }, [])

  function handleSignSelect(s: Sign) {
    setSign(s)
    if (role) {
      setPrefs(s, role)
      router.push(`/${s}/${role}`)
    }
  }

  function handleRoleSelect(r: Role) {
    setRole(r)
    if (sign) {
      setPrefs(sign, r)
      router.push(`/${sign}/${r}`)
    }
  }

  function handleKeyDown<T extends string>(
    e: React.KeyboardEvent<HTMLButtonElement>,
    items: readonly T[],
    current: T | null,
    onSelect: (item: T) => void,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) {
    const idx = current !== null ? items.indexOf(current) : 0
    let next = idx

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      next = (idx + 1) % items.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      next = (idx - 1 + items.length) % items.length
    } else {
      return
    }

    onSelect(items[next])
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    buttons?.[next]?.focus()
  }

  return (
    <div>
      <p className="text-[13px] font-mono text-text-secondary mb-6">
        {'$ horoscope --select-identity'}
      </p>

      <fieldset className="border-0 p-0 m-0 min-w-0">
        <legend className="text-[13px] font-mono text-text-secondary mb-3">
          {'// select sign'}
        </legend>
        <div ref={signContainerRef} className="grid grid-cols-3 gap-2">
          {SIGNS.map((s, i) => {
            const isSelected = sign === s
            const tabIdx = isSelected ? 0 : sign === null && i === 0 ? 0 : -1
            return (
              <button
                key={s}
                role="radio"
                aria-checked={isSelected}
                tabIndex={tabIdx}
                onClick={() => handleSignSelect(s)}
                onKeyDown={(e) => handleKeyDown(e, SIGNS, sign, handleSignSelect, signContainerRef)}
                className={chipClass(isSelected)}
              >
                {s}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="border-0 p-0 m-0 min-w-0 mt-6">
        <legend className="text-[13px] font-mono text-text-secondary mb-3">
          {'// select role'}
        </legend>
        <div ref={roleContainerRef} className="flex flex-wrap gap-2">
          {ROLES.map((r, i) => {
            const isSelected = role === r
            const tabIdx = isSelected ? 0 : role === null && i === 0 ? 0 : -1
            return (
              <button
                key={r}
                role="radio"
                aria-checked={isSelected}
                tabIndex={tabIdx}
                onClick={() => handleRoleSelect(r)}
                onKeyDown={(e) => handleKeyDown(e, ROLES, role, handleRoleSelect, roleContainerRef)}
                className={chipClass(isSelected)}
              >
                {r}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
