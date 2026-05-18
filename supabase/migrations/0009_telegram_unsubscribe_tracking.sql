-- 0009_telegram_unsubscribe_tracking.sql
-- Adds an audit trail for subscriber unsubscribes — when it happened
-- (`unsubscribed_at`) and why (`unsubscribe_source`: 'user' for /stop,
-- 'api_error' for cron deactivation after Telegram API 400/403).
-- See Epic 17 (Telemetry), Story 17.3.
--
-- No CHECK constraint on `unsubscribe_source` — values documented but
-- not enforced at the DB layer (matches the existing pattern: `active`
-- is a plain boolean, not constrained). All writes go via service role.

ALTER TABLE telegram_subscribers
  ADD COLUMN unsubscribed_at    timestamptz NULL,
  ADD COLUMN unsubscribe_source text        NULL;

CREATE INDEX telegram_subscribers_unsubscribed_at_idx
  ON telegram_subscribers(unsubscribed_at);
