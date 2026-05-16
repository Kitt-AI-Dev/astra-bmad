// LLM responses sometimes wrap JSON output in markdown code fences (```json...```).
// Strip them before attempting JSON.parse. Safe to call on already-clean content.
export function stripJsonFence(rawContent: string): string {
  return rawContent
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
}

export function extractDescription(rawContent: string, maxLength = 155): string {
  const stripped = stripJsonFence(rawContent)

  try {
    const parsed = JSON.parse(stripped)
    if (typeof parsed?.general_reading === 'string') {
      const prose = parsed.general_reading.replace(/\s+/g, ' ').trim()
      return prose.length > maxLength ? prose.slice(0, maxLength) + '…' : prose
    }
  } catch {
    // fall through to raw fallback
  }

  const plain = stripped.replace(/\s+/g, ' ').trim()
  return plain.length > maxLength ? plain.slice(0, maxLength) + '…' : plain
}
