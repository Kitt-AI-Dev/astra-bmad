import type { Sign, Role } from '@/lib/constants'
import { SectionComment, MetricBar, MiniStat, CursedCommit } from './reading-sections'

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

type ParsedContent = {
  body: string
  isLegacy: boolean
  metrics?: {
    deployLuck: number
    deployLuckNote: string
    bugRiskIndex: number
    bugRiskNote: string
    sprintEnergy: number
    sprintEnergyNote: string
  }
  avoid?: string
  coffeeRequirement?: number
  cursedCommit?: string
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

function parseContent(content: string): ParsedContent {
  const trimmed = content.trim()
  const stripped = trimmed
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')

  if (stripped.startsWith('{')) {
    const parsed = tryParseStructured(stripped)
    if (parsed === null) {
      return { body: content, isLegacy: true }
    }
    if (typeof parsed.general_reading === 'string') {
      const body = parsed.general_reading.replace(/\s+/g, ' ').trim()
      const raw = parsed as Record<string, unknown>

      if (raw.lucky_value !== undefined || raw.planetary_influence !== undefined) {
        return { body, isLegacy: true }
      }

      if (
        typeof raw.deploy_luck === 'number' &&
        typeof raw.bug_risk_index === 'number' &&
        typeof raw.sprint_energy === 'number'
      ) {
        return {
          body,
          isLegacy: false,
          metrics: {
            deployLuck: raw.deploy_luck,
            deployLuckNote: typeof raw.deploy_luck_note === 'string' ? raw.deploy_luck_note : '',
            bugRiskIndex: raw.bug_risk_index,
            bugRiskNote: typeof raw.bug_risk_note === 'string' ? raw.bug_risk_note : '',
            sprintEnergy: raw.sprint_energy,
            sprintEnergyNote: typeof raw.sprint_energy_note === 'string' ? raw.sprint_energy_note : '',
          },
          avoid: typeof raw.avoid === 'string' ? raw.avoid : undefined,
          coffeeRequirement: typeof raw.coffee_requirement === 'number' ? raw.coffee_requirement : undefined,
          cursedCommit: typeof raw.cursed_commit === 'string' ? raw.cursed_commit : undefined,
        }
      }

      return { body, isLegacy: true }
    } else {
      // JSON parsed but no general_reading — unknown shape; suppress raw JSON
      return { body: '', isLegacy: true }
    }
  }

  const sep = content.indexOf('\n\n---\n')
  if (sep === -1) return { body: content, isLegacy: true }
  return { body: content.slice(0, sep), isLegacy: true }
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

  const { body, isLegacy, metrics, avoid, coffeeRequirement, cursedCommit } = parseContent(reading.content)

  return (
    <div aria-live="polite">
      <article className="border border-border rounded-lg p-4 bg-surface">
        <SectionComment>{"today's reading"}</SectionComment>
        <div className="text-[13px] font-mono text-foreground leading-[1.8] whitespace-pre-wrap">
          {renderBody(body)}
        </div>
        {!isLegacy && metrics && (
          <div className="border-t border-border mt-5 pt-4">
            <SectionComment>daily metrics</SectionComment>
            <MetricBar name="Deploy Luck" value={metrics.deployLuck} note={metrics.deployLuckNote} />
            <MetricBar name="Bug Risk Index" value={metrics.bugRiskIndex} note={metrics.bugRiskNote} />
            <MetricBar name="Sprint Energy" value={metrics.sprintEnergy} note={metrics.sprintEnergyNote} />
          </div>
        )}
        {!isLegacy && (avoid != null || coffeeRequirement != null) && (
          <div className={`mt-4 grid gap-3 ${avoid != null && coffeeRequirement != null ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {avoid != null && <MiniStat label="Avoid" value={avoid} wide={avoid != null && coffeeRequirement != null} />}
            {coffeeRequirement != null && (
              <MiniStat label="Coffee req." value={`${coffeeRequirement} cups`} />
            )}
          </div>
        )}
        {!isLegacy && cursedCommit && (
          <CursedCommit message={cursedCommit} />
        )}
      </article>
    </div>
  )
}

export function ReadingCardSkeleton() {
  return (
    <div aria-live="polite">
      <div className="border border-border rounded-lg p-4 bg-surface animate-pulse">
        <div className="h-2 w-28 bg-border rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-border rounded" />
          <div className="h-3 w-5/6 bg-border rounded" />
          <div className="h-3 w-4/5 bg-border rounded" />
          <div className="h-3 w-full bg-border rounded" />
          <div className="h-3 w-3/4 bg-border rounded" />
        </div>
        <div className="h-px bg-border mt-5 mb-4" />
        <div className="h-2 w-24 bg-border rounded mb-3" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between mb-1">
              <div className="h-2 w-20 bg-border rounded" />
              <div className="h-2 w-12 bg-border rounded" />
            </div>
            <div className="h-3 w-full bg-border rounded" />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="col-span-2 h-14 bg-border rounded-lg" />
          <div className="h-14 bg-border rounded-lg" />
        </div>
      </div>
    </div>
  )
}
