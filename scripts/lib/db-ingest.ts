import { Pool } from "pg";

import { assertValidDatabaseUrl } from "./load-market-env";

let pool: Pool | null = null;

export function getIngestPool(): Pool {
  const url = assertValidDatabaseUrl();
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

export async function closeIngestPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
