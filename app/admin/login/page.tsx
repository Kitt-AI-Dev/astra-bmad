import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParams

  async function sendMagicLink() {
    'use server'
    const adminEmail = process.env.ADMIN_EMAIL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!adminEmail || !appUrl) {
      redirect('/admin/login?error=send_failed')
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op — OTP send does not set cookies
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithOtp({
      email: adminEmail,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (error) {
      redirect('/admin/login?error=send_failed')
    }
    redirect('/admin/login?sent=true')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-8">
      <div className="w-full max-w-sm space-y-6 font-mono">
        <p className="text-text-secondary text-sm">{'// 404tune admin'}</p>

        {params.sent ? (
          <div className="space-y-2">
            <p className="text-success text-sm">{'// magic link sent'}</p>
            <p className="text-text-secondary text-xs">check your inbox</p>
          </div>
        ) : params.error === 'auth_failed' ? (
          <div className="space-y-4">
            <p className="text-error text-sm">{'// auth failed — try again'}</p>
            <form action={sendMagicLink}>
              <button
                type="submit"
                className="w-full border border-border bg-surface px-4 py-2 text-sm text-text-primary hover:border-accent-violet transition-colors"
              >
                send magic link
              </button>
            </form>
          </div>
        ) : params.error === 'send_failed' ? (
          <div className="space-y-4">
            <p className="text-error text-sm">{'// send failed — check Supabase config'}</p>
            <form action={sendMagicLink}>
              <button
                type="submit"
                className="w-full border border-border bg-surface px-4 py-2 text-sm text-text-primary hover:border-accent-violet transition-colors"
              >
                retry
              </button>
            </form>
          </div>
        ) : (
          <form action={sendMagicLink}>
            <button
              type="submit"
              className="w-full border border-border bg-surface px-4 py-2 text-sm text-text-primary hover:border-accent-violet transition-colors"
            >
              send magic link
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
