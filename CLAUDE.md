@AGENTS.md

# Definition of Done

Every story or feature change is not done until a Playwright test covering the changed golden path passes against `localhost:3000`.

- localhost connects to production Supabase — real auth, real RLS, real data
- Tests must run against `localhost:3000`, not against mocks or stubs
- `tsc --noEmit` and `eslint` passing is necessary but not sufficient
- The Playwright test is the final gate before marking any story `done`
