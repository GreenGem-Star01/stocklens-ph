# DSS VM operations — automated EOD ingest

Runbook for **recommended production**: cron on DSS updates Supabase; Next.js on DSS reads with `MARKET_DATA_SOURCE=db`.

See also: [`README.md`](../README.md), [`db/README.md`](README.md).

## Quick start (copy-paste order)

1. **Supabase** → Settings → Database → **Transaction pooler** URI (port `6543`, `?pgbouncer=true`).
2. **Laptop:** paste URL into `.env.local` with `MARKET_DATA_SOURCE=db`; run `npm run prisma:migrate` if needed.
3. **Validate + test ingest:** `npm run setup:dss -- --ingest`
4. **DSS VM:** clone repo, `cp .env.ingest.example .env.ingest`, paste **writer** URL, `./db/cron.example.sh`, install [`crontab.example`](crontab.example).
5. **DSS app:** `.env.app.example` → readonly URL + `MARKET_DATA_SOURCE=db`, `npm run build`, PM2 start.

If `setup:dss` says "placeholder", your `.env` / `.env.local` still has `HOST.pooler` — replace with the real Supabase string.

## Architecture

```mermaid
flowchart LR
  cron[Cron Mon-Fri]
  script[cron.example.sh]
  quotes[ingest:quotes]
  bars[ingest:bars]
  health[health:market]
  db[(Supabase)]
  app[Next.js readonly]
  cron --> script --> quotes --> db
  script --> bars --> db
  script --> health --> db
  app --> db
```

---

## Phase 0 — Database connectivity on the VM

### Test A: Direct Supabase (preferred)

1. Copy [`.env.ingest.example`](../.env.ingest.example) to `.env.ingest` on the VM.
2. Set `DATABASE_URL` to the **pooler** URL (port **6543**, `?pgbouncer=true`).
3. Run:

```bash
cd /var/www/stocklens-ph   # your install path
npm run health:market
```

Or with `psql` installed:

```bash
set -a && source .env.ingest && set +a
psql "$DATABASE_URL" -c "SELECT 1"
```

| Result | Action |
|--------|--------|
| Success | Use **direct Supabase** for cron and app (simplest). |
| Timeout / refused | Use **SSH tunnel** (Phase 0b). |

### Test B: SSH tunnel (dss-app pattern)

If the VM cannot reach Supabase directly:

1. Start a persistent tunnel (example local port `5433`):

```bash
ssh -N -L 5433:db.YOUR_PROJECT.supabase.co:5432 user@jump-host
```

2. Point `.env.ingest` and app env at:

```text
DATABASE_URL="postgresql://USER:PASS@127.0.0.1:5433/postgres"
```

3. Optional: install [`db/systemd/stocklens-tunnel.service.example`](systemd/stocklens-tunnel.service.example) so the tunnel starts before cron.

4. Re-run `npm run health:market`.

Cron and the app **must use the same** connectivity path.

---

## Phase 1 — Supabase roles and env files

### SQL (Supabase SQL Editor)

Run [`db/sql/create-roles.sql`](sql/create-roles.sql) or the snippets in [`db/README.md`](README.md).

| Role | Used by |
|------|---------|
| `stocklens_ingest` | Cron / `.env.ingest` (writer) |
| `stocklens_readonly` | Next.js on DSS (SELECT only) |

**Dry run:** one Supabase user for both is OK initially; split before production.

### Files on the VM

| File | Purpose |
|------|---------|
| `.env.ingest` | Writer `DATABASE_URL` for cron only — **never commit** |
| App env (PM2/systemd) | Copy from [`.env.app.example`](../.env.app.example) |

---

## Phase 2 — Bootstrap

```bash
cd /var/www/stocklens-ph
git pull
npm install
cp .env.ingest.example .env.ingest   # then edit with real URL
chmod +x db/cron.example.sh db/health-check.sh
./db/cron.example.sh
npm run health:market
```

Expected: ~284 quotes, PSEI bars > 0, recent `as_of`.

---

## Phase 3 — Crontab

### 1. Timezone

```bash
timedatectl
date
```

| VM timezone | Crontab line (Mon–Fri after PSE close) |
|-------------|----------------------------------------|
| `Asia/Manila` | `0 18 * * 1-5 /var/www/stocklens-ph/db/cron.example.sh >> /var/log/stocklens-ingest.log 2>&1` |
| `UTC` | `0 10 * * 1-5 ...` (18:00 Manila ≈ 10:00 UTC) |

### 2. Install

```bash
sudo touch /var/log/stocklens-ingest.log /var/log/stocklens-sync.log
sudo chown "$USER:$USER" /var/log/stocklens-ingest.log /var/log/stocklens-sync.log
crontab -e
# Or: crontab db/crontab.example   # after editing paths inside the file
```

Paste (adjust path) or use [`crontab.example`](crontab.example):

```cron
0 18 * * 1-5 /var/www/stocklens-ph/db/cron.example.sh >> /var/log/stocklens-ingest.log 2>&1
0 6 * * 0 cd /var/www/stocklens-ph && npm run sync:pse >> /var/log/stocklens-sync.log 2>&1
```

### 3. Verify next run

```bash
tail -100 /var/log/stocklens-ingest.log
```

---

## Phase 4 — Deploy Next.js on DSS

### PM2 example

```bash
cp .env.app.example .env.production.local   # or use PM2 ecosystem env
# Edit: MARKET_DATA_SOURCE=db, readonly DATABASE_URL

npm run build
pm2 start npm --name stocklens -- start
pm2 save
```

### Required app env

```text
MARKET_DATA_SOURCE=db
DATABASE_URL=<readonly pooler URL>
```

Do **not** use `.env.ingest` for the app.

### Smoke test

Open `/dashboard`: PSEi with decimals, chart last day aligned with quote `as_of`, “Market prices as of …” updated after cron.

---

## Phase 5 — Vercel snapshot (optional)

1. Vercel: `MARKET_DATA_SOURCE=static` only.
2. After DSS ingest, on a dev machine:

```bash
npm run ingest:quotes:snapshot
npm run validate:data
git add data/market-quotes-snapshot.json && git commit -m "chore: refresh market snapshot"
```

3. Or enable [`.github/workflows/market-snapshot.yml`](../.github/workflows/market-snapshot.yml) (requires PSE EDGE from GitHub runners).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Cron silent | `tail /var/log/stocklens-ingest.log`; run `./db/cron.example.sh` by hand |
| `DATABASE_URL is required` | Create `.env.ingest` in repo root on VM |
| `npm: command not found` in cron | Cron script sets PATH from `node`; install Node 20+ globally or fix `NODE_BIN` in `.env.ingest` |
| Bars fail, quotes OK | `npm run ingest:bars`; check Yahoo from VM |
| App shows stale data | Confirm `MARKET_DATA_SOURCE=db`; wait 60s or hard refresh |
| Tunnel drops | systemd for ssh tunnel before cron |

---

## Verification checklist

- [ ] `npm run health:market` exits 0 on VM
- [ ] `./db/cron.example.sh` exits 0 once manually
- [ ] Crontab installed; log updates on a weekday
- [ ] App uses readonly URL + `db` mode
- [ ] Dashboard PSEi chart and header dates match after ingest
