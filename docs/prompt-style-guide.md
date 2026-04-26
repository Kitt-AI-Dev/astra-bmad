# 404tune Prompt Style Guide

**Version:** 1.0  
**Last updated:** 2026-04-22  
**Governs:** All reading generation via the Anthropic Batch API  
**Used by:** `scripts/submit-batch.ts`

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

> Saturn squares your on-call rotation today, Scorpio. What looks like a cascading failure is actually a misconfigured alert threshold — trust your gut before you page the team. Lucky kubectl namespace: `staging-only`. Avoid: Fridays. Especially this one.

What makes it work: planetary body + role domain (on-call rotation), specific prediction (misconfigured threshold, not "problems at work"), dry guidance (trust your gut), role-specific lucky item (kubectl namespace in backtick code formatting), callback kicker with comedic timing.

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

### 2.3 Lucky Item

**Format:** `Lucky [role-specific noun]: [specific value].`

The value should be specific and formatted as a real value from that domain — not a description. The specificity is the joke.

| Role | Lucky Item Options | Example |
|------|--------------------|---------|
| software-engineer | branch name, PR size, commit hash prefix, dependency version | `Lucky branch name: hotfix/not-your-fault` |
| devops | kubectl namespace, on-call rotation shift, Terraform workspace, Helm chart | `Lucky kubectl namespace: staging-only` |
| qa | test environment, regression suite name, bug severity level | `Lucky test environment: qa-blue` |
| frontend | viewport width, CSS property, npm package, Lighthouse score | `Lucky CSS property: position: relative` |
| product-manager | story point estimate, stakeholder, sprint goal fragment | `Lucky story point estimate: 3` |
| data-scientist | random seed, model checkpoint, p-value, learning rate | `Lucky random seed: 42` |
| ux-designer | Figma frame name, user archetype, whiteboard color | `Lucky Figma frame: exploration-v3` |
| solutions-architect | cloud region, architecture diagram version, acronym | `Lucky cloud region: us-east-1` |

For software-engineer lucky branch names: use the format `type/something-plausibly-true` (e.g., `fix/not-my-bug`, `feat/actually-a-patch`, `chore/the-real-work`).

### 2.4 Avoid Line

**Format:** `Avoid: [specific thing].` Optionally followed by one more sentence.

Optional but strongly encouraged — use it when it makes the reading land harder. Often the best Avoid line is a callback to something in the body. Can be a single word. Can have a follow-on sentence for comedic timing.

Examples:
- `Avoid: production deployments after 4pm.`
- `Avoid: the estimation meeting. It already knows too much.`
- `Avoid: clicking "merge." The branch is not as ready as it looks.`
- `Avoid: Fridays. Especially this one.`

### 2.5 Reading Length

**Total: 3–5 sentences.** Includes the lucky item line. Tight. No padding.

Sentence count by component:
- Planetary opening: 1 sentence
- Body: 2–3 sentences
- Lucky item: 1 line (not a full sentence grammatically, but counts)
- Avoid: 1 line (optional)

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

### ux-designer

**Domain:** User research, wireframes, prototypes, design systems, handoff, usability

**Vocabulary:** wireframe, prototype, user journey, persona, Figma, component library, design system, usability test, accessibility, affordance, interaction pattern, handoff, annotation, user flow, heuristic, iteration, feedback, edge case, information architecture

**Reading cues:** the feedback that redesigns the component, the dev handoff that went sideways, the user test where everyone did the wrong thing, the Figma file that grew past containment

---

### solutions-architect

**Domain:** System design, trade-off analysis, cloud architecture, integrations, scalability, documentation

**Vocabulary:** architecture diagram, trade-off, scalability, CAP theorem, event-driven, microservices, API contract, cloud region, SLA, HA (high availability), DR (disaster recovery), cost optimization, vendor lock-in, ADR (Architecture Decision Record), throughput, latency, idempotency, eventual consistency

**Reading cues:** the ADR that nobody read, the trade-off that seemed fine six months ago, the service that was supposed to be temporary, the whiteboard diagram that became production reality

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

This is the canonical prompt template. `scripts/submit-batch.ts` copies this exactly — do not modify the template without updating the script.

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

Write a single daily reading for a {sign} {role_label}. Follow this structure exactly:
1. Open with: [Planet] [aspect] your [role-relevant domain] today, [Sign].
   Valid aspects: squares (tension), trines (flow), conjuncts (amplification), opposes (conflict), sextiles (opportunity requiring action)
2. 2–3 sentences of reading body: situation → insight → guidance. Stay in the role's domain. Weave in the month context subtly — don't state it directly.
3. One lucky item line: Lucky [role-specific noun]: [specific value].
4. Optional kicker: Avoid: [specific thing]. (1–2 sentences — use it if it makes the reading land harder; the second sentence can be a callback or punchline)

Total length: 3–5 sentences. Tight. No padding.

Output ONLY the reading text. No title. No label. No preamble. No "Here is your reading:".
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
  'data-scientist': 'Data Scientist',
  'ux-designer': 'UX Designer',
  'solutions-architect': 'Solutions Architect',
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

- [ ] **Planetary opening present** — starts with a planet + aspect + role domain
- [ ] **Role vocabulary only** — no cross-role contamination (DevOps reading has no wireframes; PM reading has no kubectl)
- [ ] **Lucky item present and specific** — formatted correctly, value is concrete not abstract
- [ ] **Tone is dry/deadpan** — not jokey, not winking, not motivational
- [ ] **Sign personality subtly expressed** — not stated explicitly, but present in the situation described
- [ ] **Could not apply to a different sign × role** — the reading feels specific, not interchangeable
- [ ] **Length 3–5 sentences** — no padding, no truncation
- [ ] **No forbidden phrases** — none of the banned generic phrases appear
- [ ] **Avoid line quality** — if present, it is specific and either callbacks to the body or lands as a standalone punchline; if absent, the reading still lands without it

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
| 1.1 | 2026-04-22 | Code review patches: fixed invalid "enters" aspect example; removed PM vocabulary ("story points") from Taurus×DevOps sample; clarified Avoid line allows 2 sentences; corrected April Q2 label; added sign_personality verbatim-repeat guard to prompt; added Avoid line checklist item |
| 1.0 | 2026-04-22 | Initial version — validated against 10 sample readings |

---

## Appendix: Sample Readings (Validation Batch)

The following readings were generated using this style guide at v1.0 and reviewed against the per-reading checklist. All passed. Included as calibration reference.

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

### 8. Aquarius × UX Designer
> Uranus trines your information architecture today, Aquarius. The user flow you proposed in the last design review was correct — the team just hasn't caught up to it yet, and the usability test you're running this week will prove it. Lucky Figma frame: `exploration-v7`. Avoid: explaining it again in the sync. Let the test speak.

*Checklist:* ✅ planetary opening, ✅ UX vocabulary only (user flow, design review, usability test, Figma frame), ✅ lucky frame specific, ✅ dry tone, ✅ Aquarius' iconoclastic "team hasn't caught up" energy, ✅ sign × role specific

### 9. Libra × Solutions Architect
> Venus squares your architecture diagram today, Libra. You've been in the trade-off analysis for this service mesh decision for eleven days, and both options are still equally valid — they were equally valid on day one. Lucky acronym: `YAGNI`. Avoid: scheduling another review to decide if you should schedule a review.

*Checklist:* ✅ planetary opening, ✅ SA vocabulary only (architecture diagram, trade-off, service mesh), ✅ lucky acronym perfectly chosen (YAGNI = You Aren't Gonna Need It — a direct jab at over-analysis), ✅ dry tone, ✅ Libra's indecision expressed precisely, ✅ sign × role specific

### 10. Taurus × DevOps Engineer
> Saturn conjuncts your infrastructure today, Taurus. The Kubernetes migration that's been on the roadmap for fourteen months is being prioritized again, and once again you will explain, patiently, that the current setup has a 99.97% uptime and the blast radius of changing it is not worth the rollback risk. Lucky Terraform workspace: `production-legacy`. Avoid: the architecture meeting. They already know your position.

*Checklist:* ✅ planetary opening, ✅ DevOps vocabulary only (Kubernetes, Terraform workspace, uptime, rollback risk), ✅ lucky workspace both specific and comedically perfect ("production-legacy"), ✅ dry tone, ✅ Taurus' stubbornness and comfort-seeking expressed as principled resistance, ✅ sign × role specific
