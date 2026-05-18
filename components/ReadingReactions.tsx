'use client'

import { useState, useSyncExternalStore } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { getVote, setVote } from '@/lib/cookies'

const noopSubscribe = () => () => {}

type VoteValue = 'up' | 'down'

type Props = {
  readingId: string
  resourceType: 'readings' | 'team-readings'
}

export function ReadingReactions({ readingId, resourceType }: Props) {
  // Server snapshot is null to avoid hydration mismatch; client snapshot
  // re-reads on every render — same pattern as ShareFooter / CookieBanner.
  const cookieVote = useSyncExternalStore(
    noopSubscribe,
    () => getVote(readingId),
    () => null,
  )
  // `undefined` means "defer to cookie". Once the user clicks, this owns
  // the displayed value until the next mount.
  const [optimistic, setOptimistic] = useState<VoteValue | null | undefined>(undefined)
  const [pending, setPending] = useState(false)
  const vote: VoteValue | null = optimistic === undefined ? cookieVote : optimistic

  async function callApi(method: 'POST' | 'DELETE', kind: 'like' | 'dislike') {
    const res = await fetch(`/api/${resourceType}/${readingId}/${kind}`, { method })
    if (!res.ok) throw new Error(`${method} ${kind} failed: ${res.status}`)
  }

  async function handleClick(target: VoteValue) {
    if (pending) return
    const previous = vote
    const next: VoteValue | null = previous === target ? null : target

    // Cookie first — if it doesn't persist, bail before firing the API.
    const ok = setVote(readingId, next)
    if (!ok) {
      window.dispatchEvent(new Event('404tune:show-consent-banner'))
      return
    }

    setOptimistic(next)
    setPending(true)
    try {
      if (previous === null) {
        await callApi('POST', target === 'up' ? 'like' : 'dislike')
      } else if (next === null) {
        await callApi('DELETE', target === 'up' ? 'like' : 'dislike')
      } else {
        // Switching between up and down — fire both in parallel.
        await Promise.all([
          callApi('DELETE', previous === 'up' ? 'like' : 'dislike'),
          callApi('POST', target === 'up' ? 'like' : 'dislike'),
        ])
      }
    } catch (err) {
      console.error('[ReadingReactions] sync failed, reverting', err)
      setVote(readingId, previous)
      setOptimistic(previous)
    } finally {
      setPending(false)
    }
  }

  const upActive = vote === 'up'
  const downActive = vote === 'down'

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Like this reading"
        aria-pressed={upActive}
        disabled={pending}
        onClick={() => handleClick('up')}
        className="p-1 disabled:opacity-50"
      >
        <ThumbsUp
          size={13}
          strokeWidth={1.5}
          className={upActive ? 'text-accent-gold' : 'text-text-secondary'}
        />
      </button>
      <button
        type="button"
        aria-label="Dislike this reading"
        aria-pressed={downActive}
        disabled={pending}
        onClick={() => handleClick('down')}
        className="p-1 disabled:opacity-50"
      >
        <ThumbsDown
          size={13}
          strokeWidth={1.5}
          className={downActive ? 'text-accent-gold' : 'text-text-secondary'}
        />
      </button>
    </div>
  )
}
