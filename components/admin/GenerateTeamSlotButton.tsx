'use client'

import { useRouter } from 'next/navigation'
import { GenerateButton } from './GenerateButton'

export function GenerateTeamSlotButton({ slot, date }: { slot: number; date: string }) {
  const router = useRouter()
  return (
    <GenerateButton
      type="team"
      slot={slot}
      date={date}
      label="generate"
      onSuccess={() => router.refresh()}
    />
  )
}
