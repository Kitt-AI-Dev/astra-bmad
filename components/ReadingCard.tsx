import type { Sign, Role } from '@/lib/constants'

export type Reading = {
  id: string
  sign: Sign | string
  role: Role | string
  date: string
  content: string
}

type ReadingCardProps = {
  reading: Reading | null
  nullVariant?: 'not-published' | 'unavailable'
}

function escapeControlsInsideStrings(s: string): string {
  let out = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escaped) {
      out += c
      escaped = false
      continue
    }
    if (inString && c === '\\') {
      out += c
      escaped = true
      continue
    }
    if (c === '"') {
      inString = !inString
      out += c
      continue
    }
    if (inString) {
      if (c === '\n') { out += '\\n'; continue }
      if (c === '\r') { out += '\\r'; continue }
      if (c === '\t') { out += '\\t'; continue }
    }
    out += c
  }
  return out
}

function tryParseStructured(input: string): {
  general_reading?: unknown
  lucky_value?: unknown
  avoid?: unknown
  planetary_influence?: unknown
} | null {
  try {
    return JSON.parse(input)
  } catch {
    try {
      return JSON.parse(escapeControlsInsideStrings(input))
    } catch {
      return null
    }
  }
}

function parseContent(content: string): { body: string; stats: { label: string; value: string }[] } {
  const trimmed = content.trim()
  const stripped = trimmed
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')

  if (stripped.startsWith('{')) {
    const parsed = tryParseStructured(stripped)
    if (parsed && typeof parsed.general_reading === 'string') {
      const stats: { label: string; value: string }[] = []
      if (typeof parsed.lucky_value === 'string' && parsed.lucky_value.length > 0) {
        stats.push({ label: 'Lucky namespace', value: parsed.lucky_value })
      }
      if (typeof parsed.avoid === 'string' && parsed.avoid.length > 0) {
        stats.push({ label: 'Avoid', value: parsed.avoid })
      }
      if (typeof parsed.planetary_influence === 'string' && parsed.planetary_influence.length > 0) {
        stats.push({ label: 'Planetary influence', value: parsed.planetary_influence })
      }
      return { body: parsed.general_reading.replace(/\s+/g, ' ').trim(), stats }
    }
  }

  const sep = content.indexOf('\n\n---\n')
  if (sep === -1) return { body: content, stats: [] }
  const body = content.slice(0, sep)
  const statsSection = content.slice(sep + 6).trim()
  const stats = statsSection
    .split('\n')
    .map((line) => {
      const idx = line.indexOf(': ')
      if (idx === -1) return null
      return { label: line.slice(0, idx), value: line.slice(idx + 2) }
    })
    .filter((s): s is { label: string; value: string } => s !== null)
  return { body, stats }
}

function renderBody(body: string): React.ReactNode {
  const parts = body.split(/(<highlight>[\s\S]*?<\/highlight>|<cmd>[\s\S]*?<\/cmd>)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<highlight>')) {
          return <span key={i} className="text-accent-gold">{part.slice(11, -12)}</span>
        }
        if (part.startsWith('<cmd>')) {
          return <span key={i} className="text-accent-violet">{part.slice(5, -6)}</span>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export function ReadingCard({ reading, nullVariant = 'not-published' }: ReadingCardProps) {
  if (!reading) {
    return (
      <div aria-live="polite">
        <article className="border border-border rounded-lg p-4 bg-surface">
          <p className="text-[13px] text-text-secondary">
            {nullVariant === 'unavailable' ? '// reading unavailable' : '// reading not yet published'}
          </p>
        </article>
      </div>
    )
  }

  const { body, stats } = parseContent(reading.content)

  return (
    <div aria-live="polite">
      <article className="border border-border rounded-lg p-4 bg-surface">
        <div className="text-[13px] font-mono text-foreground leading-[1.8] whitespace-pre-wrap">
          {renderBody(body)}
        </div>
        {stats.length > 0 && (
          <div className="border-t border-border mt-5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] uppercase tracking-[.1em] text-text-secondary">{stat.label}</span>
                <span className="text-[13px] text-accent-gold font-mono break-words leading-[1.4]">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}

export function ReadingCardSkeleton() {
  return (
    <div aria-live="polite">
      <div className="border border-border rounded-lg p-4 bg-surface animate-pulse">
        <div className="h-3 w-48 bg-border rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-border rounded" />
          <div className="h-3 w-5/6 bg-border rounded" />
          <div className="h-3 w-4/5 bg-border rounded" />
          <div className="h-3 w-full bg-border rounded" />
          <div className="h-3 w-3/4 bg-border rounded" />
        </div>
        <div className="border-t border-border mt-4 pt-4 flex gap-6">
          <div className="flex flex-col gap-1">
            <div className="h-2 w-16 bg-border rounded" />
            <div className="h-3 w-10 bg-border rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2 w-16 bg-border rounded" />
            <div className="h-3 w-10 bg-border rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2 w-16 bg-border rounded" />
            <div className="h-3 w-10 bg-border rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
