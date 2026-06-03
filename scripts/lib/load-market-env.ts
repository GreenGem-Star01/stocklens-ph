import { config } from "dotenv";
import { existsSync } from "node:fs";

import {
  isPlaceholderDatabaseUrl,
  validateDatabaseUrl,
} from "../../src/lib/db/database-url";

/** Load .env, .env.local, then .env.ingest if DATABASE_URL still missing. */
export function loadMarketEnv(): void {
  config();
  if (existsSync(".env.local")) {
    config({ path: ".env.local", override: true });
  }
  if (!process.env.DATABASE_URL && existsSync(".env.ingest")) {
    config({ path: ".env.ingest", override: true });
  }
}

export { isPlaceholderDatabaseUrl };

export function assertValidDatabaseUrl(): string {
  loadMarketEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase pooler URL to .env.local (dev) or .env.ingest (DSS cron). See .env.ingest.example",
    );
  }
  return validateDatabaseUrl(url);
}
