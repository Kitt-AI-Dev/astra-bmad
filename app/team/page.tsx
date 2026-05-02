import type { Metadata } from 'next'
import TeamRedirect from '@/components/TeamRedirect'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Team Horoscope — 404tune',
  description:
    'Your daily team horoscope, calibrated to your squad. Built for engineering teams on 404tune.',
}

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />
        <h1 className="sr-only">Team Horoscope — 404tune</h1>
        <TeamRedirect />
        <Footer />
      </div>
    </main>
  )
}
