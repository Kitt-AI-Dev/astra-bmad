-- 0006_reading_reactions.sql
-- Adds like/dislike counters to readings and team_readings.
-- See Epic 16 (Reading feedback — like / dislike), Story 16.1.
--
-- No RLS change: existing public-SELECT policies continue to gate row
-- visibility; the new columns ride along. All writes go via service role
-- (lib/supabase-server.ts), called by the public reaction endpoints
-- /api/{readings,team-readings}/[id]/{like,dislike}.

ALTER TABLE readings
  ADD COLUMN likes_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN dislikes_count integer NOT NULL DEFAULT 0;

ALTER TABLE team_readings
  ADD COLUMN likes_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN dislikes_count integer NOT NULL DEFAULT 0;
