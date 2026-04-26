'use client'

import { useState, useRef, useEffect } from 'react'

export function ShareFooter({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      <div className="border-t border-border mt-2 pt-3">
        <button
          onClick={handleCopy}
          aria-label="Copy shareable link to this reading"
          className="w-full md:w-auto text-[13px] font-mono text-accent-violet border border-accent-violet px-4 min-h-[44px] rounded hover:bg-accent-violet/10 transition-colors"
        >
          {copied ? '✓ link copied' : '$ share --copy-link'}
        </button>
      </div>
    </div>
  )
}
