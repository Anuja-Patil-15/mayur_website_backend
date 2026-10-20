-- PostgreSQL schema (same as Drizzle schema in src/db/schema.js)
-- Use this if you prefer to create tables manually instead of `npm run db:push`.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mcq_sessions (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date          DATE NOT NULL,
  subject               TEXT NOT NULL DEFAULT '',
  total                 INTEGER NOT NULL,
  time_minutes          INTEGER NOT NULL DEFAULT 0,
  a                     INTEGER NOT NULL DEFAULT 0,  -- conceptually correct
  b                     INTEGER NOT NULL DEFAULT 0,  -- retrieval failure
  c                     INTEGER NOT NULL DEFAULT 0,  -- conceptual error
  d                     INTEGER NOT NULL DEFAULT 0,  -- new learning
  e                     INTEGER NOT NULL DEFAULT 0,  -- confusion / decision failure
  learning_score        DOUBLE PRECISION NOT NULL,
  conceptual_clarity    DOUBLE PRECISION NOT NULL,
  previously_learned    DOUBLE PRECISION,
  retrieval_reliability DOUBLE PRECISION,
  mcqs_per_hour         DOUBLE PRECISION,
  priority_1            TEXT NOT NULL DEFAULT '',
  priority_2            TEXT NOT NULL DEFAULT '',
  priority_3            TEXT NOT NULL DEFAULT '',
  reassessment_date     DATE,
  mistakes_reviewed     BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mcq_sessions_total_positive CHECK (total >= 1),
  CONSTRAINT mcq_sessions_counts_match   CHECK (a + b + c + d + e = total)
);

CREATE INDEX IF NOT EXISTS mcq_sessions_user_date_idx ON mcq_sessions (user_id, session_date);
