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
3. Evaluate each message individually — React warnings (`hydration`, `key`, `prop types`, `act(...)`) are real bugs, not dev-mode noise
4. A story is only `done` when the list is empty, or every entry is explicitly accepted as non-actionable with reasoning

When the user asks "how about console errors?" — produce the raw list and evaluate each item one by one.
