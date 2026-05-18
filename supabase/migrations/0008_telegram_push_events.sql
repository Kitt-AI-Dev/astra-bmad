-- 0008_telegram_push_events.sql
-- Records every successfully-delivered Telegram daily push, so the
-- click-through rate can be measured from the inbound deep-link.
-- See Epic 17 (Telemetry), Story 17.2.
--
-- One row per (subscriber, cron tick) for successful sends only.
-- `push_id` is the opaque token included in the message's deep-link URL
-- (`?t=<push_id>`); the destination page route flips `clicked_at` on
-- inbound traffic via UPDATE ... WHERE push_id = $1 AND clicked_at IS NULL.

CREATE TABLE telegram_push_events (
  push_id        uuid        PRIMARY KEY,
  subscriber_id  bigint      NOT NULL REFERENCES telegram_subscribers(chat_id) ON DELETE CASCADE,
  sent_at        timestamptz NOT NULL DEFAULT now(),
  clicked_at     timestamptz NULL
);

CREATE INDEX telegram_push_events_subscriber_id_idx ON telegram_push_events(subscriber_id);
CREATE INDEX telegram_push_events_sent_at_idx       ON telegram_push_events(sent_at);

ALTER TABLE telegram_push_events ENABLE ROW LEVEL SECURITY;
-- No public policies — service role key only.
-- The cron route, the destination page click-capture, and the admin
-- engagement endpoint all use createClient() from lib/supabase-server.ts,
-- which injects SUPABASE_SERVICE_ROLE_KEY and bypasses RLS entirely.
