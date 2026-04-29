# 404tune Prompt Style Guide

**Version:** 2.4  
**Last updated:** 2026-04-29  
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
  "lucky_value": "staging-only",
  "avoid": "Fridays. Especially this one.",
  "planetary_influence": "Saturn □ Mars"
}
```

What makes it work: planetary body + role domain (on-call rotation) opens `general_reading`; specific prediction (misconfigured threshold, not "problems at work"); dry guidance (trust your gut); role-specific `lucky_value` (`staging-only` = a kubectl namespace, displayed under static `LUCKY NAMESPACE` header); callback kicker with comedic timing in `avoid`; `planetary_influence` symbol `□` matches the "squares" verb in the opening.

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

### 2.3 Lucky Value (`lucky_value` JSON field)

The card displays this under a static **LUCKY NAMESPACE** column header. The LLM emits the value only — never include a label inside the value.

**Constraint:** ≤ 24 characters. One short token or phrase, formatted as it would appear in the role's domain. No prose.

The specificity is the joke — `staging-only` is funny because a kubectl namespace named "staging-only" is hostile in a way every DevOps engineer has felt. `Things will go well` is not.

| Role | Value Type | Examples (≤24 chars) |
|------|-----------|----------------------|
| software-engineer | branch name | `fix/not-my-bug`, `feat/actually-a-patch` |
| devops | kubectl namespace, cluster, Terraform workspace | `staging-only`, `production-legacy` |
| qa | test environment, regression suite name | `qa-blue`, `regression-flaky` |
| frontend | CSS property/value, viewport width | `position: relative`, `1280px` |
| product-manager | story point estimate | `3`, `13`, `?` |
| data-scientist | random seed, experiment ID, model checkpoint | `42`, `exploration-v3` |
| designer | Figma frame name | `exploration-v7`, `final-final` |
| solutions-architect | cloud region, ADR id, acronym | `us-east-1`, `ADR-0042`, `YAGNI` |
| project-manager | milestone name or phase | `phase-2`, `go-live`, `UAT` |
| pr-manager | story angle slug | `exclusive-launch`, `no-comment` |
| hr-manager | headcount number | `7`, `12`, `+1 req pending` |
| marketing | UTM source or campaign slug | `utm_source=organic`, `q2-push` |

For software-engineer branch names: use the format `type/something-plausibly-true` (e.g., `fix/not-my-bug`, `feat/actually-a-patch`, `chore/the-real-work`).

### 2.4 Avoid (`avoid` JSON field)

The card displays this under a static **AVOID** column header. The LLM emits the value only — no `Avoid:` prefix.

**Constraint:** ≤ 50 characters total. One specific thing, optionally followed by a callback punchline. Often the best avoid line callbacks something in the body. Can be a single short clause.

Examples (within cap):
- `Fridays. Especially this one.` (29 chars)
- `Merging to main before the CI logs load.` (40)
- `The estimation meeting. It already knows.` (41)
- `Production deployments after 4pm.` (33)

### 2.5 Reading Length & Field Caps

The reading is a single JSON object with four fields. Length is enforced per-field, not in aggregate.

| Field | Constraint |
|-------|-----------|
| `general_reading` | 2–3 sentences, opens with the planetary aspect |
| `lucky_value` | ≤ 24 characters |
| `avoid` | ≤ 50 characters |
| `planetary_influence` | ≤ 20 characters |

`general_reading` includes the planetary opening as its first sentence. Do NOT include the lucky item or avoid line inside `general_reading` — those are separate fields.

### 2.6 Planetary Influence (`planetary_influence` JSON field)

Astrological shorthand for the day's dominant aspect, displayed under the static **PLANETARY INFLUENCE** column header.

**Format:** `<Planet> <symbol> <Body>` — e.g. `Saturn □ Mars`.

**Constraint:** ≤ 20 characters.

**Aspect symbols (must match the verb used in the opening of `general_reading`):**

| Verb | Symbol | Meaning |
|------|--------|---------|
| squares | `□` | tension, friction, obstacle |
| trines | `△` | flow, ease, unexpected luck |
| conjuncts | `☌` | amplification |
| opposes | `☍` | conflict, competing forces |
| sextiles | `✶` | opportunity requiring action |

The planet should be the same one that opens `general_reading`. The body can be another planet or a zodiac sign.

Examples (within cap):
- `Saturn □ Mars` (13)
- `Mercury ☍ Jupiter` (17)
- `Venus △ Moon` (12)
- `Mars ☌ Sun` (11)
- `Saturn □ Sagittarius` (20)

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
- [ ] **Exactly four fields** — `general_reading`, `lucky_value`, `avoid`, `planetary_influence`; no extras, no missing

**Caps:**
- [ ] **`lucky_value` ≤ 24 chars**
- [ ] **`avoid` ≤ 50 chars**
- [ ] **`planetary_influence` ≤ 20 chars**

**Content:**
- [ ] **Planetary opening present** — `general_reading` starts with `[Planet] [aspect verb] your [role domain] today, [Sign]`
- [ ] **`general_reading` is 2–3 sentences** — no padding, no truncation; lucky and avoid lines are NOT inside it
- [ ] **Role vocabulary only** — no cross-role contamination (DevOps has no wireframes; PM has no kubectl)
- [ ] **`lucky_value` concrete and role-appropriate** — real-domain value, no label inside the value
- [ ] **`avoid` specific** — callbacks the body or lands as standalone punchline; no `Avoid:` prefix in the value
- [ ] **`planetary_influence` matches opening** — same planet as the `general_reading` opening; symbol matches the aspect verb (squares→`□`, trines→`△`, conjuncts→`☌`, opposes→`☍`, sextiles→`✶`)
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
| 2.3 | 2026-04-26 | Spec hygiene: rewrote §2.3–2.5 for JSON shape, added §2.6 (`planetary_influence`); refreshed Validation Checklist with schema/cap/content groups; split appendix into v2.x JSON samples (A) and v1.0 legacy prose samples (B); updated canonical reference example to JSON; fixed `Used by:` header reference. |
| 2.2 | 2026-04-26 | Tightened `avoid` cap from 70 → 50 chars after layout testing showed two-line wraps in the stat column. |
| 2.1 | 2026-04-26 | Dropped `lucky_label` from JSON spec — card renders a static "LUCKY NAMESPACE" header. Role-noun selection folded into `lucky_value` guidance. Added length caps: lucky_value ≤24, avoid ≤70, planetary_influence ≤20. |
| 2.0 | 2026-04-26 | Switched output format from prose to structured JSON: general_reading, lucky_label, lucky_value, avoid, planetary_influence. Reader card renders the latter three as stat columns under the body. Legacy prose rows still parse via fallback. |
| 1.1 | 2026-04-22 | Code review patches: fixed invalid "enters" aspect example; removed PM vocabulary ("story points") from Taurus×DevOps sample; clarified Avoid line allows 2 sentences; corrected April Q2 label; added sign_personality verbatim-repeat guard to prompt; added Avoid line checklist item |
| 1.0 | 2026-04-22 | Initial version — validated against 10 sample readings |

---

## Appendix A: Sample Readings (v2.x JSON Format)

These illustrate the current four-field JSON output. Validate against the Section 7 checklist.

### A1. Leo × Software Engineer (caps demonstration)

```json
{
  "general_reading": "Saturn squares your code review queue today, Leo. The unsolicited refactor you bundled into Friday's PR will draw exactly the audience you wanted — and ten more LGTM-but-also-consider notes. Defend it with a changelog, not a Slack thread.",
  "lucky_value": "feat/standing-ovation-pr",
  "avoid": "Refactors on Friday. The CI is already mad at you.",
  "planetary_influence": "Saturn □ Sagittarius"
}
```

Caps: `lucky_value` 24/24, `avoid` 50/50, `planetary_influence` 20/20. Demonstrates all three caps at exactly the limit. Symbol `□` matches "squares" verb. Leo's performative flair expressed through unsolicited refactor and audience-seeking.

### A2. Scorpio × DevOps Engineer

```json
{
  "general_reading": "Saturn squares your on-call rotation today, Scorpio. What looks like a cascading failure is actually a misconfigured alert threshold — trust your gut before you page the team.",
  "lucky_value": "staging-only",
  "avoid": "Fridays. Especially this one.",
  "planetary_influence": "Saturn □ Mars"
}
```

Caps: 12/24, 29/50, 13/20. Canonical reference port of the v1.0 sample to JSON. DevOps vocabulary only, Scorpio investigative intensity expressed (trust your gut, don't panic-page).

### A3. Aquarius × Designer

```json
{
  "general_reading": "Uranus trines your information architecture today, Aquarius. The user flow you proposed in the last design review was correct — the team just hasn't caught up to it yet, and the usability test you're running this week will prove it.",
  "lucky_value": "exploration-v7",
  "avoid": "Explaining it again in the sync.",
  "planetary_influence": "Uranus △ Aquarius"
}
```

Caps: 14/24, 32/50, 17/20. Symbol `△` matches "trines". UX vocabulary only (user flow, design review, usability test). Aquarius iconoclasm expressed as "team hasn't caught up yet" without stating the trait.

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

Write the reading in this exact markdown format (no deviations):

## {team_archetype}

{2–3 sentences of team forecast for the day. Ground it in the archetype's energy. Be specific.}

**QA will** {one sentence — a specific QA-flavored prediction}
**PM will** {one sentence — a specific PM-flavored prediction}
**Dev will** {one sentence — a specific Dev-flavored prediction}
**Designer will** {one sentence — a specific Designer-flavored prediction}

**Lucky move:** {one concrete action for the team today}
**Avoid:** {one specific thing the team should not do today}

Output the markdown block only. No preamble. No explanation. Start with ## and end with the Avoid line.
```

### 6.4 Content Guidance

- **Archetype energy is the frame** — every sentence should feel grounded in the archetype's situation. The Crunch Team is sweating a deadline; The Alignment-Seekers are stuck in a meeting about the meeting.
- **Role nods are observations, not horoscope predictions** — "QA will surface a critical bug just before the meeting" reads as a knowing observation, not a cosmic forecast. Keep them deadpan.
- **Specific beats generic** — "PM will reprioritize three stories from Done to In Progress" is funny. "PM will face challenges" is not.
- **Lucky move is team-level** — something the whole team can act on, not individual advice. "Run the postmortem before Friday" or "merge the branch everyone is afraid to touch."
- **Avoid is a shared team trap** — "The status update Slack thread. It has already started." or "The emergency standup. The fire is already out."
- **max_tokens: 500** — the structured format is longer than individual readings (400). Do not reduce.

### 6.5 Sample Output

```markdown
## The Fire-Fighters

Saturn squares your on-call rotation today. The incident from last Tuesday was resolved, postmortem written, action items assigned — and yet the alert that triggered it is firing again. The runbook was updated for the scenario that happened, not the one that is happening now.

**QA will** find a second reproduction path that makes the blast radius larger than first reported.
**PM will** ask if this affects the release date while the incident channel is still active.
**Dev will** fix the symptom first and the root cause after the retrospective.
**Designer will** not be involved but will be asked to update the status page banner.

**Lucky move:** Write the postmortem before the fix. It focuses the diagnosis.
**Avoid:** The "quick call" to align on scope. It is not quick and the scope is already decided.
```
