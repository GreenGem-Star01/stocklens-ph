/**
 * Post-ingest health check for DSS cron.
 * Run: npm run health:market
 */
import { Pool } from "pg";

import {
  assertValidDatabaseUrl,
  loadMarketEnv,
} from "./lib/load-market-env";

const MIN_QUOTES = 200;

async function main(): Promise<void> {
  loadMarketEnv();
  let url: string;
  try {
    url = assertValidDatabaseUrl();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, max: 1 });

  try {
    const quoteRow = await pool.query<{ count: string; latest: Date | null }>(
      `SELECT COUNT(*)::text AS count, MAX(as_of) AS latest FROM market_quotes_latest`,
    );
    const quoteCount = Number(quoteRow.rows[0]?.count ?? 0);
    const latestAsOf = quoteRow.rows[0]?.latest;

    const pseiRow = await pool.query<{ bars: string; latest_bar: Date | null }>(
      `SELECT COUNT(*)::text AS bars, MAX(trade_date) AS latest_bar
       FROM market_bars_daily WHERE symbol = 'PSEI'`,
    );
    const pseiBars = Number(pseiRow.rows[0]?.bars ?? 0);
    const latestBar = pseiRow.rows[0]?.latest_bar;

    console.log(`Quotes: ${quoteCount} rows, latest as_of: ${latestAsOf ?? "none"}`);
    console.log(`PSEI bars: ${pseiBars} rows, latest trade_date: ${latestBar ?? "none"}`);

    let failed = false;
    if (quoteCount < MIN_QUOTES) {
      console.error(`FAIL: expected at least ${MIN_QUOTES} quotes, got ${quoteCount}`);
      failed = true;
    }
    if (pseiBars === 0) {
      console.error("FAIL: no PSEI rows in market_bars_daily (run ingest:bars)");
      failed = true;
    }

    if (failed) process.exit(1);
    console.log("Health check OK");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
