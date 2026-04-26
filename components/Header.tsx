import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
      <Link href="/" aria-label="404tune home" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet rounded-sm">
        <Image src="/logo.png" alt="" width={32} height={32} className="shrink-0" aria-hidden />
        <span className="text-[14px] font-bold font-mono tracking-[.02em] text-foreground">
          <span className="text-accent-gold">404</span>tune
        </span>
      </Link>
      <span className="ml-auto text-[11px] font-mono text-text-secondary">v1.0.0</span>
    </header>
  )
}
