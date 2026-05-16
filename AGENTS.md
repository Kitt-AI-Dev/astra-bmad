<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Vercel cron registration

After changing `vercel.json`, the first deploy may not register new cron entries — they will not appear in Project Settings → Crons. A subsequent redeploy fixes it. Always verify cron registration after any deploy that touches `vercel.json`, and redeploy if entries are missing. Root cause unknown; documented from Epic 14 retro action item 2.
