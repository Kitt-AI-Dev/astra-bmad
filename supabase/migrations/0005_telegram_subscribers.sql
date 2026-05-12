CREATE TABLE telegram_subscribers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id          bigint      NOT NULL UNIQUE,
  sign             text,
  role             text,
  timezone_offset  integer,    -- signed minutes from UTC, e.g. +60 for UTC+1, -300 for UTC-5
  active           boolean     NOT NULL DEFAULT true,
  subscribed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telegram_subscribers ENABLE ROW LEVEL SECURITY;
-- No public policies — service role key only.
-- The webhook route and cron delivery route both use createClient() from lib/supabase-server.ts,
-- which injects SUPABASE_SERVICE_ROLE_KEY and bypasses RLS entirely.
