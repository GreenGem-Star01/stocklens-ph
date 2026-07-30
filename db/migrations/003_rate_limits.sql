-- Backs API rate limiting (src/lib/api/rate-limit.ts). Previously in-memory,
-- which doesn't hold up on Vercel's serverless Node runtime.
-- Apply via: psql $DATABASE_URL -f db/migrations/003_rate_limits.sql

CREATE TABLE IF NOT EXISTS rate_limits (
  key      TEXT NOT NULL PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);
