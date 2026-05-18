'use client'

import { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { Send } from 'lucide-react'
import { getPrefs } from '@/lib/cookies'
import { ReadingReactions } from '@/components/ReadingReactions'

type ShareFooterProps = {
  url: string
  telegramBotUrl?: string
  readingId?: string
  resourceType?: 'readings' | 'team-readings'
}

export function ShareFooter({ url, telegramBotUrl, readingId, resourceType }: ShareFooterProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Computed on the client only — server snapshot is null to avoid hydration mismatch.
  // Returns a primitive string so Object.is comparison is stable between renders.
  const telegramHref = useSyncExternalStore(
    () => () => {},
    (): string | null => {
      if (!telegramBotUrl) return null
      const offset = -new Date().getTimezoneOffset()
      const prefs = getPrefs()
      const payload = prefs
        ? `tz_${offset}_${prefs.sign}_${prefs.role}`
        : `tz_${offset}`
      return `${telegramBotUrl}?start=${payload}`
    },
    (): null => null
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    if (readingId && resourceType) {
      fetch(`/api/${resourceType}/${readingId}/share`, { method: 'POST' }).catch(() => {})
    }
    const shareUrl = `${url}?utm_source=share&utm_medium=clipboard&utm_campaign=reading`
    try {
      await navigator.clipboard.writeText(shareUrl)
      if (timerRef.current) clearTimeout(timerRef.current)
      setCopied(true)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', shareUrl)
    }
  }

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center">
        <p className="text-[13px] font-mono text-text-secondary">exit 0</p>
        {readingId && resourceType && (
          <ReadingReactions readingId={readingId} resourceType={resourceType} />
        )}
      </div>
      <div className="border-t border-border mt-5 pt-5 flex items-center gap-4">
        <button
          onClick={handleCopy}
          aria-label="Copy shareable link to this reading"
          className="text-[12px] font-mono text-accent-violet border border-accent-violet px-4 py-2 rounded hover:bg-accent-violet hover:text-white transition-colors"
        >
          {copied ? '✓ link copied' : '$ share --copy-link'}
        </button>
        {telegramHref && (
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-2 text-[12px] font-mono text-accent-gold border border-accent-gold px-4 py-2 rounded hover:bg-accent-gold hover:text-bg transition-colors"
          >
            <Send size={13} strokeWidth={1.5} />
            {'$ subscribe'}
          </a>
        )}
      </div>
    </div>
  )
}
