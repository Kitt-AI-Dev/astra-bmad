import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 | 404tune',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-sm space-y-4 max-w-md">
        <p className="text-muted-foreground">
          // 404: cosmic coordinates not found<br />
          // Mercury is in retrograde and so is this URL.
        </p>
        <p className="text-foreground">
          exit 1 — requested reading has drifted into a parallel deployment
        </p>
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
