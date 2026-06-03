/**
 * Local / VM setup helper for DSS EOD automation.
 *
 *   npm run setup:dss              # validate env + health check
 *   npm run setup:dss -- --ingest  # validate + full cron pipeline (quotes, bars, health)
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

import { assertValidDatabaseUrl, loadMarketEnv } from "./lib/load-market-env";

function ensureEnvIngestTemplate(): void {
  if (existsSync(".env.ingest")) return;
  if (!existsSync(".env.ingest.example")) return;
  copyFileSync(".env.ingest.example", ".env.ingest");
  console.log("Created .env.ingest from .env.ingest.example — edit with your writer DATABASE_URL");
}

function main(): void {
  const runIngest = process.argv.includes("--ingest");

  ensureEnvIngestTemplate();
  loadMarketEnv();

  try {
    assertValidDatabaseUrl();
  } catch (err) {
    console.error((err as Error).message);
    console.error("\nNext steps:");
    console.error("  1. Supabase → Settings → Database → URI (Transaction pooler, port 6543)");
    console.error("  2. Paste into .env.local (MARKET_DATA_SOURCE=db) and .env.ingest");
    console.error("  3. Re-run: npm run setup:dss");
    process.exit(1);
  }

  console.log("DATABASE_URL looks valid.");
  execSync("npm run health:market", { stdio: "inherit" });

  if (runIngest) {
    console.log("\nRunning full EOD ingest (quotes + bars + health)...");
    execSync("bash db/cron.example.sh", { stdio: "inherit" });
  } else {
    console.log("\nOK. To run a full ingest now: npm run setup:dss -- --ingest");
    console.log("On DSS VM after deploy: see db/DSS-OPS.md → Phase 3 (crontab)");
  }
}

main();
