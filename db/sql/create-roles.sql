-- Run in Supabase SQL Editor (adjust passwords before production).
-- See db/README.md and db/DSS-OPS.md

-- Writer: cron ingest
CREATE ROLE stocklens_ingest WITH LOGIN PASSWORD 'REPLACE_ME_INGEST';
GRANT USAGE ON SCHEMA public TO stocklens_ingest;
GRANT SELECT, INSERT, UPDATE, DELETE ON market_quotes_latest TO stocklens_ingest;
GRANT SELECT, INSERT, UPDATE, DELETE ON market_bars_daily TO stocklens_ingest;

-- Reader: Next.js app on DSS
CREATE ROLE stocklens_readonly WITH LOGIN PASSWORD 'REPLACE_ME_READONLY';
GRANT USAGE ON SCHEMA public TO stocklens_readonly;
GRANT SELECT ON market_quotes_latest, market_bars_daily TO stocklens_readonly;
