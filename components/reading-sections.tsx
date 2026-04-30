export function asciiBar(value: number, width = 20): string {
  const clamped = Math.min(100, Math.max(0, isFinite(value) ? value : 0))
  const fillCount = Math.round((clamped / 100) * width)
  return '='.repeat(Math.max(0, fillCount - 1)) + (fillCount > 0 ? '>' : '')
}

export function SectionComment({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] text-text-secondary tracking-[.02em] mb-3">
      <span className="text-[#5a6896]">{'// '}</span>{children}
    </p>
  )
}

export function MetricBar({ name, value, note }: { name: string; value: number; note: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[.14em] text-text-secondary">{name}</span>
        <span className="font-mono text-[13px] text-accent-gold tracking-[.02em]">
          {value}<span className="text-[#5a6896]">/100</span>
        </span>
      </div>
      <div className="flex items-center font-mono text-[13px] text-accent-gold whitespace-pre tracking-[0]">
        <span>[</span>
        <span>{asciiBar(value)}</span>
        <span className="flex-1" />
        <span>]</span>
      </div>
      {note && (
        <p className="font-mono text-[12px] text-text-secondary mt-1 leading-[1.5]">
          <span className="text-[#5a6896]">{'// '}</span>{note}
        </p>
      )}
    </div>
  )
}

export function MiniStat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={`${wide ? 'col-span-2 ' : ''}border border-border rounded-lg p-3 bg-surface flex flex-col gap-1 min-w-0`}
    >
      <span className="block font-mono text-[10px] uppercase tracking-[.1em] text-text-secondary">{label}</span>
      <span className="font-mono text-[13px] text-accent-gold break-words leading-[1.4]">{value}</span>
    </div>
  )
}

export function CursedCommit({ message }: { message: string }) {
  return (
    <div className="mt-3 border border-dashed border-border rounded-lg p-3">
      <span className="block font-mono text-[10px] uppercase tracking-[.1em] text-text-secondary mb-1.5">
        CURSED COMMIT OF THE DAY
      </span>
      <div className="font-mono text-[13px] text-accent-gold break-words">
        <span className="text-accent-gold">{'$ '}</span>
        {'git commit -m '}
        <span className="text-accent-violet">{'"'}{message}{'"'}</span>
      </div>
    </div>
  )
}
