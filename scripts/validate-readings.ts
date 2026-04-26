/**
 * Validate readings against the schema, caps, and content rules in docs/prompt-style-guide.md.
 *
 * Usage:
 *   pnpm tsx --env-file=.env scripts/validate-readings.ts [--month YYYY-MM] [--limit N] [--verbose]
 *
 * Exits 0 if all rows pass, 1 if any row fails, 2 on fatal error.
 */

import { createClient } from '@supabase/supabase-js'
import { SIGNS, ROLES } from '../lib/constants'
import type { Sign, Role } from '../lib/constants'

const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
]

const VERB_TO_SYMBOL: Record<string, string> = {
  squares: '□',
  trines: '△',
  conjuncts: '☌',
  opposes: '☍',
  sextiles: '✶',
}

const BANNED_PHRASES = [
  'a period of transformation',
  'the stars align',
  'exciting opportunities',
  'trust the process',
  'take a step back',
  'things will go wrong',
  "you've got this",
]

const ALLOWED_FIELDS = new Set(['general_reading', 'lucky_value', 'avoid', 'planetary_influence'])

const CAPS: Record<string, number> = {
  lucky_value: 24,
  avoid: 50,
  planetary_influence: 20,
}

type ReadingRow = {
  sign: string
  role: string
  date: string
  content: string
  batch_month: string | null
}

type CheckFailure = { check: string; detail: string }

function validateRow(row: ReadingRow): CheckFailure[] {
  const failures: CheckFailure[] = []

  if (!SIGNS.includes(row.sign as Sign)) {
    failures.push({ check: 'invalid_sign', detail: `"${row.sign}" not in canonical SIGNS` })
  }
  if (!ROLES.includes(row.role as Role)) {
    failures.push({ check: 'invalid_role', detail: `"${row.role}" not in canonical ROLES` })
  }

  const trimmed = row.content.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    failures.push({ check: 'json_envelope', detail: 'content does not start with { and end with }' })
    return failures
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(trimmed)
  } catch (e) {
    failures.push({ check: 'json_parse', detail: `JSON.parse failed: ${(e as Error).message}` })
    return failures
  }

  const keys = Object.keys(parsed)
  const missing = [...ALLOWED_FIELDS].filter((k) => !keys.includes(k))
  const extra = keys.filter((k) => !ALLOWED_FIELDS.has(k))
  if (missing.length) failures.push({ check: 'schema_missing', detail: `missing: ${missing.join(', ')}` })
  if (extra.length) failures.push({ check: 'schema_extra', detail: `unexpected: ${extra.join(', ')}` })

  for (const f of ALLOWED_FIELDS) {
    if (parsed[f] !== undefined && typeof parsed[f] !== 'string') {
      failures.push({ check: 'schema_type', detail: `${f} is not a string` })
    }
  }

  for (const [field, cap] of Object.entries(CAPS)) {
    const v = parsed[field]
    if (typeof v === 'string' && v.length > cap) {
      failures.push({ check: `cap_${field}`, detail: `${v.length} chars (cap ${cap}): "${v}"` })
    }
  }

  const generalReading = parsed.general_reading
  const planetaryInfluence = parsed.planetary_influence
  const avoid = parsed.avoid

  if (typeof generalReading === 'string' && typeof planetaryInfluence === 'string') {
    const tokens = generalReading.trim().split(/\s+/)
    const openingPlanet = (tokens[0] ?? '').replace(/[^A-Za-z]/g, '')
    const openingVerb = (tokens[1] ?? '').replace(/[^A-Za-z]/g, '')

    if (!PLANETS.includes(openingPlanet)) {
      failures.push({ check: 'opening_planet', detail: `not a known planet: "${openingPlanet}"` })
    }
    if (!(openingVerb in VERB_TO_SYMBOL)) {
      failures.push({ check: 'opening_verb', detail: `not a known aspect verb: "${openingVerb}"` })
    }

    const signCapitalized = row.sign.charAt(0).toUpperCase() + row.sign.slice(1)
    const firstSentence = generalReading.split(/[.!?]/)[0] ?? ''
    if (!firstSentence.includes(signCapitalized)) {
      failures.push({ check: 'opening_sign', detail: `"${signCapitalized}" not in first sentence` })
    }

    const piPlanet = (planetaryInfluence.trim().split(/\s+/)[0] ?? '').replace(/[^A-Za-z]/g, '')
    if (PLANETS.includes(openingPlanet) && piPlanet && openingPlanet !== piPlanet) {
      failures.push({
        check: 'planet_match',
        detail: `opening "${openingPlanet}" ≠ planetary_influence "${piPlanet}"`,
      })
    }

    if (openingVerb in VERB_TO_SYMBOL) {
      const expected = VERB_TO_SYMBOL[openingVerb]
      if (!planetaryInfluence.includes(expected)) {
        failures.push({
          check: 'symbol_match',
          detail: `verb "${openingVerb}" expects "${expected}" in "${planetaryInfluence}"`,
        })
      }
    }
  }

  const haystack = [generalReading, avoid]
    .filter((s): s is string => typeof s === 'string')
    .join(' ')
    .toLowerCase()
  for (const phrase of BANNED_PHRASES) {
    if (haystack.includes(phrase.toLowerCase())) {
      failures.push({ check: 'banned_phrase', detail: `contains "${phrase}"` })
    }
  }

  return failures
}

async function main() {
  const args = process.argv.slice(2)
  const monthIdx = args.indexOf('--month')
  const month = monthIdx >= 0 ? (args[monthIdx + 1] ?? null) : null
  const limitIdx = args.indexOf('--limit')
  const limitArg = limitIdx >= 0 ? args[limitIdx + 1] : null
  const limit = limitArg ? parseInt(limitArg, 10) : null
  const verbose = args.includes('--verbose')

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error(`--month must be YYYY-MM, got "${month}"`)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
  if (!key) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  console.log(`[validate-readings] Loading rows${month ? ` for month ${month}` : ''}${limit ? ` (limit ${limit})` : ''}...`)
  const PAGE = 1000
  const rows: ReadingRow[] = []
  let from = 0
  while (true) {
    let q = supabase.from('readings').select('sign, role, date, content, batch_month')
    if (month) q = q.eq('batch_month', month)
    q = q.range(from, from + PAGE - 1)
    const { data, error } = await q
    if (error) throw new Error(`Supabase query failed: ${error.message}`)
    const page = (data ?? []) as ReadingRow[]
    rows.push(...page)
    if (page.length < PAGE) break
    from += PAGE
    if (limit && rows.length >= limit) break
  }
  if (limit && rows.length > limit) rows.length = limit
  console.log(`[validate-readings] Loaded ${rows.length} row(s)`)

  const failuresByCheck: Record<string, number> = {}
  let failCount = 0
  for (const row of rows) {
    const failures = validateRow(row)
    if (failures.length > 0) {
      failCount++
      for (const f of failures) {
        failuresByCheck[f.check] = (failuresByCheck[f.check] ?? 0) + 1
      }
      if (verbose) {
        console.log(`\n[FAIL] ${row.sign}/${row.role}/${row.date}`)
        for (const f of failures) console.log(`  - ${f.check}: ${f.detail}`)
      }
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Rows checked: ${rows.length}`)
  console.log(`Pass: ${rows.length - failCount}`)
  console.log(`Fail: ${failCount}`)
  if (Object.keys(failuresByCheck).length > 0) {
    console.log('\nFailures by check:')
    const sorted = Object.entries(failuresByCheck).sort((a, b) => b[1] - a[1])
    for (const [check, count] of sorted) {
      console.log(`  ${check}: ${count}`)
    }
  }

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('[validate-readings] FATAL:', e)
  process.exit(2)
})
