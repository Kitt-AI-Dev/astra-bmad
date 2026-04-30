import { SectionComment, MetricBar, MiniStat, CursedCommit } from './reading-sections'

type TeamReading = {
  id: string
  slot: number
  content: string
}

type Props = {
  reading: TeamReading | null
  state: 'ok' | 'not-found' | 'suppressed'
}

type ParsedContent = {
  isLegacy: boolean
  heading: string
  body: string[]
  luckyMove: string | null
  avoid: string | null
  metrics?: {
    deployLuck: number
    deployLuckNote: string
    bugRiskIndex: number
    bugRiskNote: string
    sprintEnergy: number
    sprintEnergyNote: string
  }
  coffeeRequirement?: number
  cursedCommit?: string
}

function parseContent(content: string): ParsedContent {
  // Attempt JSON parse first (new format)
  try {
    const parsed: unknown = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && typeof (parsed as Record<string, unknown>).heading === 'string') {
      const raw = parsed as Record<string, unknown>
      return {
        isLegacy: false,
        heading: raw.heading as string,
        body: typeof raw.body === 'string'
          ? raw.body.split('\n\n').map((s) => s.trim()).filter(Boolean)
          : [],
        luckyMove: null,
        avoid: typeof raw.avoid === 'string' ? raw.avoid : null,
        coffeeRequirement: typeof raw.coffee_requirement === 'number' ? raw.coffee_requirement : undefined,
        cursedCommit: typeof raw.cursed_commit === 'string' ? raw.cursed_commit : undefined,
        metrics: (
          typeof raw.deploy_luck === 'number' &&
          typeof raw.bug_risk_index === 'number' &&
          typeof raw.sprint_energy === 'number'
        ) ? {
          deployLuck: raw.deploy_luck as number,
          deployLuckNote: typeof raw.deploy_luck_note === 'string' ? raw.deploy_luck_note : '',
          bugRiskIndex: raw.bug_risk_index as number,
          bugRiskNote: typeof raw.bug_risk_note === 'string' ? raw.bug_risk_note : '',
          sprintEnergy: raw.sprint_energy as number,
          sprintEnergyNote: typeof raw.sprint_energy_note === 'string' ? raw.sprint_energy_note : '',
        } : undefined,
      }
    }
  } catch {
    // fall through to markdown parser
  }

  // Existing markdown parser
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)

  let heading = ''
  const body: string[] = []
  let luckyMove: string | null = null
  let avoid: string | null = null

  for (const block of blocks) {
    if (block.startsWith('## ')) {
      heading = block.slice(3).trim()
      continue
    }

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

    for (const line of lines) {
      const boldMatch = line.match(/^\*\*(.+?)\*\*\s+(.+)$/)
      if (boldMatch) {
        const key = boldMatch[1].replace(/:$/, '').trim()
        const value = boldMatch[2].trim()
        if (key === 'Lucky move') {
          luckyMove = value
        } else if (key === 'Avoid') {
          avoid = value
        }
        // role lines (QA will / PM will / etc.) silently dropped — roles are prose now
      } else {
        body.push(line)
      }
    }
  }

  return { isLegacy: true, heading, body, luckyMove, avoid }
}

export function TeamReadingCard({ reading, state }: Props) {
  if (state !== 'ok' || !reading) {
    const msg =
      state === 'suppressed'
        ? '// reading not yet published'
        : "// even the cosmos can't find what you're looking for"
    return (
      <article className="border border-border rounded-[8px] p-4 bg-surface">
        <p className="text-[13px] font-mono text-text-secondary">{msg}</p>
      </article>
    )
  }

  const { isLegacy, heading, body, luckyMove, avoid, metrics, coffeeRequirement, cursedCommit } = parseContent(reading.content)

  return (
    <article className="border border-border rounded-[8px] p-4 bg-surface space-y-4" aria-label="team horoscope">
      {heading && (
        <p className="text-[13px] font-mono text-text-secondary">
          {`// team: ${heading}`}
        </p>
      )}

      {body.length > 0 && (
        <div className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className="text-[13px] font-mono text-text-primary leading-[1.8]">
              {line}
            </p>
          ))}
        </div>
      )}

{!isLegacy && metrics && (
        <div className="border-t border-border pt-4">
          <SectionComment>daily metrics</SectionComment>
          <MetricBar name="Deploy Luck" value={metrics.deployLuck} note={metrics.deployLuckNote} />
          <MetricBar name="Bug Risk Index" value={metrics.bugRiskIndex} note={metrics.bugRiskNote} />
          <MetricBar name="Sprint Energy" value={metrics.sprintEnergy} note={metrics.sprintEnergyNote} />
        </div>
      )}

      {!isLegacy && (avoid != null || coffeeRequirement != null) && (
        <div className={`grid gap-3 ${avoid != null && coffeeRequirement != null ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {avoid != null && <MiniStat label="Avoid" value={avoid} wide={avoid != null && coffeeRequirement != null} />}
          {coffeeRequirement != null && (
            <MiniStat label="Coffee req." value={`${coffeeRequirement} cups`} />
          )}
        </div>
      )}

      {!isLegacy && cursedCommit && (
        <CursedCommit message={cursedCommit} />
      )}

      {isLegacy && (luckyMove || avoid) && (
        <div className="border-t border-border pt-3 flex gap-6 flex-wrap">
          {luckyMove && (
            <div>
              <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">lucky move</p>
              <p className="text-[13px] font-mono text-accent-gold">{luckyMove}</p>
            </div>
          )}
          {avoid && (
            <div>
              <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">avoid</p>
              <p className="text-[13px] font-mono text-accent-gold">{avoid}</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
