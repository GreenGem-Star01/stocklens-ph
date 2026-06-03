-- Optional — run in Supabase SQL Editor if you do NOT use supabase-js / PostgREST / GraphQL.
-- StockLens production uses stocklens_ingest / stocklens_readonly over DATABASE_URL only.
--
-- Supabase changelog (May 30 / Oct 30 2026): Data API roles no longer get automatic
-- grants on new public tables. This script revokes API access on market tables even
-- if an older project still had auto-expose enabled.

REVOKE ALL ON TABLE public.market_quotes_latest FROM anon, authenticated;
REVOKE ALL ON TABLE public.market_bars_daily FROM anon, authenticated;
