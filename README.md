# StockLens PH

> **Static demo mode (Phase 1):** All prices, charts, and forecasts use seeded data in `src/lib/data/`. No API keys or database required for local dev or Vercel preview.

Educational Philippine stock analytics dashboard with experimental AI forecasts. Built with Next.js 16, React 19, Tailwind v4, and shadcn/ui.

## Disclaimer

**For educational purposes only.** Forecasts are experimental and not financial advice. See `/terms` for full terms.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
rm -rf .next && npm run build && npm run start
```

Keep ~2GB free disk space; corrupted `.next` caches can cause 500 errors.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Market overview, search, featured stocks |
| `/stocks` | Browse all 30 blue-chip tickers (search + sector filter) |
| `/watchlist` | Persistent watchlist (localStorage) |
| `/forecasts` | Forecast summary and model comparison |
| `/settings` | Preferences (localStorage) |
| `/terms` | Terms & conditions |
| `/stock/[ticker]` | Stock analysis (e.g. `bdo`, `sm`, `mbt`, `jfc`, `psei`) |

Supported: **30 PSE blue-chip equities** plus `PSEI.PS` (see `src/lib/data/stock-seeds.ts`).

## API (BFF)

| Endpoint | Description |
|----------|-------------|
| `GET /api/market/overview` | Dashboard market data |
| `GET /api/stocks/[ticker]/analysis` | Full stock analysis bundle |
| `GET /api/stocks/[ticker]/history?range=30d` | OHLCV chart points |
| `GET /api/stocks/[ticker]/forecast?horizon=7d&model=lstm` | Forecast for ticker |
| `GET /api/forecasts` | All forecasts list |

Rate limited (120 req/min per IP). Ticker params validated with Zod.

## Data modes

- **Static demo (default):** `MARKET_DATA_SOURCE=static` — seeded Philippine market data in `src/lib/data/`.
- **Live/DB (Phase 3+):** Set `DATABASE_URL` or `MARKET_API_KEY` and point services at your provider.

For DSS VM database access, use an SSH tunnel before setting `DATABASE_URL` (see your `dss-app` workflow).

## Forecast ML service

Python scaffold in `services/forecast/` for LSTM + baseline training. Run separately and write results to Postgres when `FORECAST_DATA_SOURCE=db`.

```bash
cd services/forecast
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m forecast.run --tickers BDO.PS JFC.PS
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |

## Deploy

Push to GitHub and deploy on [Vercel](https://vercel.com). No secrets required for the static demo.
