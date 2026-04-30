# 404tune Prompt Style Guide

**Version:** 3.0  
**Last updated:** 2026-04-30  
**Governs:** All reading generation via the Anthropic Batch API  
**Used by:** `scripts/batch-utils.ts` (canonical prompt template; consumed by `lib/batch/submit.ts` and `lib/batch/retrieve.ts`)

---

## Overview

This document is the canonical quality specification for 404tune reading generation. Every reading produced by the batch pipeline must conform to it. A weak style guide produces 2,880 generic, forgettable readings. A strong one produces content that makes readers screenshot, share, and come back tomorrow.

The product's moat is not technology — it's the specificity of the sign × role intersection. A Scorpio DevOps Engineer and a Scorpio Product Manager must receive fundamentally different readings, both of which feel accurate to someone in that role. Update this document whenever prompt architecture changes.

---

## 1. Tone and Voice

### Core Tone

Dry wit, deadpan delivery, technically literate, never condescending. The voice reads like it was written by someone who has sat through too many standups and genuinely believes Mercury might be responsible for the broken CI pipeline.

### Rules

**Specific is funny; generic is not.**
- ❌ "Things will go well at work today."
- ✅ "Lucky PR size: under 200 lines."

**The astrological framing is played completely straight.** No winking at the camera, no "of course this is silly." The humor comes from applying real astrology conventions earnestly to absurd technical scenarios. The moment the reading acknowledges it's a joke, the joke dies.

**Each reading should feel slightly prophetic in retrospect.** The prediction should match something that plausibly happened in that role's week. "A cascading failure is actually a misconfigured alert threshold" is believable to a DevOps engineer in a way that "you will experience challenges" never is.

**Short punchy sentences beat long qualified ones.** End clauses are funnier than mid-sentence qualifications. "Avoid: Fridays. Especially this one." lands harder than "It would be wise to avoid Fridays, especially this particular one, if possible."

**Forbidden phrases and patterns:**
- "a period of transformation" — banned
- "the stars align" — banned
- "exciting opportunities" — banned
- "trust the process" — banned
- "take a step back" — banned
- Generic doom ("things will go wrong") or generic hope ("you've got this") — both banned
- Motivational coach energy — banned
- Condescension toward the role — banned

**Allowed:**
- "Your Jenkins pipeline will transform — and not in the good way." ✅
- Technical jargon used correctly in context ✅
- Gentle fatalism ✅
- Observations that feel uncomfortably accurate ✅

### Reference Reading (Canonical Example)

```json
{
  "general_reading": "Saturn squares your on-call rotation today, Scorpio. What looks like a cascading failure is actually a misconfigured alert threshold — trust your gut before you page the team.",
  "deploy_luck": 43,
  "deploy_luck_note": "do not touch the deploy button.",
  "bug_risk_index": 88,
  "bug_risk_note": "something is already broken.",
  "sprint_energy": 62,
  "sprint_energy_note": "enough to find it before standup.",
  "avoid": "Fridays. Especially this one.",
  "coffee_requirement": 7,
  "cursed_commit": "fix: it was always like this"
}
```

What makes it work: planetary body + role domain (on-call rotation) opens `general_reading`; specific prediction (misconfigured threshold, not "problems at work"); dry guidance (trust your gut); `deploy_luck` 43 correlates with the instability narrative; `bug_risk_index` 88 is high and specific; `sprint_energy` 62 diverges (capable of finding the bug, but not thriving); `coffee_requirement` 7 signals a crunch day; `cursed_commit` captures the resigned energy; callback kicker in `avoid`.

---

## 2. Astrological Structure Conventions

Every reading must include these components in order:

### 2.1 Planetary Opening

Format: `[Planet] [aspect] your [role-relevant domain] today, [Sign].`

**Planets:** Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto  
**Aspects and their meanings:**
- **Square** — tension, friction, obstacle
- **Trine** — flow, ease, unexpected luck
- **Conjunct** — amplification (can be positive or negative)
- **Oppose** — conflict, external pressure, competing forces
- **Sextile** — opportunity that requires action to realize

Examples by role:
- `Saturn squares your deployment pipeline today, Capricorn.`
- `Mercury opposes your sprint velocity today, Gemini.`
- `Venus trines your code review queue today, Libra.`
- `Mars opposes your ticket backlog today, Aries.`
- `Jupiter conjuncts your A/B test results today, Sagittarius.`

**Note on Mercury retrograde:** When the month theme includes a Mercury retrograde period, you may reference it in the reading body ("Mercury retrograde is pulling your dependency graph backward") but the planetary opening must still use a valid aspect verb (e.g., "Mercury squares your CI pipeline today, Virgo" — not "Mercury retrograde enters").

Use `today` in most readings for immediacy. Date-specific readings may vary the opening structure slightly.

### 2.2 Reading Body

**Length:** 2–3 sentences.  
**Structure:** situation → prediction/insight → guidance.

All three elements must be grounded in the role's actual work domain. The "insight" should feel simultaneously true-to-astrology (the planet explains it) and true-to-the-job (an engineer would nod at this).

Do not blend domains. A DevOps reading that mentions user stories has failed. A Product Manager reading about kubectl has failed.

### 2.3 Deploy Luck (`deploy_luck`, `deploy_luck_note` JSON fields)

**`deploy_luck`** — integer 0–100. The AI's judgment of how deployment-favorable the cosmic energy is for this sign/role today. 100 = ship with full confidence; 0 = do not touch the deploy button. Scale with the reading's overall tone — a reading about instability or conflict should produce a low score (20–40); a reading about flow or opportunity should produce a high score (65–90). Avoid round numbers. Examples: 76, 43, 91, 28, 55.

**`deploy_luck_note`** — string, MAX 60 characters. One dry observation in the role's vocabulary that explains or contextualizes the score. No `//` prefix (the UI renders that). Tone: terse postmortem language for low scores; quiet DevOps confidence for high ones.

Examples:
- `"the pipeline favors you."` (low bar, high score)
- `"do not touch the deploy button."` (low score)
- `"merge window opens at 3pm."` (specific, mid-range)
- `"coverage lies."` (high bug risk, medium deploy luck)

### 2.4 Bug Risk Index (`bug_risk_index`, `bug_risk_note` JSON fields)

**`bug_risk_index`** — integer 0–100. Probability of introducing or encountering a bug today. Can diverge from `deploy_luck` — high bug risk doesn't always mean unsafe to deploy if tests catch everything. A Virgo QA might have low sprint energy but still catch every bug (high bug risk index, low deploy luck, but they're on it). Examples: 82, 34, 67.

**`bug_risk_note`** — string, MAX 60 characters. Same style as `deploy_luck_note`. Should sound like a brief incident triage note.

Examples:
- `"something is already broken."` (high score)
- `"one test is lying."` (mid-range)
- `"coverage lies."` (high score)
- `"you introduced it last Friday."` (high score, callback)

### 2.5 Sprint Energy (`sprint_energy`, `sprint_energy_note` JSON fields)

**`sprint_energy`** — integer 0–100. The sign/role's capacity for productive work today. Independent of bug risk — a tired engineer can still catch bugs; a high-energy day can still be buggy. Examples: 35, 78, 52.

**`sprint_energy_note`** — string, MAX 60 characters. Same style. Deadpan energy assessment.

Examples:
- `"functional, not fearsome."` (mid-range)
- `"running on fumes."` (low)
- `"surprisingly coherent."` (mid-high)
- `"enough to attend standup."` (low)

### 2.6 Field Caps (all fields)

The reading is a single JSON object with ten fields. Length is enforced per-field, not in aggregate.

| Field | Type | Constraint |
|-------|------|-----------|
| `general_reading` | string | 2–3 sentences, opens with the planetary aspect |
| `deploy_luck` | integer | 0–100 |
| `deploy_luck_note` | string | ≤ 60 characters |
| `bug_risk_index` | integer | 0–100 |
| `bug_risk_note` | string | ≤ 60 characters |
| `sprint_energy` | integer | 0–100 |
| `sprint_energy_note` | string | ≤ 60 characters |
| `avoid` | string | ≤ 50 characters |
| `coffee_requirement` | integer | 1–12 |
| `cursed_commit` | string | ≤ 50 characters |

`general_reading` includes the planetary opening as its first sentence. Do NOT include `avoid` or any metric commentary inside `general_reading` — those are separate fields.

### 2.7 Avoid (`avoid` JSON field)

**Constraint:** ≤ 50 characters total. One specific thing to avoid today, optionally followed by a callback punchline. Often the best avoid line callbacks something in the body. Can be a single short clause.

The LLM emits the value only — no `Avoid:` prefix (the UI renders a static label).

Examples (within cap):
- `Fridays. Especially this one.` (29 chars)
- `Merging to main before the CI logs load.` (40)
- `The estimation meeting. It already knows.` (41)
- `Production deployments after 4pm.` (33)
- `Touching z-index without a system.` (35)

### 2.8 Coffee Requirement & Cursed Commit (`coffee_requirement`, `cursed_commit` JSON fields)

**`coffee_requirement`** — integer 1–12. Cups of coffee needed to survive today. Should scale with cosmic stress:
- 1–3 = calm alignment day
- 4–6 = normal sprint day
- 7–9 = crunch / high bug risk day
- 10–12 = apocalyptic (reserved for maximum bug_risk_index + minimum sprint_energy readings)

**`cursed_commit`** — string, MAX 50 characters. The commit message the team will write today, predicted astrologically. Written as the message text only — no `git commit -m "..."` wrapper (the UI renders `$ git commit -m "..."` and quotes the value). Should feel like a real commit message from a real bad day — resigned, specific, plausible.

Examples:
- `fix: undo yesterday` (low deploy luck, high bug risk)
- `chore: sync with prod` (neutral, resigned)
- `feat: remove the feature` (reversal energy)
- `fix: it was always like this` (high bug risk, Scorpio energy)
- `hotfix: lgtm` (low quality day, Sagittarius energy)

---

## 3. Sign-Specific Personality Traits

These personality traits color the reading — they influence the type of prediction, the emotional register, and the specific mistake or tendency the sign is prone to. Do not state these traits explicitly; express them through the situation described.

| Sign | Core Trait | Tech Worker Expression | Typical Reading Energy |
|------|-----------|----------------------|----------------------|
| Aries | Impulsive, pioneering | Merges to main without a PR; ships at 4pm Friday; suggests rewriting in Rust | urgency, confidence, slight recklessness |
| Taurus | Stubborn, comfort-seeking | Refuses to migrate off the 7-year-old stack; blocks the sprint with "just one more thing" | resistance, territorial, slow-moving forces |
| Gemini | Dual-natured, communicative | Rewrites the ticket description three times; has 47 open tabs; writes great docs, forgets to commit them | scattered focus, communication tangles, multiple tracks |
| Cancer | Protective, intuitive | Holds grudges against specific libraries; defends legacy code like it's family | emotional stakes in technical decisions, gut feelings |
| Leo | Commanding, creative | Turns every PR into a performance; adds unnecessary flair to output formatting; needs credit in the commit | visibility, presentation, something impressive being built |
| Virgo | Perfectionist, detail-oriented | Bikesheds the linting config; leaves review comments on whitespace; writes the test suite for the test suite | precision, quality gates, the small thing blocking the big thing |
| Libra | Indecisive, harmony-seeking | Cannot finalize the architecture decision; writes "LGTM but also consider..." on every PR | unresolved trade-offs, deferred decisions, pleasing everyone |
| Scorpio | Intense, investigative | Debugs until 2am; never forgets a production incident; keeps a private list of whose code caused what | investigation, hidden root causes, things beneath the surface |
| Sagittarius | Overconfident, expansive | Estimates 2 points, it's 13; volunteers for the moonshot; ships the prototype as production | ambition outpacing capacity, scope creep, bold moves |
| Capricorn | Pragmatic, status-conscious | Cares deeply about the promotion rubric; measures everything; turns tech debt into a Jira epic | metrics, accountability, systematic progress |
| Aquarius | Iconoclastic, systems-thinking | Proposes a custom framework; questions why we have standups; already using the experimental API | unorthodox solutions, systems-level insight, skepticism of process |
| Pisces | Dreamy, absorptive | Gets lost in the problem space; refactors code that was already working; forgets to push | drift, absorption, losing track of the original goal |

**Usage:** When populating `{sign_personality}` in the prompt, provide 1–2 sentences from this table's "Tech Worker Expression" column, not the abstract traits.

---

## 4. Role-Specific Vocabulary Banks

The reading body must draw exclusively from the vocabulary of the role it addresses. Cross-role vocabulary contamination is the most common quality failure. Test each reading: could this line appear in a different role's reading without modification? If yes, it's too generic.

### software-engineer

**Domain:** Pull requests, code review, local dev environment, bugs, refactoring, tech debt, architecture decisions, CI/CD

**Vocabulary:** branch, commit, diff, merge conflict, lint, tests, CI pipeline, dependency, type error, compile error, runtime error, stack trace, LGTM, WIP, rebase, squash, PR, code review, tech debt, refactor, hotfix, monorepo, changelog

**Reading cues:** debugging sessions, review feedback, failing CI, that one flaky test, the branch that's been open too long

---

### devops

**Domain:** Infrastructure, deployments, incidents, alerting, pipelines, uptime, on-call

**Vocabulary:** kubectl, Terraform, Helm, deployment, rollback, on-call rotation, alert, PagerDuty, runbook, pipeline, namespace, cluster, pod, replicas, autoscaling, incident, postmortem, SLA, SLO, Grafana, dashboard, restart, drain, scale

**Reading cues:** 3am pages, cascading failures, the infra change that seemed safe, that one service that always needs a nudge

---

### qa

**Domain:** Test suites, bug discovery, regression, environments, test coverage, release sign-off

**Vocabulary:** test case, regression suite, flaky test, coverage, assertion, edge case, repro steps, severity, blocker, critical, QA environment, smoke test, acceptance criteria, bug report, automation, test plan, sign-off, exploratory testing

**Reading cues:** that test that only fails in CI, the regression that came back, the release being held, the bug that wasn't supposed to exist

---

### frontend

**Domain:** UI components, CSS, JavaScript runtime, user interactions, browser compatibility, performance

**Vocabulary:** component, prop, state, re-render, CSS specificity, z-index, viewport, bundle size, hydration, Lighthouse score, layout shift, responsive, breakpoint, animation, accessibility, event handler, DOM, async, race condition, browser cache

**Reading cues:** the pixel that's off, the layout that breaks at one specific width, the animation that's smooth on the machine but janky in prod

---

### product-manager

**Domain:** Stakeholders, roadmap, priorities, requirements, sprint ceremonies, metrics

**Vocabulary:** story points, backlog, sprint goal, roadmap, stakeholder, OKR, KPI, acceptance criteria, MVP, scope creep, velocity, pivot, discovery, user interview, feature flag, launch, north star metric, alignment, PRD, prioritization

**Reading cues:** the stakeholder who adds one more thing, the sprint goal that drifted, the discovery call that changed everything, the launch that moved

---

### data-scientist

**Domain:** Model training, experiments, data pipelines, metrics, notebooks, validation

**Vocabulary:** model, training, dataset, feature, hyperparameter, overfitting, underfitting, p-value, experiment, A/B test, notebook, pipeline, accuracy, precision, recall, random seed, checkpoint, data drift, feature importance, baseline, evaluation

**Reading cues:** the model that scored perfectly on eval but failed in prod, the dataset that was bigger than expected, the experiment whose results shouldn't exist

---

### designer

**Domain:** User research, wireframes, prototypes, design systems, handoff, usability

**Vocabulary:** wireframe, prototype, user journey, persona, Figma, component library, design system, usability test, accessibility, affordance, interaction pattern, handoff, annotation, user flow, heuristic, iteration, feedback, edge case, information architecture

**Reading cues:** the feedback that redesigns the component, the dev handoff that went sideways, the user test where everyone did the wrong thing, the Figma file that grew past containment

---

### solutions-architect

**Domain:** System design, trade-off analysis, cloud architecture, integrations, scalability, documentation

**Vocabulary:** architecture diagram, trade-off, scalability, CAP theorem, event-driven, microservices, API contract, cloud region, SLA, HA (high availability), DR (disaster recovery), cost optimization, vendor lock-in, ADR (Architecture Decision Record), throughput, latency, idempotency, eventual consistency

**Reading cues:** the ADR that nobody read, the trade-off that seemed fine six months ago, the service that was supposed to be temporary, the whiteboard diagram that became production reality

---

### project-manager

**Domain:** Project planning, delivery, resource allocation, risk, stakeholder communication, timelines

**Vocabulary:** milestone, deliverable, resource allocation, dependency, critical path, risk register, status report, scope change, timeline, kickoff, RAID log, escalation, stakeholder update, budget, capacity, blockers, project plan, gantt, handover, retrospective

**Reading cues:** the dependency that nobody flagged, the scope change that arrived as a casual Slack message, the milestone that looked fine last week, the status report that nobody reads until something is on fire

---

### pr-manager

**Domain:** Media relations, press releases, messaging, crisis comms, brand narrative, news cycles

**Vocabulary:** press release, media pitch, spokesperson, journalist, embargo, coverage, narrative, crisis comms, on the record, off the record, talking points, quote approval, media list, newsjacking, wire service, headline, story angle, reputation, messaging, news cycle

**Reading cues:** the journalist who got hold of the story early, the embargo that didn't hold, the quote that landed wrong, the statement that needs to not exist yet

---

### hr-manager

**Domain:** Hiring, onboarding, performance management, compensation, org design, culture, compliance

**Vocabulary:** headcount, requisition, onboarding, offboarding, performance review, PIP, leveling, comp band, offer letter, retention, attrition, org chart, culture, engagement survey, policy, grievance, promotion cycle, benefits, hiring manager, candidate pipeline

**Reading cues:** the headcount that got frozen, the performance review that should have happened two quarters ago, the offer that exploded before signing, the attrition number that arrived on a Monday

---

### marketing

**Domain:** Campaigns, growth, content, brand, demand generation, metrics, distribution

**Vocabulary:** campaign, conversion rate, CTR, funnel, CAC, LTV, attribution, A/B test, copy, landing page, SEO, organic, paid, impression, click-through, content calendar, brand voice, persona, retargeting, lead gen, pipeline, MQL, SQL, UTM, ROAS

**Reading cues:** the campaign that launched into a news cycle it didn't expect, the A/B test where both variants lost, the attribution model that made everything look fine until it didn't, the organic spike nobody can explain

---

## 5. Monthly Theme Rotation

Theme rotation ensures readings don't feel repetitive as the product matures. Each batch run uses a `{month_theme}` context string injected into the prompt. The admin populates this before running each batch.

### Theme System

Three theme layers combine to create monthly context:

#### Layer 1: Mercury Retrograde Periods

Mercury retrograde occurs approximately 3× per year, ~3 weeks each. During these periods, the batch's month_theme should include retrograde framing.

**Retrograde reading tone:** emphasis on communication failures, revisiting past decisions, unexpected regressions, legacy code surfacing, contracts/agreements going sideways.

**Retrograde framing phrases for `{month_theme}`:**
- "Mercury retrograde is active — legacy decisions resurface"
- "Mercury retrograde affects communications and contracts — things signed last quarter are being re-examined"
- "Post-retrograde shadow — the fallout from last month's miscommunications is still clearing"

**Approximate Mercury retrograde periods (verify each year):**
- January–February
- May–June
- September–October

#### Layer 2: Seasonal Tech Events

| Month | Tech Season Context |
|-------|---------------------|
| January | OKR and roadmap season; Q1 planning; new performance cycles begin |
| February | Deep Q1 execution; post-planning crunch; winter conference prep |
| March | Spring conference season (GDC, SXSW); perf review completion; H1 push |
| April | Q2 start; post-conference momentum; spring planning energy |
| May | Google I/O season; summer internship onboarding begins; Q2 crunch |
| June | Mid-year review; internship projects in full swing; summer slowdown begins |
| July | Summer slowdown; vacation coverage; skeleton crew energy |
| August | Back-to-school energy; Q3 planning; teams return from PTO |
| September | Fall conference season (Strange Loop, etc.); Q4 crunch begins; performance review prep |
| October | Hacktoberfest; Q4 deep execution; feature freeze prep |
| November | Feature freeze season; "ship it before the holidays" energy; thanksgiving slowdown (US) |
| December | Holiday freeze; year-end retrospective; "we'll fix it in January" |

#### Layer 3: Rotating Scenario Banks

Three banks rotate monthly (A → B → C → A → ...). The bank determines the situational framing across the batch:

**Bank A — Infrastructure & Reliability:**
Incidents, on-call burden, scaling events, deployment anxiety, uptime pressure, postmortems. Cross-role interpretation: the systems that support the work are under strain.

**Bank B — Team Dynamics & Process:**
Sprint ceremonies gone sideways, review feedback culture, standup theater, alignment failures, communication overhead, scope negotiation. Cross-role interpretation: the human systems around the technical work are the bottleneck.

**Bank C — Technical Ambition:**
New projects, greenfield decisions, architectural migrations, refactor initiatives, prototype-to-production transitions. Cross-role interpretation: there is a bigger thing being built in the background.

**Bank rotation starting point:** May 2026 = Bank A. Sequence: May=A, Jun=B, Jul=C, Aug=A, Sep=B, Oct=C, Nov=A, Dec=B, Jan=C...

### Constructing `{month_theme}`

Before each batch run, the admin constructs a 2–4 sentence month_theme string combining all three layers. Example for May 2026:

> It's early May — Google I/O season, summer internship onboarding just began, and the Q2 crunch is entering its real phase. Mercury retrograde is active through May 15, affecting communications and software contracts in particular. The primary scenario bank this month is Infrastructure & Reliability — systems are under load and deployment anxiety is elevated.

This string is injected verbatim into every prompt in the batch.

---

## 6. Prompt Template

This is the canonical prompt template. `scripts/batch-utils.ts` copies this exactly — do not modify the template without updating the script.

```
You are writing a daily tech horoscope for 404tune — a site where software workers check their zodiac-based reading for the day.

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

Output the JSON object only. No markdown code fences. No prose before or after. No "Here is your reading:". The very first character of your response must be { and the very last must be }.
```

### Variable Population Reference

| Variable | Source | Example |
|----------|--------|---------|
| `{sign}` | `lib/constants.ts` SIGNS | `scorpio` |
| `{role_label}` | ROLE_LABELS map (see below) | `DevOps Engineer` |
| `{date}` | ISO date string for this reading | `2026-05-01` |
| `{month_theme}` | Admin-constructed string before batch run | See Section 5 |
| `{sign_personality}` | 1–2 sentences from Section 3 table | `Debugs until 2am; never forgets a production incident; keeps a private list of whose code caused what.` |
| `{role_vocabulary}` | Comma-separated vocabulary from Section 4 | `kubectl, Terraform, Helm, deployment, rollback, on-call rotation, ...` |

### Role Label Mapping

```ts
const ROLE_LABELS: Record<Role, string> = {
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
```

### Sign Personality Reference (for prompt population)

```ts
const SIGN_PERSONALITIES: Record<Sign, string> = {
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
```

---

## 7. Validation Checklist

Use this checklist when reviewing sample readings before the first production batch.

### Per-Reading Checks

For each generated reading, verify all of the following:

**Schema:**
- [ ] **Output is valid JSON** — parses without error; first char is `{`, last char is `}`; no markdown code fences
- [ ] **Exactly ten fields** — `general_reading`, `deploy_luck`, `deploy_luck_note`, `bug_risk_index`, `bug_risk_note`, `sprint_energy`, `sprint_energy_note`, `avoid`, `coffee_requirement`, `cursed_commit`; no extras, no missing
- [ ] **No legacy fields** — `lucky_value` and `planetary_influence` must NOT be present

**Caps:**
- [ ] **`deploy_luck_note` ≤ 60 chars**
- [ ] **`bug_risk_note` ≤ 60 chars**
- [ ] **`sprint_energy_note` ≤ 60 chars**
- [ ] **`avoid` ≤ 50 chars**
- [ ] **`cursed_commit` ≤ 50 chars**
- [ ] **Integer fields in range** — `deploy_luck`, `bug_risk_index`, `sprint_energy` each 0–100; `coffee_requirement` 1–12

**Content:**
- [ ] **Planetary opening present** — `general_reading` starts with `[Planet] [aspect verb] your [role domain] today, [Sign]`
- [ ] **`general_reading` is 2–3 sentences** — no padding, no truncation; metric/avoid lines are NOT inside it
- [ ] **Role vocabulary only** — no cross-role contamination (DevOps has no wireframes; PM has no kubectl)
- [ ] **Metric scores correlate with reading tone** — low `deploy_luck` when reading warns of instability; high `coffee_requirement` on crunch days; `cursed_commit` captures the day's energy
- [ ] **`avoid` specific** — callbacks the body or lands as standalone punchline; no `Avoid:` prefix in the value
- [ ] **`cursed_commit` is realistic** — reads like a real commit message; no `git commit -m` wrapper included
- [ ] **Tone is dry/deadpan** — not jokey, not winking, not motivational
- [ ] **Sign personality subtly expressed** — not stated explicitly, but present in the situation
- [ ] **Could not apply to a different sign × role** — feels specific, not interchangeable
- [ ] **No forbidden phrases** — none of the banned generic phrases appear

### Cross-Batch Checks

After generating all 10+ samples:

- [ ] **Tone is consistent across all readings** — no single reading feels dramatically different in voice
- [ ] **Sign personalities are distinct** — Aries and Capricorn readings should feel different even in the same role
- [ ] **Role domains are distinct** — two different roles for the same sign should feel completely different
- [ ] **Lucky items span the vocabulary** — not all readings using the same lucky noun type

### Correction Protocol

If a reading fails a check:
1. Identify which element failed (opening, body, lucky item, tone, sign expression)
2. Adjust the relevant section of this style guide (vocabulary bank, sign personality description, or tone rules) to prevent recurrence
3. Note the correction in the style guide's revision history below

---

## 8. Revision History

| Version | Date | Change |
|---------|------|--------|
| 3.0 | 2026-04-30 | Reading page grand redesign (Epic 10): removed `lucky_value` and `planetary_influence`; added ten-field schema with `deploy_luck`, `deploy_luck_note`, `bug_risk_index`, `bug_risk_note`, `sprint_energy`, `sprint_energy_note`, `avoid`, `coffee_requirement`, `cursed_commit`; rewrote §2.3–2.8; updated §6 template and §7 checklist; updated canonical reference reading; updated Appendix A samples. |
| 2.4 | 2026-04-29 | Added 4 new roles (solutions-architect, project-manager, pr-manager, hr-manager, marketing) with vocabulary banks and reading cues in Section 4. |
| 2.3 | 2026-04-26 | Spec hygiene: rewrote §2.3–2.5 for JSON shape, added §2.6 (`planetary_influence`); refreshed Validation Checklist with schema/cap/content groups; split appendix into v2.x JSON samples (A) and v1.0 legacy prose samples (B); updated canonical reference example to JSON; fixed `Used by:` header reference. |
| 2.2 | 2026-04-26 | Tightened `avoid` cap from 70 → 50 chars after layout testing showed two-line wraps in the stat column. |
| 2.1 | 2026-04-26 | Dropped `lucky_label` from JSON spec — card renders a static "LUCKY NAMESPACE" header. Role-noun selection folded into `lucky_value` guidance. Added length caps: lucky_value ≤24, avoid ≤70, planetary_influence ≤20. |
| 2.0 | 2026-04-26 | Switched output format from prose to structured JSON: general_reading, lucky_label, lucky_value, avoid, planetary_influence. Reader card renders the latter three as stat columns under the body. Legacy prose rows still parse via fallback. |
| 1.1 | 2026-04-22 | Code review patches: fixed invalid "enters" aspect example; removed PM vocabulary ("story points") from Taurus×DevOps sample; clarified Avoid line allows 2 sentences; corrected April Q2 label; added sign_personality verbatim-repeat guard to prompt; added Avoid line checklist item |
| 1.0 | 2026-04-22 | Initial version — validated against 10 sample readings |

---

## Appendix A: Sample Readings (v3.x JSON Format)

These illustrate the current ten-field JSON output. Validate against the Section 7 checklist.

### A1. Leo × Software Engineer (high energy day)

```json
{
  "general_reading": "Saturn squares your code review queue today, Leo. The unsolicited refactor you bundled into Friday's PR will draw exactly the audience you wanted — and ten more LGTM-but-also-consider notes. Defend it with a changelog, not a Slack thread.",
  "deploy_luck": 71,
  "deploy_luck_note": "the CI is already judging you.",
  "bug_risk_index": 64,
  "bug_risk_note": "the refactor introduced exactly one thing.",
  "sprint_energy": 89,
  "sprint_energy_note": "dangerously productive.",
  "avoid": "Refactors on Friday. The CI is already mad at you.",
  "coffee_requirement": 4,
  "cursed_commit": "feat/standing-ovation-pr: final cleanup"
}
```

Leo's performative flair expressed through unsolicited refactor and audience-seeking. High sprint energy (Leo energy) with moderate bug risk (the refactor). `avoid` callbacks the reading body.

### A2. Scorpio × DevOps Engineer (incident day)

```json
{
  "general_reading": "Saturn squares your on-call rotation today, Scorpio. What looks like a cascading failure is actually a misconfigured alert threshold — trust your gut before you page the team.",
  "deploy_luck": 43,
  "deploy_luck_note": "do not touch the deploy button.",
  "bug_risk_index": 88,
  "bug_risk_note": "something is already broken.",
  "sprint_energy": 62,
  "sprint_energy_note": "enough to find it before standup.",
  "avoid": "Fridays. Especially this one.",
  "coffee_requirement": 7,
  "cursed_commit": "fix: it was always like this"
}
```

Canonical reference reading. Scorpio investigative intensity expressed (trust your gut). Low deploy luck, high bug risk, medium sprint energy (capable but not thriving). High coffee requirement signals a crunch day.

### A3. Aquarius × Designer (confident energy day)

```json
{
  "general_reading": "Uranus trines your information architecture today, Aquarius. The user flow you proposed in the last design review was correct — the team just hasn't caught up to it yet, and the usability test you're running this week will prove it.",
  "deploy_luck": 79,
  "deploy_luck_note": "ship the prototype. it already works.",
  "bug_risk_index": 31,
  "bug_risk_note": "clean day. the wireframes are correct.",
  "sprint_energy": 84,
  "sprint_energy_note": "dangerously visionary.",
  "avoid": "Explaining it again in the sync.",
  "coffee_requirement": 3,
  "cursed_commit": "chore: update designs per feedback"
}
```

Aquarius iconoclasm expressed as "team hasn't caught up yet" without stating the trait. High sprint energy + low bug risk = a confident creation day. `coffee_requirement` 3 reflects the easy flow. `cursed_commit` is resigned — the feedback is wrong but the designer will implement it anyway.

---

## Appendix B: Legacy Sample Readings (v1.0 Prose Format)

The following readings were generated using this style guide at v1.0 and reviewed against the v1.0 checklist. **Format is no longer current** — they are retained as voice/tone calibration only. The four-field JSON format in Appendix A supersedes the prose form.

### 1. Scorpio × DevOps Engineer
> Saturn squares your on-call rotation today, Scorpio. What looks like a cascading failure is actually a misconfigured alert threshold — trust your gut before you page the team. Lucky kubectl namespace: `staging-only`. Avoid: Fridays. Especially this one.

*Checklist:* ✅ planetary opening, ✅ DevOps vocabulary only, ✅ lucky item specific, ✅ dry tone, ✅ Scorpio's investigative intensity (trust your gut, don't panic-page), ✅ would not fit another sign × role

### 2. Aries × Software Engineer
> Mars conjuncts your merge queue today, Aries. The pull request that's been sitting in review for three days is not the problem — the one you opened this morning at 4pm is. Lucky branch name: `hotfix/not-my-fault`. Avoid: merging to main before you read the CI logs.

*Checklist:* ✅ planetary opening, ✅ SE vocabulary only, ✅ lucky branch name specific, ✅ dry tone, ✅ Aries impulsiveness expressed (new PR opened recklessly), ✅ sign × role specific

### 3. Virgo × QA Engineer
> Mercury trines your regression suite today, Virgo. The flaky test that's been failing intermittently in CI for six weeks is finally reproducible — it was your environment all along, not the code, and you already knew that. Lucky test environment: `qa-blue`. Avoid: filing the bug before you can repro it twice.

*Checklist:* ✅ planetary opening, ✅ QA vocabulary only, ✅ lucky test environment specific, ✅ dry tone, ✅ Virgo's meticulous nature expressed (already knew it, needed proof), ✅ sign × role specific

### 4. Gemini × Product Manager
> Mercury opposes your sprint goal today, Gemini. The ticket you rewrote three times yesterday has been accepted into scope, but the original version — the one from Monday — was actually correct. Lucky story point estimate: `3`. Avoid: the Slack thread you started about renaming the epic.

*Checklist:* ✅ planetary opening, ✅ PM vocabulary only, ✅ lucky estimate specific, ✅ dry tone, ✅ Gemini's ticket-rewriting tendency expressed directly, ✅ sign × role specific

### 5. Capricorn × Solutions Architect
> Saturn trines your ADR backlog today, Capricorn. The architecture decision you deferred in Q3 is about to surface in a production incident — not because it was wrong, but because nobody read the document. Lucky cloud region: `us-east-1`. Avoid: the word "eventually" in your SLA language.

*Checklist:* ✅ planetary opening, ✅ SA vocabulary only (ADR, SLA, production incident), ✅ lucky cloud region specific, ✅ dry tone, ✅ Capricorn's measurement/documentation energy (the document exists, was ignored), ✅ sign × role specific

### 6. Pisces × Data Scientist
> Neptune squares your model checkpoint today, Pisces. The experiment you've been running for two weeks has converged — but you've been so absorbed in exploring the feature space that you forgot to set the random seed, and the results aren't reproducible. Lucky random seed: `42`. Avoid: opening a new notebook before you commit this one.

*Checklist:* ✅ planetary opening, ✅ DS vocabulary only (checkpoint, feature space, random seed, notebook), ✅ lucky seed specific, ✅ dry tone, ✅ Pisces' absorptive drift expressed (lost in problem space, forgot basics), ✅ sign × role specific

### 7. Leo × Frontend Engineer
> Venus conjuncts your component library today, Leo. The animation you added to the button hover state is genuinely beautiful and completely outside the design spec — it will be flagged in review, and you will defend it anyway. Lucky CSS property: `animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1)`. Avoid: the Lighthouse run. It will ruin the moment.

*Checklist:* ✅ planetary opening, ✅ FE vocabulary only (component library, animation, design spec, Lighthouse), ✅ lucky CSS property beautifully specific, ✅ dry tone, ✅ Leo's performative flair expressed (unsolicited beauty, will defend it), ✅ sign × role specific

### 8. Aquarius × Designer
> Uranus trines your information architecture today, Aquarius. The user flow you proposed in the last design review was correct — the team just hasn't caught up to it yet, and the usability test you're running this week will prove it. Lucky Figma frame: `exploration-v7`. Avoid: explaining it again in the sync. Let the test speak.

*Checklist:* ✅ planetary opening, ✅ Designer vocabulary only (user flow, design review, usability test, Figma frame), ✅ lucky frame specific, ✅ dry tone, ✅ Aquarius' iconoclastic "team hasn't caught up" energy, ✅ sign × role specific

### 9. Libra × Solutions Architect
> Venus squares your architecture diagram today, Libra. You've been in the trade-off analysis for this service mesh decision for eleven days, and both options are still equally valid — they were equally valid on day one. Lucky acronym: `YAGNI`. Avoid: scheduling another review to decide if you should schedule a review.

*Checklist:* ✅ planetary opening, ✅ SA vocabulary only (architecture diagram, trade-off, service mesh), ✅ lucky acronym perfectly chosen (YAGNI = You Aren't Gonna Need It — a direct jab at over-analysis), ✅ dry tone, ✅ Libra's indecision expressed precisely, ✅ sign × role specific

### 10. Taurus × DevOps Engineer
> Saturn conjuncts your infrastructure today, Taurus. The Kubernetes migration that's been on the roadmap for fourteen months is being prioritized again, and once again you will explain, patiently, that the current setup has a 99.97% uptime and the blast radius of changing it is not worth the rollback risk. Lucky Terraform workspace: `production-legacy`. Avoid: the architecture meeting. They already know your position.

*Checklist:* ✅ planetary opening, ✅ DevOps vocabulary only (Kubernetes, Terraform workspace, uptime, rollback risk), ✅ lucky workspace both specific and comedically perfect ("production-legacy"), ✅ dry tone, ✅ Taurus' stubbornness and comfort-seeking expressed as principled resistance, ✅ sign × role specific


---

## Section 6: Team Reading Prompt

### 6.1 Overview

Team readings are generated alongside individual readings in the same monthly Anthropic batch. There are 12 team readings per day — one per **slot** — each anchored to a fixed team archetype. The archetype is the primary variation signal that makes each slot meaningfully distinct.

Team readings do **not** target a specific zodiac sign or individual role. Instead, they address the team as a collective, with role-specific nods ("QA will...", "PM will...") that land as dry observations, not targeted predictions.

### 6.2 Archetype Table

| Slot | Archetype | Energy |
|------|-----------|--------|
| 1 | The Crunch Team | Deadline pressure, shipping fever |
| 2 | The Alignment-Seekers | Endless meetings, slide decks |
| 3 | The Fire-Fighters | Production incidents, on-call anxiety |
| 4 | The Dreamers | Roadmap vision, moonshot energy |
| 5 | The Nitpickers | Code review wars, standards debates |
| 6 | The Overloaded | Too many priorities, context-switching chaos |
| 7 | The Collaborators | Cross-team dependencies, Slack ping storms |
| 8 | The Slow Burners | Tech debt reckoning, refactor season |
| 9 | The Grinders | Sprint velocity obsession, story point drama |
| 10 | The Pivoteers | Strategy shift, everything changes again |
| 11 | The New Joiners | Onboarding chaos, "just ask anyone" |
| 12 | The Survivors | Post-launch calm, retro season |

### 6.3 Prompt Template

```
You are writing a daily team horoscope for 404tune — a site where software teams check their collective reading for the day.

Tone: Dry, deadpan, technically literate. Played completely straight. Role call-outs are observations, not jokes. Specific is funny; generic is not.

Team archetype: {team_archetype}
Date: {date}
Month context: {month_theme}

Output a single JSON object with EXACTLY these fields and no others:

{
  "heading": "{team_archetype}",
  "body": "2–3 sentence team forecast grounded in the archetype's energy. Be specific.",
  "role_predictions": {
    "qa": "one sentence — a specific QA-flavored prediction",
    "pm": "one sentence — a specific PM-flavored prediction",
    "dev": "one sentence — a specific Dev-flavored prediction",
    "designer": "one sentence — a specific Designer-flavored prediction"
  },
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
- body — 2–3 sentences of team forecast grounded in the archetype's energy. Be specific.
- role_predictions — object with four keys: qa, pm, dev, designer. Each is one sentence in that role's vocabulary. These are observations, not encouragement.
- deploy_luck — integer 0–100. Team-wide deployment energy today.
- deploy_luck_note — string, MAX 60 characters. One dry observation explaining the score.
- bug_risk_index — integer 0–100. Team probability of introducing or finding bugs today.
- bug_risk_note — string, MAX 60 characters. Same style.
- sprint_energy — integer 0–100. Team's collective capacity for productive work today.
- sprint_energy_note — string, MAX 60 characters. Same style.
- avoid — string, MAX 50 characters. One thing the team should not do today.
- coffee_requirement — integer 1–12. Collective cups needed. Scale with stress.
- cursed_commit — string, MAX 50 characters. The commit message this team will write today. Message text only — no git commit -m wrapper.

Output the JSON object only. No markdown code fences. No prose before or after. The very first character of your response must be { and the very last must be }.
```

### 6.4 Content Guidance

- **Archetype energy is the frame** — every sentence should feel grounded in the archetype's situation. The Crunch Team is sweating a deadline; The Alignment-Seekers are stuck in a meeting about the meeting.
- **`role_predictions` are observations, not horoscope predictions** — "QA will surface a critical bug just before the meeting" reads as a knowing observation, not a cosmic forecast. Keep them deadpan. Each prediction is one sentence in that role's vocabulary.
- **Specific beats generic** — "PM will reprioritize three stories from Done to In Progress" is funny. "PM will face challenges" is not.
- **`avoid` is a shared team trap** — "The status update Slack thread. It has already started." or "The emergency standup. The fire is already out." MAX 50 characters.
- **Metric scores should reflect the archetype energy** — The Fire-Fighters should have high `bug_risk_index` and low `deploy_luck`; The Dreamers should have high `sprint_energy` and low `bug_risk_index`.
- **`cursed_commit` captures team character** — The Nitpickers write `style: enforce trailing comma`; The Survivors write `chore: we made it`; The Crunch Team writes `fix: it works now please`.
- **max_tokens: 600** — the JSON format is longer than individual readings. Do not reduce.

### 6.5 Sample Output

```json
{
  "heading": "The Fire-Fighters",
  "body": "Saturn squares your on-call rotation today. The incident from last Tuesday was resolved, postmortem written, action items assigned — and yet the alert that triggered it is firing again. The runbook was updated for the scenario that happened, not the one that is happening now.",
  "role_predictions": {
    "qa": "QA will find a second reproduction path that makes the blast radius larger than first reported.",
    "pm": "PM will ask if this affects the release date while the incident channel is still active.",
    "dev": "Dev will fix the symptom first and the root cause after the retrospective.",
    "designer": "Designer will not be involved but will be asked to update the status page banner."
  },
  "deploy_luck": 22,
  "deploy_luck_note": "do not touch the deploy button.",
  "bug_risk_index": 91,
  "bug_risk_note": "the alert is firing again.",
  "sprint_energy": 58,
  "sprint_energy_note": "running on adrenaline, not caffeine.",
  "avoid": "The quick call to align on scope. It isn't.",
  "coffee_requirement": 9,
  "cursed_commit": "fix: revert the fix"
}
```

Low `deploy_luck` + high `bug_risk_index` reflects the Fire-Fighters' incident energy. `coffee_requirement` 9 = crunch. `cursed_commit` is the resigned loop of an active incident. Role predictions are deadpan observations, not encouragement.
