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
// Prompt constants (source of truth: docs/prompt-style-guide.md v3.0)
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

// Canonical prompt template — copied from docs/prompt-style-guide.md Section 6 v3.0.
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

Output a single JSON object with EXACTLY these ten fields and no others:

{
  "general_reading": "...",
  "deploy_luck": 76,
  "deploy_luck_note": "the pipeline favors you.",
  "bug_risk_index": 82,
  "bug_risk_note": "something is already broken.",
  "sprint_energy": 35,
  "sprint_energy_note": "functional, not fearsome.",
  "avoid": "Touching z-index without a system.",
  "coffee_requirement": 5,
  "cursed_commit": "fix: undo yesterday"
}

Field guidance:

- general_reading — 2 to 3 sentences total. Open with: [Planet] [aspect] your [role-relevant domain] today, [Sign]. Then situation → insight → guidance. Stay strictly in the role's vocabulary. Weave in the month context subtly. No padding.
  Valid aspect verbs: squares (tension), trines (flow), conjuncts (amplification), opposes (conflict), sextiles (opportunity requiring action).

- deploy_luck — integer 0–100. AI judgment of how deployment-favorable the cosmic energy is today. 100 = ship with confidence; 0 = do not touch the deploy button. Scale with the reading's overall energy — instability → low (20–40); easy flow → high (65–90). Avoid round numbers. Examples: 76, 43, 91, 28, 55.

- deploy_luck_note — string, MAX 60 characters. One dry observation in the role's vocabulary explaining the score. No "// " prefix (UI adds it). Examples: "the pipeline favors you.", "something is already broken.", "merge window opens at 3pm."

- bug_risk_index — integer 0–100. Probability of introducing or encountering a bug today. Can diverge from deploy_luck (high bug risk but safe to deploy if tests catch everything). Examples: 82, 34, 67.

- bug_risk_note — string, MAX 60 characters. Same style as deploy_luck_note. Examples: "coverage lies.", "one test is lying.", "it was always like this."

- sprint_energy — integer 0–100. The sign/role's capacity for productive work today. Independent of bug risk. Examples: 35, 78, 52.

- sprint_energy_note — string, MAX 60 characters. Same style. Examples: "functional, not fearsome.", "running on fumes.", "surprisingly coherent."

- avoid — string, MAX 50 characters. What to avoid today. One specific thing, optionally followed by a callback punchline. Examples: "Fridays. Especially this one." (29), "Merging to main before the CI logs load." (40).

- coffee_requirement — integer 1–12. Cups of coffee to survive today. Scale with stress: 1–3 calm, 4–6 normal, 7–9 crunch, 10+ apocalyptic. Integer only.

- cursed_commit — string, MAX 50 characters. The commit message the team will write today, predicted astrologically. Message text only — no git commit -m wrapper (UI renders it). Should feel like a real commit from a real bad day. Examples: "fix: undo yesterday", "chore: sync with prod", "feat: remove the feature".

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

Output a single JSON object with EXACTLY these fields and no others:

{
  "heading": "{team_archetype}",
  "body": "4–6 sentences of team forecast grounded in the archetype's energy. Be specific. Where it feels natural, weave in an observation about a specific role (QA, PM, Dev, Designer) as part of the prose — no labels, no callouts, just part of the narrative.",
  "deploy_luck": 61,
  "deploy_luck_note": "the team will consider it.",
  "bug_risk_index": 74,
  "bug_risk_note": "one test is lying.",
  "sprint_energy": 45,
  "sprint_energy_note": "enough to attend standup.",
  "avoid": "Committing to the sprint goal before coffee.",
  "coffee_requirement": 6,
  "cursed_commit": "chore: sync with prod"
}

Field guidance:

- heading — the team archetype name exactly as provided. Do not modify it.

- body — 4–6 sentences of team forecast. Ground it in the archetype's energy. Be specific. Where it feels natural, weave in an observation about a specific role (QA, PM, Dev, Designer) as part of the prose — no labels, no callouts, just part of the narrative. Not every reading needs a role mention.

- deploy_luck — integer 0–100. Team-wide deployment energy today. 100 = ship it; 0 = do not touch prod.

- deploy_luck_note — string, MAX 60 characters. One dry observation explaining the score.

- bug_risk_index — integer 0–100. Team probability of introducing or finding bugs today.

- bug_risk_note — string, MAX 60 characters. Same style.

- sprint_energy — integer 0–100. Team's collective capacity for productive work today.

- sprint_energy_note — string, MAX 60 characters. Same style.

- avoid — string, MAX 50 characters. One thing the team should not do today.

- coffee_requirement — integer 1–12. Collective cups needed. Scale with stress.

- cursed_commit — string, MAX 50 characters. The commit message this team will write today. Message text only — no git commit -m wrapper.

Output the JSON object only. No markdown code fences. No prose before or after. The very first character of your response must be { and the very last must be }.`

export function buildTeamPrompt(date: string, slot: number, monthTheme: string): string {
  const archetype = TEAM_ARCHETYPES[slot]
  if (!archetype) throw new Error(`buildTeamPrompt: unknown slot ${slot}`)
  return TEAM_PROMPT_TEMPLATE
    .replace(/{team_archetype}/g, archetype)
    .replace(/{date}/g, date)
    .replace(/{month_theme}/g, monthTheme)
}
