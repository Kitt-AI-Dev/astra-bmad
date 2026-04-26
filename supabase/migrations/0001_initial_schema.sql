-- 0001_initial_schema.sql
-- Creates the readings and batches tables with RLS policies.

-- ---------------------------------------------------------------------------
-- readings
-- ---------------------------------------------------------------------------
CREATE TABLE readings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sign         text        NOT NULL,
  role         text        NOT NULL,
  date         date        NOT NULL,
  content      text        NOT NULL,
  suppressed   boolean     DEFAULT false,
  batch_month  text        NOT NULL,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT readings_sign_role_date_key UNIQUE (sign, role, date)
);

ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Public readers may only see live (non-suppressed, published) readings.
CREATE POLICY "Public can read live readings"
  ON readings FOR SELECT
  USING (date <= CURRENT_DATE AND suppressed = false);

-- All writes require the service role key (bypasses RLS).

-- ---------------------------------------------------------------------------
-- batches
-- ---------------------------------------------------------------------------
CREATE TABLE batches (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  anthropic_batch_id text        NOT NULL UNIQUE,
  batch_month        text        NOT NULL,
  status             text        NOT NULL,
  total_requests     int         NOT NULL,
  succeeded          int         DEFAULT 0,
  errored            int         DEFAULT 0,
  is_retry           boolean     DEFAULT false,
  parent_batch_id    uuid        REFERENCES batches(id),
  submitted_at       timestamptz DEFAULT now(),
  completed_at       timestamptz
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- No public policies on batches — service role key required for all operations.
