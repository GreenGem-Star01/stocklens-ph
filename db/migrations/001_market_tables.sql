-- StockLens PH market data (read by Next.js, written by ingest jobs)
-- Apply on DSS Postgres: psql "$DATABASE_URL" -f db/migrations/001_market_tables.sql

CREATE TABLE IF NOT EXISTS market_quotes_latest (
  symbol TEXT PRIMARY KEY,
  last_close NUMERIC(18, 6) NOT NULL,
  change_pct NUMERIC(10, 4) NOT NULL DEFAULT 0,
  change_abs NUMERIC(18, 6),
  volume BIGINT,
  as_of TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'dss'
);

CREATE INDEX IF NOT EXISTS market_quotes_latest_as_of_idx
  ON market_quotes_latest (as_of DESC);

CREATE TABLE IF NOT EXISTS market_bars_daily (
  symbol TEXT NOT NULL,
  trade_date DATE NOT NULL,
  open NUMERIC(18, 6) NOT NULL,
  high NUMERIC(18, 6) NOT NULL,
  low NUMERIC(18, 6) NOT NULL,
  close NUMERIC(18, 6) NOT NULL,
  volume BIGINT,
  PRIMARY KEY (symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS market_bars_daily_symbol_date_idx
  ON market_bars_daily (symbol, trade_date DESC);
