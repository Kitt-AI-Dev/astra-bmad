'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPrefs } from '@/lib/cookies'

export function NavMenu() {
  const pathname = usePathname()
  const [personalHref, setPersonalHref] = useState('/')

  useEffect(() => {
    const prefs = getPrefs()
    if (prefs) setPersonalHref(`/${prefs.sign}/${prefs.role}`)
  }, [])

  if (pathname.startsWith('/admin')) return null

  const isTeamPage = pathname === '/team' || pathname.startsWith('/team/')

  const option = isTeamPage
    ? { label: 'Personal Horoscope', href: personalHref }
    : { label: 'Team Horoscope', href: '/team' }

  return (
    <details className="relative ml-auto">
      <summary className="cursor-pointer list-none inline-flex items-center justify-center text-[18px] leading-none font-mono text-text-secondary hover:text-text-primary transition-colors select-none px-2 py-[6px] rounded-[4px] min-w-8 min-h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet">
        ☰
      </summary>
      <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-[4px] py-1 min-w-[160px] z-10">
        <Link
          href={option.href}
          className="block px-3 py-2 text-[13px] font-mono text-text-secondary hover:text-text-primary hover:bg-primary-light transition-colors"
        >
          {option.label}
        </Link>
      </div>
    </details>
  )
}
