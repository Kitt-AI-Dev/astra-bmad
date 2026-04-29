import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg font-mono">
      <nav className="border-b border-border px-6 py-3 flex gap-6">
        <Link
          href="/admin/readings"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {'// readings'}
        </Link>
        <Link
          href="/admin/batches"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {'// batches'}
        </Link>
        <Link
          href="/admin/team-readings"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {'// team readings'}
        </Link>
      </nav>
      <main className="p-6">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  )
}
