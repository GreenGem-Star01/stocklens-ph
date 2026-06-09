# StockLens PH — MVP checklist

Baselines-first MVP: technical analysis and walk-forward forecasts for all listed PSE equities.

## Pass criteria

| Feature | Status | How to verify |
|---------|--------|----------------|
| Search/select any listed ticker | Required | `/stocks` → open any symbol |
| Historical close chart from DB | Required | Stock page shows price panel when `ingest:bars` has data |
| SMA / volume / RSI / MACD | Required | Technical Analysis card on stock page |
| 7d and 30d baseline forecasts | Required | Change Forecast dropdown; line updates |
| Model dropdown (naive / MA / linear / LSTM) | Required | Change Model; forecast + metrics update |
| MAE / RMSE / MAPE from backtest | Required | Performance + model comparison tables |
| Cron pipeline documented | Required | `db/INGEST.md`, `db/cron.example.sh` |
| LSTM (Phase 4) | Optional nightly | `npm run ingest:forecasts:lstm` |

## Local verification

```bash
npm run ingest:quotes
npm run ingest:bars          # ~45–90 min full universe
npm run ingest:forecasts
npm run health:market
npm run dev
```

Static/Vercel mode:

```bash
npm run ingest:forecasts:snapshot
git add data/market-forecasts-snapshot.json
```

## Architecture

- **Ingest (batch):** quotes → bars → forecasts → health
- **Runtime (Next.js):** read Postgres or committed JSON snapshots — no EDGE/Yahoo on page load
- **Forecast engine:** `src/lib/forecast/` (TypeScript baselines + optional Python LSTM)

## Deferred (post-MVP)

- Intraday quotes
- Order book / Level 2
- Portfolio backtesting
- User-trained models
