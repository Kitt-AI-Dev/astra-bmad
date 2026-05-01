import HomeRedirect from '@/components/HomeRedirect'
import SignRoleSelector from '@/components/SignRoleSelector'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ change?: string }>
}) {
  const { change } = await searchParams
  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />
        <HomeRedirect skipRedirect={change === '1'} />
        <SignRoleSelector />
        <Footer />
      </div>
    </main>
  )
}
