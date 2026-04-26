import HomeRedirect from '@/components/HomeRedirect'
import SignRoleSelector from '@/components/SignRoleSelector'

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-[680px] mx-auto">
        <HomeRedirect />
        <SignRoleSelector />
      </div>
    </main>
  )
}
