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
  heading: string
  body: string[]
  roleLines: { key: string; value: string }[]
  luckyMove: string | null
  avoid: string | null
}

function parseContent(content: string): ParsedContent {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)

  let heading = ''
  const body: string[] = []
  const roleLines: { key: string; value: string }[] = []
  let luckyMove: string | null = null
  let avoid: string | null = null

  for (const block of blocks) {
    if (block.startsWith('## ')) {
      heading = block.slice(3).trim()
      continue
    }

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    let isRoleBlock = false

    for (const line of lines) {
      // Match **Key:** value or **Key will** value
      const boldMatch = line.match(/^\*\*(.+?)\*\*\s+(.+)$/)
      if (boldMatch) {
        const key = boldMatch[1].replace(/:$/, '').trim()
        const value = boldMatch[2].trim()
        if (key === 'Lucky move') {
          luckyMove = value
        } else if (key === 'Avoid') {
          avoid = value
        } else {
          roleLines.push({ key, value })
          isRoleBlock = true
        }
      } else if (!isRoleBlock) {
        body.push(line)
      }
    }
  }

  return { heading, body, roleLines, luckyMove, avoid }
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

  const { heading, body, roleLines, luckyMove, avoid } = parseContent(reading.content)

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

      {roleLines.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          {roleLines.map(({ key, value }, i) => (
            <p key={i} className="text-[13px] font-mono">
              <span className="text-accent-violet">{key}</span>
              <span className="text-text-secondary"> will </span>
              <span className="text-text-primary">{value}</span>
            </p>
          ))}
        </div>
      )}

      {(luckyMove || avoid) && (
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
