import Link from 'next/link'

export function Header() {
  return (
    <header className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
      <Link href="/" aria-label="404tune home" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet rounded-sm">
        <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="30" stroke="#1E2A52" strokeWidth="1.5"/>
          <circle cx="32" cy="6"  r="2.5" fill="#C9A84C"/>
          <circle cx="55" cy="19" r="2"   fill="#7C6EF5"/>
          <circle cx="55" cy="45" r="2"   fill="#7C6EF5"/>
          <circle cx="32" cy="58" r="2.5" fill="#C9A84C"/>
          <circle cx="9"  cy="45" r="2"   fill="#7C6EF5"/>
          <circle cx="9"  cy="19" r="2"   fill="#7C6EF5"/>
          <circle cx="32" cy="32" r="3.5" fill="#C9A84C"/>
          <line x1="32" y1="6"  x2="55" y2="19" stroke="#1E2A52" strokeWidth="1"/>
          <line x1="55" y1="19" x2="55" y2="45" stroke="#1E2A52" strokeWidth="1"/>
          <line x1="55" y1="45" x2="32" y2="58" stroke="#1E2A52" strokeWidth="1"/>
          <line x1="32" y1="58" x2="9"  y2="45" stroke="#1E2A52" strokeWidth="1"/>
          <line x1="9"  y1="45" x2="9"  y2="19" stroke="#1E2A52" strokeWidth="1"/>
          <line x1="9"  y1="19" x2="32" y2="6"  stroke="#1E2A52" strokeWidth="1"/>
          <line x1="32" y1="6"  x2="32" y2="32" stroke="#C9A84C" strokeWidth="0.75" opacity="0.4"/>
          <line x1="55" y1="19" x2="32" y2="32" stroke="#7C6EF5" strokeWidth="0.75" opacity="0.4"/>
          <line x1="9"  y1="19" x2="32" y2="32" stroke="#7C6EF5" strokeWidth="0.75" opacity="0.4"/>
        </svg>
        <span className="text-[14px] font-bold font-mono tracking-[.02em] text-foreground">
          <span className="text-accent-gold">404</span>tune
        </span>
      </Link>
      <span className="ml-auto text-[11px] font-mono text-text-secondary">v1.0.0</span>
    </header>
  )
}
