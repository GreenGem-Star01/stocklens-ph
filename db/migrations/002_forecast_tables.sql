-- Forecast outputs and walk-forward backtest metrics (MVP baselines)
-- Apply via: psql $DATABASE_URL -f db/migrations/002_forecast_tables.sql

CREATE TABLE IF NOT EXISTS market_forecasts_latest (
  symbol       TEXT NOT NULL,
  model        TEXT NOT NULL,
  horizon_days INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  points       JSONB NOT NULL,
  PRIMARY KEY (symbol, model, horizon_days)
);

CREATE TABLE IF NOT EXISTS market_model_metrics (
  symbol       TEXT NOT NULL,
  model        TEXT NOT NULL,
  horizon_days INTEGER NOT NULL,
  mae          NUMERIC(18, 6) NOT NULL,
  rmse         NUMERIC(18, 6) NOT NULL,
  mape         NUMERIC(10, 4) NOT NULL,
  dir_accuracy NUMERIC(10, 4),
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symbol, model, horizon_days)
);
