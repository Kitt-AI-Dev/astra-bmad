-- 0007_reading_share_count.sql
-- Adds a share-click counter to readings and team_readings.
-- See Epic 17 (Telemetry), Story 17.1.
--
-- No RLS change: existing public-SELECT policies continue to gate row
-- visibility; the new column rides along. All writes go via service role
-- (lib/supabase-server.ts), called by the public share endpoints
-- /api/{readings,team-readings}/[id]/share.

ALTER TABLE readings
  ADD COLUMN share_count integer NOT NULL DEFAULT 0;

ALTER TABLE team_readings
  ADD COLUMN share_count integer NOT NULL DEFAULT 0;
