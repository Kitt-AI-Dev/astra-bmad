import Link from 'next/link'

export function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-border mt-10 py-4 flex flex-wrap items-center justify-between gap-4">
      <p className="text-[11px] font-mono text-text-secondary">{'// © 2026 404tune'}</p>
      <div className="flex gap-4">
        <Link
          href="/privacy"
          className="text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          privacy policy
        </Link>
        <Link
          href="/terms"
          className="text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          terms of service
        </Link>
      </div>
    </footer>
  )
}
