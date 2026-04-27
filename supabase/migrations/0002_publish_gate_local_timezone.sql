-- 0002_publish_gate_local_timezone.sql
-- Relax the public read RLS policy by 1 day so readers in positive UTC offsets
-- (CEST, JST, AEST, NZ, etc.) can see their local-date reading immediately at
-- local midnight, instead of waiting until UTC midnight.
--
-- DateGuard (client component) only ever requests the user's actual local date,
-- so future readings are not exposed via UI links. Direct URL access to a
-- not-yet-published reading is acceptable and limited to 24h ahead.
--
-- Resolves the contradiction in architecture.md between line 282 (Sydney
-- reader sees Tuesday's reading) and line 271 (date <= CURRENT_DATE in UTC).

DROP POLICY IF EXISTS "Public can read live readings" ON readings;

CREATE POLICY "Public can read live readings"
  ON readings FOR SELECT
  USING (date <= CURRENT_DATE + 1 AND suppressed = false);
