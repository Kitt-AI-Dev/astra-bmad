@AGENTS.md

# Definition of Done

Every story or feature change is not done until a Playwright test covering the changed golden path passes against `localhost:3000`.

- localhost connects to production Supabase — real auth, real RLS, real data
- Tests must run against `localhost:3000`, not against mocks or stubs
- `tsc --noEmit` and `eslint` passing is necessary but not sufficient
- The Playwright test is the final gate before marking any story `done`

## Console log requirement (mandatory, not optional)

Playwright tests MUST include a `page.on('console', ...)` listener. Before marking done:

1. Collect every `error` and `warning` message from the browser console
2. List them explicitly — never summarize as "clean" without showing what was found
3. React warnings (`hydration`, `key`, `prop types`, `act(...)`) are real bugs, not dev-mode noise
4. **No console error may be dismissed without explicit user approval** — show the error, stop, and wait for Kitt to say it is acceptable before proceeding
5. A story is only `done` when the list is empty, or Kitt has explicitly approved each entry as non-actionable

When the user asks "how about console errors?" — produce the raw list one by one, then wait for Kitt's response.

## Failed tests — zero tolerance

**NEVER accept a failing test without explicit user approval.** This means:

1. Any `npx playwright test` run that shows failures MUST be called out immediately and loudly — not mentioned as a footnote, not described as "pre-existing"
2. Do not proceed to the next task while tests are red — stop and investigate the failure
3. Do not characterize a failure as acceptable, expected, or ignorable without the user explicitly saying so
4. When reporting test results, lead with failures — not with the pass count
5. A "pre-existing failure" is still a failure. Treat it as a bug that needs fixing or explicit sign-off, not background noise
