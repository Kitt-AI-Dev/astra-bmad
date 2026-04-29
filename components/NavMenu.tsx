'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getPrefs } from '@/lib/cookies'

export function NavMenu() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  const isTeamPage = pathname === '/team' || pathname.startsWith('/team/')

  const personalHref = (() => {
    const prefs = getPrefs()
    return prefs ? `/${prefs.sign}/${prefs.role}` : '/'
  })()

  const option = isTeamPage
    ? { label: 'Personal Horoscope', href: personalHref }
    : { label: 'Team Horoscope', href: '/team' }

  return (
    <details className="relative ml-auto">
      <summary className="cursor-pointer list-none text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet rounded-sm">
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
