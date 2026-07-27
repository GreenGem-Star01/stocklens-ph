# Market data ingest — keep StockLens updated

Batch EOD only (not real-time). Run after PSE close or on a schedule.

**Related:** [`README.md`](README.md) (migrations, roles) · [`DSS-OPS.md`](DSS-OPS.md) (VM cron, PM2)

## Prerequisites

### Environment

| File | Used by | Required vars |
|------|---------|----------------|
| `.env` | Prisma migrate | `DIRECT_URL` (port **5432**) |
| `.env.local` | Next.js dev + ingest scripts | `MARKET_DATA_SOURCE=db`, `DATABASE_URL` (pooler **6543**, `?pgbouncer=true`) |
| `.env.ingest` | Cron on DSS (optional) | Writer `DATABASE_URL` |

**Forecasts snapshot (all modes):** `SUPABASE_URL` (public, `https://<project-ref>.supabase.co`) is needed to *read* the snapshot — put it wherever the app runs (`.env.local`, Vercel env vars). `SUPABASE_SERVICE_ROLE_KEY` is needed only to *publish* it and must stay ingest-only (`.env.local`/`.env.ingest`/GitHub Actions secret) — never in the deployed app's runtime env.

**Supabase hostname:** copy the full pooler host from the dashboard (e.g. `aws-1-ap-southeast-1.pooler.supabase.com`). Do not use the region slug alone (`ap-southeast-1.pooler...` → DNS error).

URL-encode special characters in passwords (`!` → `%21`).

### One-time database setup

```bash
npm run prisma:migrate
npm run prisma:generate
```

Tables: `market_quotes_latest`, `market_bars_daily`, `market_forecasts_latest`, `market_model_metrics`.

Apply forecast tables if migrating manually:

```bash
psql "$DATABASE_URL" -f db/migrations/002_forecast_tables.sql
```

---

## Ingest commands

From project root:

```bash
# 1. Latest EOD quotes (~284 symbols + PSEi) → Postgres
npm run ingest:quotes

# 2. Daily OHLCV bars (all listed equities + PSEI) → Postgres
npm run ingest:bars

# 3. Baseline forecasts + walk-forward metrics → Postgres
npm run ingest:forecasts

# 4. Verify
npm run health:market
```

Restart the dev server after env changes: `npm run dev`.

### Data sources

| Data | Primary | Fallback |
|------|---------|----------|
| Quotes | PSE EDGE | `npm run ingest:quotes -- --source=yahoo` |
| PSEi bars | Yahoo | — |
| Equity bars | PSE EDGE `DisclosureCht.ax` | Yahoo `.PS` is indices-only; equities use EDGE |

### Bars ingest notes

- Full universe: **~283 equities + PSEI** from `data/pse-official-universe.json`
- Default delay **700ms/symbol**, concurrency **3** (`--concurrency=` to override, capped at 5 to respect EDGE rate limits)
- Equities fetch from PSE EDGE only (Yahoo `.PS` doesn't resolve individual PH tickers, so it's skipped for equities — only PSEI uses Yahoo)
- Health check warns if equity symbol count **< 250**

### Debug

```bash
npm run ingest:bars -- --probe=BDO --verbose
npm run ingest:forecasts -- --probe=BDO
```

### Full pipeline (DSS helper)

```bash
npm run setup:dss -- --ingest
```

---

## When to run (Asia/Manila)

| When | Command | Why |
|------|---------|-----|
| **Mon–Fri ~18:00** (after PSE close) | `ingest:quotes` → `ingest:bars` → `ingest:forecasts` | Fresh EOD prices, charts, forecasts |
| **Mon–Fri every 2 min, 9:30–15:30** (DSS VM only) | `ingest:quotes -- --symbols=PSEI,BDO,JFC,ALI,TEL,SMPH --respect-market-hours` | Live dashboard price refresh (6 fixed symbols only — see below) |
| **Sunday ~06:00** | `npm run sync:pse` | Refresh listing directory if PSE listings changed |
| **After `sync:pse`** | Commit `data/pse-official-universe.json` if diff | Keeps stock directory in sync |

Example cron (DSS VM):

```cron
0 18 * * 1-5 /path/to/stocklens-ph/db/cron.example.sh >> /var/log/stocklens-ingest.log 2>&1
*/2 9-15 * * 1-5 flock -n /tmp/stocklens-intraday.lock -c "cd /path/to/stocklens-ph && npm run ingest:quotes -- --symbols=PSEI,BDO,JFC,ALI,TEL,SMPH --respect-market-hours" >> /var/log/stocklens-intraday.log 2>&1
```

See [`cron.example.sh`](cron.example.sh) and [`crontab.example`](crontab.example).

### Intraday dashboard refresh

The dashboard's 6 fixed featured symbols (`PSEI`, `BDO`, `JFC`, `ALI`, `TEL`, `SMPH` — see `src/lib/data/dashboard-featured.ts`) can refresh every ~60s during trading hours instead of waiting for the next day's batch. **Deliberately not** the full ~284-symbol universe: PSE EDGE's quotes endpoint (`scripts/market/pse-edge-quotes.ts`) is one request per symbol and scoped to once-daily EOD use — polling all symbols every 2 minutes would be ~51,000 requests/day and risks the ingest IP getting throttled or blocked. `--respect-market-hours` makes the script no-op outside 9:30–15:30 Manila (checked via `src/lib/market/pse-session.ts`), so the coarse `9-15` cron hour window is safe. Only runs on the DSS VM (`MARKET_DATA_SOURCE=db`) — Vercel/static mode has no live DB, so the dashboard's "Live" indicator never appears there.

---

## Keep each target updated

### Local dev (`MARKET_DATA_SOURCE=db`)

1. Run ingest on trading days (commands above).
2. `npm run health:market`
3. Restart dev: `npm run dev`

### Vercel (static — no Postgres)

Vercel does **not** read Supabase by default. Refresh the committed snapshot:

```bash
npm run ingest:quotes:snapshot
npm run validate:data
git add data/market-quotes-snapshot.json
git commit -m "chore: refresh market snapshot"
git push
```

Vercel env: `MARKET_DATA_SOURCE=static` (no `DATABASE_URL`).

Optional: enable [`.github/workflows/market-snapshot.yml`](../.github/workflows/market-snapshot.yml) for scheduled snapshot refresh on GitHub Actions.

**Forecasts snapshot (Vercel):** publishes directly to Supabase Storage — no git commit. Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (ingest-only, never in the app's runtime env).

```bash
npm run ingest:forecasts:snapshot
```

**Note:** Vercel has no live Postgres. The quotes snapshot is committed JSON; the forecasts snapshot lives in Supabase Storage and is read at request time (cached 5 min) instead of bundled at build time. Full bars/charts require `MARKET_DATA_SOURCE=db` (local / DSS).

### DSS production (`MARKET_DATA_SOURCE=db`)

1. Cron: quotes → bars → forecasts → `health:market` (see [`cron.example.sh`](cron.example.sh)).
2. App uses **read-only** `DATABASE_URL`; cron uses **writer** in `.env.ingest`.
3. Full VM setup: [`DSS-OPS.md`](DSS-OPS.md).

---

## Health checks

**CLI**

```bash
npm run health:market
```

**Supabase SQL Editor**

```sql
SELECT COUNT(*) FROM market_quotes_latest;
SELECT COUNT(*) FROM market_bars_daily WHERE symbol = 'PSEI';
SELECT MAX(as_of) FROM market_quotes_latest;
SELECT symbol, COUNT(*) FROM market_bars_daily
WHERE symbol IN ('PSEI', 'BDO', 'JFC')
GROUP BY symbol;
```

**Expected (trading day)**

- Quotes: ~**284**
- PSEI bars: **> 0**
- `as_of`: within ~**36 hours** (stale over weekends until Monday ingest)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ENOTFOUND` / pooler host | Use full `aws-N-REGION.pooler.supabase.com` in `DATABASE_URL` |
| `health:market` fails | Fix `.env.local`, run migrate, then ingest |
| Equity bars = 0 | Re-run `ingest:bars`; try `--probe=SYMBOL --verbose` |
| Dashboard stale on Vercel | Run `ingest:quotes:snapshot`, commit JSON, push |
| Vercel deploy failed | Run `npm run build` locally; fix errors, push |

---

## Quick reference

```bash
npm run ingest:quotes              # quotes → DB
npm run ingest:bars                # bars → DB (all listed; ~45–90 min)
npm run ingest:forecasts           # baselines + metrics → DB
npm run ingest:forecasts:snapshot  # forecasts → DB + Supabase Storage (Vercel)
npm run ingest:forecasts:lstm      # optional LSTM rows (Python)
npm run ingest:quotes:snapshot     # quotes → DB + snapshot file (Vercel)
npm run health:market              # post-ingest check
npm run sync:pse                   # weekly universe sync
npm run setup:market-data          # alias for snapshot quotes ingest
```
