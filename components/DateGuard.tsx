'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function DateGuard({
  serverDate,
  sign,
  role,
  children,
}: {
  serverDate: string
  sign: string
  role: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    const localDate = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    if (localDate !== serverDate) {
      router.replace(`/${sign}/${role}/${localDate}`)
    } else {
      setConfirmed(true)
    }
  }, [])

  return <div className={confirmed ? '' : 'invisible'}>{children}</div>
}
