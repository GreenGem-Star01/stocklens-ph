# StockLens PH

Educational Philippine stock analytics dashboard with experimental AI forecasts. Built with Next.js 16, React 19, Tailwind v4, and shadcn/ui.

## Disclaimer

**For educational purposes only.** Forecasts are experimental and not financial advice. See `/terms` for full terms.

## Deployment modes (dual EOD)

| Target | `MARKET_DATA_SOURCE` | Prices / PSEi | Analysis & forecasts |
|--------|----------------------|---------------|----------------------|
| **DSS production** | `db` | Supabase `market_quotes_latest` + `market_bars_daily` | Demo seeds in `src/lib/data/` |
| **Vercel preview / CI** | `static` | `data/market-quotes-snapshot.json` | Same demo seeds |

EOD only — not real-time. Batch ingest runs after PSE close; the app never calls EDGE/Yahoo on page load.

## Brand

Logo and accent live in [`src/components/brand/`](src/components/brand/) and [`src/lib/constants/brand.ts`](src/lib/constants/brand.ts) (teal `#0D6E6E`). StockLens PH is not affiliated with the PSE; do not use PSE trademarks in marketing assets.

## Getting started

```bash
npm install
cp .env.example .env
cp .env.example .env.local   # edit for your target mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Local DB mode:** set `MARKET_DATA_SOURCE=db` and `DATABASE_URL` in `.env.local` (full pooler host, e.g. `aws-1-ap-southeast-1.pooler.supabase.com:6543`), run `npm run health:market`, then `ingest:quotes` / `ingest:bars`, then restart dev.

**Local static mode (default):** `MARKET_DATA_SOURCE=static`. Refresh snapshot with `npm run setup:market-data` if prices look outdated.

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
| `/stocks` | Browse full PSE equity directory (search, sector, subsector) |
| `/watchlist` | Persistent watchlist (localStorage) |
| `/forecasts` | Forecast summary and model comparison |
| `/settings` | Preferences (localStorage) |
| `/terms` | Terms & conditions |
| `/stock/[ticker]` | Stock analysis (e.g. `bdo`, `sm`, `mbt`, `jfc`, `psei`) |

**Catalog:** all listed PSE equities in `data/pse-official-universe.json` (synced from PSE EDGE). **Demo analysis & forecasts:** ~30 blue chips + `PSEI.PS` in `src/lib/data/stock-seeds.ts`.

## API (BFF)

| Endpoint | Description |
|----------|-------------|
| `GET /api/market/overview` | Dashboard market data |
| `GET /api/stocks/[ticker]/analysis` | Full stock analysis bundle |
| `GET /api/stocks/[ticker]/history?range=30d` | OHLCV chart points |
| `GET /api/stocks/[ticker]/forecast?horizon=7d&model=lstm` | Forecast for ticker |
| `GET /api/forecasts` | All forecasts list |
| `GET /api/market/quotes?symbols=BDO.PS,SM.PS` | Latest EOD quotes (DB or snapshot) |

Rate limited (120 req/min per IP). Ticker params validated with Zod.

## Data modes

- **Static (`MARKET_DATA_SOURCE=static`):** Committed snapshot at `data/market-quotes-snapshot.json` plus demo analysis/forecasts. Use on Vercel without Postgres.
- **Database (`MARKET_DATA_SOURCE=db`):** Reads `market_quotes_latest` and `market_bars_daily` via `pg` ([`prisma/schema.prisma`](prisma/schema.prisma)). Use on DSS with cron ingest.

### Supabase + Prisma 7 setup

1. Copy [`.env.example`](.env.example) to **`.env`** (Prisma CLI) and **`.env.local`** (Next.js).
2. **`DATABASE_URL`** — pooler (port **6543**, `?pgbouncer=true`). App on DSS should use a **read-only** role.
3. **`DIRECT_URL`** — direct (port **5432**) for `npm run prisma:migrate` only.
4. Apply schema: `npm run prisma:migrate` && `npm run prisma:generate`
5. **`.env.ingest`** (gitignored) — writer `DATABASE_URL` for cron; see [`db/README.md`](db/README.md).

Runtime uses **`pg`**, not `PrismaClient`. Prisma manages schema; ingest scripts write rows.

For DSS VM database access, use an SSH tunnel before setting `DATABASE_URL`.

### Market data ingest (batch)

Step-by-step ingest and update schedule: [`db/INGEST.md`](db/INGEST.md).

```bash
npm run ingest:quotes      # full listing + PSEi → Postgres
npm run ingest:bars        # OHLCV for all listed equities + PSEI → Postgres
npm run ingest:forecasts   # baseline forecasts + backtest metrics → Postgres
npm run ingest:quotes:snapshot   # also write data/market-quotes-snapshot.json
```

Sources: **PSE EDGE** (default). Fallback: `npm run ingest:quotes -- --source=yahoo`. `ingest:bars` uses Yahoo for **PSEi**; equities fall back to PSE EDGE `DisclosureCht.ax` (Yahoo `.PS` is indices-only). Debug: `npm run ingest:bars -- --probe=BDO --verbose`.

### Ops runbook (DSS)

| Schedule (Manila) | Command |
|-------------------|---------|
| Mon–Fri ~18:00 | `db/cron.example.sh` or quotes → bars → forecasts |
| Sunday 06:00 | `npm run sync:pse` → commit JSON if listings changed |

**Health checks** (Supabase SQL):

```sql
SELECT COUNT(*) FROM market_quotes_latest;
SELECT COUNT(*) FROM market_bars_daily WHERE symbol = 'PSEI';
SELECT MAX(as_of) FROM market_quotes_latest;
```

Expect ~284 quotes, PSEI bars > 0. Stale UI if `as_of` older than 36 hours.

Full roles, cron, and grants: [`db/README.md`](db/README.md). **DSS VM step-by-step:** [`db/DSS-OPS.md`](db/DSS-OPS.md).

### Vercel / CI static path

1. Vercel env: `MARKET_DATA_SOURCE=static` (no `DATABASE_URL` required).
2. After DSS ingest (or on schedule), refresh the committed snapshot:

```bash
npm run ingest:quotes:snapshot
npm run validate:data
git add data/market-quotes-snapshot.json && git commit -m "chore: refresh market snapshot"
```

3. Optional: enable [`.github/workflows/market-snapshot.yml`](.github/workflows/market-snapshot.yml) in GitHub Actions (weekday schedule or manual `workflow_dispatch`; no `DATABASE_URL`; requires PSE EDGE reachable from GitHub runners).

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) uses `MARKET_DATA_SOURCE=static` and `npm run validate:data`.

Footer copy: **~283 listed equities** in the directory plus index/ETF rows; **PSEi** is a separate index line. PSEi EOD comes from [PSE EDGE Index Summary](https://edge.pse.com.ph/index/form.do) during ingest.

## Forecast engine

- **Baselines (TypeScript):** `src/lib/forecast/` — naive, MA, linear with walk-forward MAE/RMSE/MAPE
- **Batch ingest:** `npm run ingest:forecasts` writes `market_forecasts_latest` + `market_model_metrics`
- **LSTM (optional):** `npm run ingest:forecasts:lstm` calls `services/forecast/forecast/lstm.py`

MVP checklist: [`docs/MVP.md`](docs/MVP.md).

```bash
cd services/forecast
python3 -m forecast.lstm --closes '[100,101,102,103]' --horizon 7
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run sync:pse` | Refresh `data/pse-official-universe.json` from PSE EDGE |
| `npm run ingest:quotes` | Batch EOD quotes → Postgres (+ optional snapshot) |
| `npm run ingest:bars` | Daily OHLCV for all listed equities → Postgres (exits 1 if PSEI missing) |
| `npm run ingest:forecasts` | Baseline forecasts + metrics → Postgres |
| `npm run ingest:forecasts:snapshot` | Forecasts ingest + `data/market-forecasts-snapshot.json` |
| `npm run ingest:forecasts:lstm` | Optional LSTM forecasts via Python |
| `npm run ingest:quotes:snapshot` | Quotes ingest + write snapshot file |
| `npm run setup:market-data` | Same as snapshot ingest (static/Vercel refresh) |
| `npm run validate:data` | Validate universe JSON (+ snapshot) for CI |
| `npm run health:market` | Verify Postgres quotes/bars after ingest (DSS cron) |
| `npm run setup:dss` | Validate `DATABASE_URL` + health; add `-- --ingest` for full EOD run |
| `npm run prisma:migrate` | Apply Prisma migrations (`DIRECT_URL`) |
| `npm run prisma:generate` | Generate client to `src/generated/prisma` |
| `npm run prisma:studio` | Browse data in Prisma Studio |

### PSE directory sync

```bash
npm run sync:pse
```

Requires network access to `edge.pse.com.ph`. Commit updated `data/pse-official-universe.json` when listings change.

## Deploy

- **Vercel:** `MARKET_DATA_SOURCE=static`, committed snapshot, no DB secrets.
- **DSS:** `MARKET_DATA_SOURCE=db`, readonly `DATABASE_URL`, cron with writer creds in `.env.ingest`.

Rotate Supabase passwords if credentials were ever exposed. Never commit `.env` or `.env.ingest`.
