'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPrefs } from '@/lib/cookies'
import { SIGNS, ROLES } from '@/lib/constants'

export default function HomeRedirect() {
  const router = useRouter()

  useEffect(() => {
    const prefs = getPrefs()
    if (prefs && SIGNS.includes(prefs.sign) && ROLES.includes(prefs.role)) {
      router.replace(`/${prefs.sign}/${prefs.role}`)
    }
  }, [router])

  return null
}
