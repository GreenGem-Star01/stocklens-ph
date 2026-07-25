# Database migrations

**Ingest & refresh schedule:** [`INGEST.md`](INGEST.md)

**DSS production runbook (cron, VM, PM2):** [`DSS-OPS.md`](DSS-OPS.md)

**Preferred (Supabase / Prisma 7):** define tables in [`prisma/schema.prisma`](../prisma/schema.prisma) and run:

```bash
npm run prisma:migrate
```

Uses `DIRECT_URL` from `.env` via [`prisma.config.ts`](../prisma.config.ts).

**Alternative (raw SQL):** apply on any Postgres host:

```bash
psql "$DIRECT_URL" -f db/migrations/001_market_tables.sql
```

## Roles (Supabase / Postgres)

Use separate credentials for cron ingest vs the Next.js app.

### Writer (`stocklens_ingest`)

Used by `npm run ingest:quotes` and `npm run ingest:bars` on the DSS VM. Store in `.env.ingest` (gitignored); never use on Vercel.

```sql
CREATE ROLE stocklens_ingest WITH LOGIN PASSWORD '...';
GRANT USAGE ON SCHEMA public TO stocklens_ingest;
GRANT SELECT, INSERT, UPDATE, DELETE ON market_quotes_latest TO stocklens_ingest;
GRANT SELECT, INSERT, UPDATE, DELETE ON market_bars_daily TO stocklens_ingest;
```

Set `DATABASE_URL` in `.env.ingest` to the pooler URL with this user.

### Read-only (`stocklens_readonly`)

Used by Next.js when `MARKET_DATA_SOURCE=db` on DSS.

```sql
CREATE ROLE stocklens_readonly WITH LOGIN PASSWORD '...';
GRANT USAGE ON SCHEMA public TO stocklens_readonly;
GRANT SELECT ON market_quotes_latest, market_bars_daily TO stocklens_readonly;
```

Set `DATABASE_URL` in the app env to the pooler URL with this user.

## DSS cron (EOD)

After PSE close (~18:00 Asia/Manila), run quotes then bars:

| Schedule | Command |
|----------|---------|
| Mon–Fri 18:00 | [`db/cron.example.sh`](cron.example.sh) or `npm run ingest:quotes` then `npm run ingest:bars` |
| Sunday 06:00 | `npm run sync:pse` (commit `data/pse-official-universe.json` if changed) |

Example crontab line:

```cron
0 18 * * 1-5 /path/to/stocklens-ph/db/cron.example.sh >> /var/log/stocklens-ingest.log 2>&1
```

After ingest, cron runs `npm run health:market` (quotes ≥ 200, PSEI bars > 0). SQL templates: [`sql/create-roles.sql`](sql/create-roles.sql).

For DSS VM access via SSH tunnel, start the tunnel before cron or point `DATABASE_URL` at the tunneled host/port.

## Health checks

Run in Supabase SQL Editor after ingest:

```sql
SELECT COUNT(*) AS quote_count FROM market_quotes_latest;
SELECT COUNT(*) AS psei_bars FROM market_bars_daily WHERE symbol = 'PSEI';
SELECT MAX(as_of) AS latest_as_of FROM market_quotes_latest;
SELECT symbol, COUNT(*) AS bars
FROM market_bars_daily
WHERE symbol IN ('PSEI', 'BDO', 'JFC')
GROUP BY symbol;
```

Expected on a trading day:

- `quote_count` ≈ 284 (listed equities + PSEI)
- `psei_bars` > 0
- `latest_as_of` within ~36 hours (weekends may be older until Monday ingest)

## Environment files

| File | Purpose |
|------|---------|
| `.env` | `DIRECT_URL` for `npm run prisma:migrate` |
| `.env.local` | Next.js dev: `MARKET_DATA_SOURCE`, `DATABASE_URL` (readonly pooler) |
| `.env.ingest` | Cron only: `DATABASE_URL` (writer pooler) — **gitignore** |
