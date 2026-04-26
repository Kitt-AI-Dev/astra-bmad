'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function DateGuard({
  serverDate,
  sign,
  role,
}: {
  serverDate: string
  sign: string
  role: string
}) {
  const router = useRouter()

  useEffect(() => {
    const localDate = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    if (localDate !== serverDate) {
      router.replace(`/${sign}/${role}/${localDate}`)
    }
  }, [])

  return null
}
