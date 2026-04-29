import type Anthropic from '@anthropic-ai/sdk'
import { SIGNS, TEAM_ARCHETYPES } from '../lib/constants'
import type { Sign, Role } from '../lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchRequest = Anthropic.Beta.Messages.BatchCreateParams.Request

export type ReadingResult = {
  customId: string
  sign: Sign
  role: Role
  date: string // YYYY-MM-DD
  content: string
}

// ---------------------------------------------------------------------------
// custom_id helpers
// ---------------------------------------------------------------------------

export function buildCustomId(sign: string, role: string, date: string): string {
  return `${sign}-${role}-${date}`
}

// Date is always the last 10 chars (YYYY-MM-DD). Never split on '-' naively —
// role slugs like 'software-engineer' contain hyphens.
export function parseCustomId(customId: string): { sign: Sign; role: Role; date: string } {
  const date = customId.slice(-10)
  const prefix = customId.slice(0, -11) // strip trailing '-YYYY-MM-DD'

  const sign = SIGNS.find((s) => prefix.startsWith(s))
  if (!sign) throw new Error(`parseCustomId: unknown sign in "${customId}"`)
  const role = prefix.slice(sign.length + 1) as Role // skip 'sign-'
  if (!role) throw new Error(`parseCustomId: could not extract role from "${customId}"`)
  return { sign, role, date }
}

// ---------------------------------------------------------------------------
// Prompt constants (source of truth: docs/prompt-style-guide.md v1.1)
// Update these when the style guide version changes.
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<Role, string> = {
  'software-engineer': 'Software Engineer',
  'devops': 'DevOps Engineer',
  'qa': 'QA Engineer',
  'frontend': 'Frontend Engineer',
  'product-manager': 'Product Manager',
  'project-manager': 'Project Manager',
  'data-scientist': 'Data Scientist',
  'designer': 'Designer',
  'solutions-architect': 'Solutions Architect',
  'pr-manager': 'PR Manager',
  'hr-manager': 'HR Manager',
  'marketing': 'Marketing Manager',
}

export const SIGN_PERSONALITIES: Record<Sign, string> = {
  'aries': 'Merges to main without a PR, ships at 4pm Friday, and has probably already suggested rewriting it in Rust.',
  'taurus': 'Refuses to migrate off the 7-year-old stack; blocks the sprint with "just one more thing."',
  'gemini': 'Rewrites the ticket description three times, has 47 open tabs, and writes great docs they forgot to commit.',
  'cancer': 'Holds grudges against specific libraries; defends legacy code like it is family.',
  'leo': 'Turns every PR into a performance; adds unnecessary flair to output formatting; needs credit in the commit.',
  'virgo': 'Bikesheds the linting config, leaves review comments on whitespace, and writes the test suite for the test suite.',
  'libra': 'Cannot finalize the architecture decision; writes "LGTM but also consider..." on every PR.',
  'scorpio': 'Debugs until 2am, never forgets a production incident, and keeps a private list of whose code caused what.',
  'sagittarius': 'Estimates 2 points when it is 13, volunteers for the moonshot, and ships the prototype as production.',
  'capricorn': 'Cares deeply about the promotion rubric, measures everything, and turns tech debt into a Jira epic.',
  'aquarius': 'Proposes a custom framework, questions why we have standups, and is already using the experimental API.',
  'pisces': 'Gets lost in the problem space, refactors code that was already working, and forgets to push.',
}

export const ROLE_VOCABULARY: Record<Role, string> = {
  'software-engineer':
    'branch, commit, diff, merge conflict, lint, tests, CI pipeline, dependency, type error, compile error, runtime error, stack trace, LGTM, WIP, rebase, squash, PR, code review, tech debt, refactor, hotfix, monorepo, changelog',
  'devops':
    'kubectl, Terraform, Helm, deployment, rollback, on-call rotation, alert, PagerDuty, runbook, pipeline, namespace, cluster, pod, replicas, autoscaling, incident, postmortem, SLA, SLO, Grafana, dashboard, restart, drain, scale',
  'qa':
    'test case, regression suite, flaky test, coverage, assertion, edge case, repro steps, severity, blocker, critical, QA environment, smoke test, acceptance criteria, bug report, automation, test plan, sign-off, exploratory testing',
  'frontend':
    'component, prop, state, re-render, CSS specificity, z-index, viewport, bundle size, hydration, Lighthouse score, layout shift, responsive, breakpoint, animation, accessibility, event handler, DOM, async, race condition, browser cache',
  'product-manager':
    'story points, backlog, sprint goal, roadmap, stakeholder, OKR, KPI, acceptance criteria, MVP, scope creep, velocity, pivot, discovery, user interview, feature flag, launch, north star metric, alignment, PRD, prioritization',
  'project-manager':
    'milestone, deliverable, resource allocation, dependency, critical path, risk register, status report, scope change, timeline, kickoff, RAID log, escalation, stakeholder update, budget, capacity, blockers, project plan, gantt, handover, retrospective',
  'data-scientist':
    'model, training, dataset, feature, hyperparameter, overfitting, underfitting, p-value, experiment, A/B test, notebook, pipeline, accuracy, precision, recall, random seed, checkpoint, data drift, feature importance, baseline, evaluation',
  'designer':
    'wireframe, prototype, user journey, persona, Figma, component library, design system, usability test, accessibility, affordance, interaction pattern, handoff, annotation, user flow, heuristic, iteration, feedback, edge case, information architecture',
  'solutions-architect':
    'architecture diagram, trade-off, scalability, CAP theorem, event-driven, microservices, API contract, cloud region, SLA, HA, DR, cost optimization, vendor lock-in, ADR, throughput, latency, idempotency, eventual consistency',
  'pr-manager':
    'press release, media pitch, spokesperson, journalist, embargo, coverage, narrative, crisis comms, on the record, off the record, talking points, quote approval, media list, newsjacking, wire service, headline, story angle, reputation, messaging, news cycle',
  'hr-manager':
    'headcount, requisition, onboarding, offboarding, performance review, PIP, leveling, comp band, offer letter, retention, attrition, org chart, culture, engagement survey, policy, grievance, promotion cycle, benefits, hiring manager, candidate pipeline',
  'marketing':
    'campaign, conversion rate, CTR, funnel, CAC, LTV, attribution, A/B test, copy, landing page, SEO, organic, paid, impression, click-through, content calendar, brand voice, persona, retargeting, lead gen, pipeline, MQL, SQL, UTM, ROAS',
}

// Canonical prompt template — copied from docs/prompt-style-guide.md Section 6 v2.0.
// Do NOT read the markdown file at runtime.
const PROMPT_TEMPLATE = `You are writing a daily tech horoscope for 404tune — a site where software workers check their zodiac-based reading for the day.

Tone: Dry, deadpan, technically literate. Not a parody — played completely straight. Specific is funny; generic is not. No corporate-speak. No motivational coaching. No generic doom.

Sign: {sign}
Role: {role_label}
Date: {date}
Month context: {month_theme}

Sign personality: {sign_personality}
(Use the personality to color the situation — do not quote or paraphrase it directly in the reading.)

Role vocabulary (use this domain exclusively): {role_vocabulary}

Output a single JSON object with EXACTLY these four string fields and no others:

{
  "general_reading": "...",
  "lucky_value": "...",
  "avoid": "...",
  "planetary_influence": "..."
}

Field guidance:

- general_reading — 2 to 3 sentences total. Open with: [Planet] [aspect] your [role-relevant domain] today, [Sign]. Then situation → insight → guidance. Stay strictly in the role's vocabulary. Weave in the month context subtly. No padding. Do NOT include the lucky item line or the avoid line here.
  Valid aspect verbs: squares (tension), trines (flow), conjuncts (amplification), opposes (conflict), sextiles (opportunity requiring action).

- lucky_value — a concrete, role-specific token formatted as it would actually appear in that domain. The card displays this under a static "LUCKY NAMESPACE" header — do not include any label in the value. Pick a value type appropriate to {role_label}: Software Engineer → branch name; DevOps → kubectl namespace or cluster name; QA → test environment; Frontend → CSS property/value; Product Manager → story point estimate; Project Manager → milestone name or phase; Data Scientist → random seed or experiment ID; Designer → Figma frame name; Solutions Architect → cloud region or ADR id; PR Manager → story angle slug; HR Manager → headcount number; Marketing Manager → UTM source or campaign slug. Examples: "fix/not-my-bug", "staging-only", "qa-blue", "position: relative", "3", "phase-2", "42", "exploration-v3", "us-east-1", "exclusive-launch", "7", "utm_source=organic". One short token or phrase, MAX 24 characters. No prose.

- avoid — what to avoid today. One specific thing, optionally followed by a callback punchline. MAX 50 characters total. Examples: "Fridays. Especially this one." (29 chars), "Merging to main before the CI logs load." (40), "The estimation meeting. It already knows." (41).

- planetary_influence — astrological shorthand for the day's dominant aspect, in the form "<Planet> <symbol> <Body>". Use the planet from your general_reading opening. Symbols: ☌ conjunction, ☍ opposition, □ square, △ trine, ✶ sextile. Examples: "Saturn □ Mars", "Mercury ☍ Jupiter", "Venus △ Moon", "Mars ☌ Sun", "Sun ✶ Pluto". MAX 20 characters. Match the symbol to the aspect verb you used in general_reading.

Output the JSON object only. No markdown code fences. No prose before or after. No "Here is your reading:". The very first character of your response must be { and the very last must be }.`

export function buildPrompt(
  sign: string,
  role: string,
  date: string,
  monthTheme: string,
): string {
  return PROMPT_TEMPLATE.replace(/{sign}/g, sign)
    .replace(/{role_label}/g, ROLE_LABELS[role as Role])
    .replace('{date}', date)
    .replace('{month_theme}', monthTheme)
    .replace('{sign_personality}', SIGN_PERSONALITIES[sign as Sign])
    .replace('{role_vocabulary}', ROLE_VOCABULARY[role as Role])
}

// ---------------------------------------------------------------------------
// Shared script utilities
// ---------------------------------------------------------------------------

export function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

export const SEASONAL_THEMES: Record<number, string> = {
  1: 'OKR and roadmap season; Q1 planning; new performance cycles begin.',
  2: 'Deep Q1 execution; post-planning crunch.',
  3: 'Spring conference season; performance review completion; H1 push.',
  4: 'Q2 start; post-conference momentum; spring planning energy.',
  5: 'Google I/O season; summer internship onboarding begins; Q2 crunch.',
  6: 'Mid-year review; internship projects in full swing; summer slowdown begins.',
  7: 'Summer slowdown; vacation coverage; skeleton crew energy.',
  8: 'Back-to-school energy; Q3 planning; teams return from PTO.',
  9: 'Fall conference season; Q4 crunch begins; performance review prep.',
  10: 'Hacktoberfest; Q4 deep execution; feature freeze prep.',
  11: 'Feature freeze season; ship-it-before-the-holidays energy.',
  12: 'Holiday freeze; year-end retrospective; "we\'ll fix it in January."',
}

export function getMonthTheme(batchMonth: string): string {
  if (process.env.BATCH_MONTH_THEME) return process.env.BATCH_MONTH_THEME
  const month = parseInt(batchMonth.split('-')[1], 10)
  return SEASONAL_THEMES[month] ?? 'Mid-year execution phase.'
}

// ---------------------------------------------------------------------------
// Team reading helpers
// ---------------------------------------------------------------------------

export type TeamReadingRow = {
  date: string
  slot: number
  content: string
  batch_id: string
}

export function buildTeamCustomId(date: string, slot: number): string {
  return `team-${date}-${slot}`
  // e.g. 'team-2026-05-01-3'
}

// Format: 'team-YYYY-MM-DD-{slot}'
// 'team-' = 5 chars, date = positions 5–14 (10 chars), '-' at 15, slot = rest.
// Never split on '-' naively — date itself contains hyphens.
export function parseTeamCustomId(customId: string): { date: string; slot: number } {
  const date = customId.slice(5, 15)
  const slot = parseInt(customId.slice(16), 10)
  if (!date || isNaN(slot) || slot < 1 || slot > 12) {
    throw new Error(`parseTeamCustomId: malformed custom_id "${customId}"`)
  }
  return { date, slot }
}

const TEAM_PROMPT_TEMPLATE = `You are writing a daily team horoscope for 404tune — a site where software teams check their collective reading for the day.

Tone: Dry, deadpan, technically literate. Played completely straight. Role call-outs are observations, not jokes. Specific is funny; generic is not.

Team archetype: {team_archetype}
Date: {date}
Month context: {month_theme}

Write the reading in this exact markdown format (no deviations):

## {team_archetype}

{2–3 sentences of team forecast for the day. Ground it in the archetype's energy. Be specific.}

**QA will** {one sentence — a specific QA-flavored prediction}
**PM will** {one sentence — a specific PM-flavored prediction}
**Dev will** {one sentence — a specific Dev-flavored prediction}
**Designer will** {one sentence — a specific Designer-flavored prediction}

**Lucky move:** {one concrete action for the team today}
**Avoid:** {one specific thing the team should not do today}

Output the markdown block only. No preamble. No explanation. Start with ## and end with the Avoid line.`

export function buildTeamPrompt(date: string, slot: number, monthTheme: string): string {
  const archetype = TEAM_ARCHETYPES[slot]
  if (!archetype) throw new Error(`buildTeamPrompt: unknown slot ${slot}`)
  return TEAM_PROMPT_TEMPLATE
    .replace(/{team_archetype}/g, archetype)
    .replace(/{date}/g, date)
    .replace(/{month_theme}/g, monthTheme)
}
