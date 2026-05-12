import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404tune — Connect Telegram',
  robots: 'noindex',
}

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
