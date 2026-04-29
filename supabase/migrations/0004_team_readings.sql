CREATE TABLE team_readings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL,
  slot       SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 12),
  content    TEXT NOT NULL,
  suppressed BOOLEAN NOT NULL DEFAULT false,
  batch_id   UUID REFERENCES batches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, slot)
);

ALTER TABLE team_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publish_gate" ON team_readings
  FOR SELECT
  USING (date <= CURRENT_DATE + 1 AND suppressed = false);
