CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  email_hash TEXT NOT NULL UNIQUE,
  profile TEXT NOT NULL CHECK (profile IN ('manual', 'prop')),
  experience TEXT NOT NULL,
  markets TEXT NOT NULL,
  workflow TEXT NOT NULL,
  goal TEXT NOT NULL,
  notes TEXT,
  language TEXT NOT NULL CHECK (language IN ('es', 'en')),
  marketing_consent INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0, 1)),
  privacy_consent_at TEXT,
  privacy_policy_version TEXT,
  status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'revisando', 'invitado', 'aceptado', 'espera', 'descartado')),
  cohort TEXT,
  source_path TEXT,
  landing_origin TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS applications_cohort_idx ON applications(cohort);
CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications(created_at DESC);
