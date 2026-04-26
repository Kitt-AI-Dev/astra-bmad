'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPrefs } from '@/lib/cookies'
import { SIGNS, ROLES } from '@/lib/constants'

export default function HomeRedirect({ skipRedirect = false }: { skipRedirect?: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (skipRedirect) return
    const prefs = getPrefs()
    if (prefs && SIGNS.includes(prefs.sign) && ROLES.includes(prefs.role)) {
      router.replace(`/${prefs.sign}/${prefs.role}`)
    }
  }, [skipRedirect])

  return null
}
