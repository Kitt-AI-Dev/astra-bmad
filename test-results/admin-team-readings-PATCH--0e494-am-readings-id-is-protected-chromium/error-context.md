# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-team-readings.spec.ts >> PATCH /api/admin/team-readings/[id] is protected
- Location: tests/admin-team-readings.spec.ts:15:5

# Error details

```
Error: apiRequestContext.patch: connect ECONNREFUSED ::1:3000
Call log:
  - → PATCH http://localhost:3000/api/admin/team-readings/00000000-0000-0000-0000-000000000000
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 18

```