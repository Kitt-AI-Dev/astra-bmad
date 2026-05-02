export function extractDescription(rawContent: string, maxLength = 155): string {
  const stripped = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/\n?```\s*$/m, '')
    .trim()

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
