import type { Metadata } from 'next'
import HomeRedirect from '@/components/HomeRedirect'
import SignRoleSelector from '@/components/SignRoleSelector'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: '404tune — Daily IT Horoscope for Your Sign and Role',
  description:
    'Your daily horoscope tuned to your zodiac sign and IT role. Built for software engineers, DevOps pros, data scientists, designers, and more.',
  alternates: {
    canonical: 'https://404tune.dev/',
  },
  openGraph: {
    title: '404tune — Daily IT Horoscope for Your Sign and Role',
    description:
      'Your daily horoscope tuned to your zodiac sign and IT role. Built for software engineers, DevOps pros, data scientists, designers, and more.',
    url: 'https://404tune.dev/',
    type: 'website',
    siteName: '404tune',
    images: [{ url: 'https://404tune.dev/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '404tune — Daily IT Horoscope for Your Sign and Role',
    description:
      'Your daily horoscope tuned to your zodiac sign and IT role. Built for software engineers, DevOps pros, data scientists, designers, and more.',
    images: ['https://404tune.dev/opengraph-image'],
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />
        <h1 className="sr-only">Your daily horoscope for your sign and IT role</h1>
        <HomeRedirect />
        <SignRoleSelector />
        <Footer />
      </div>
    </main>
  )
}
