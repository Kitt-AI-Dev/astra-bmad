'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export function ShareFooter({ url, telegramBotUrl }: { url: string; telegramBotUrl?: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const telegramHref = telegramBotUrl
    ? `${telegramBotUrl}?start=tz_${-new Date().getTimezoneOffset()}`
    : undefined

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
