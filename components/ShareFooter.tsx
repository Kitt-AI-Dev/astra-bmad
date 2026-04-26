'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearPrefs } from '@/lib/cookies'

export function ShareFooter({ url, changeHref }: { url: string; changeHref?: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      if (timerRef.current) clearTimeout(timerRef.current)
      setCopied(true)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <div className="mt-3">
      <p className="text-[13px] font-mono text-text-secondary">exit 0</p>
      <div className="border-t border-border mt-5 pt-5 flex items-center gap-4">
        <button
          onClick={handleCopy}
          aria-label="Copy shareable link to this reading"
          className="text-[12px] font-mono text-accent-violet border border-accent-violet px-4 py-2 rounded hover:bg-accent-violet hover:text-white transition-colors"
        >
          {copied ? '✓ link copied' : '$ share --copy-link'}
        </button>
        {changeHref && (
          <button
            onClick={() => { clearPrefs(); router.push(changeHref) }}
            className="ml-auto text-[13px] font-mono text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            {'[← change identity]'}
          </button>
        )}
      </div>
    </div>
  )
}
