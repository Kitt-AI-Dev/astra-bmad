import HomeRedirect from '@/components/HomeRedirect'
import SignRoleSelector from '@/components/SignRoleSelector'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ change?: string }>
}) {
  const { change } = await searchParams
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-[680px] mx-auto">
        <HomeRedirect skipRedirect={change === '1'} />
        <SignRoleSelector />
      </div>
    </main>
  )
}
