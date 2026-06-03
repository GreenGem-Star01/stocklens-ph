import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { isDbMarketEnabled, requireDatabaseUrl } from "@/lib/db/config";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!isDbMarketEnabled()) {
    throw new Error("Database pool requested but MARKET_DATA_SOURCE is not db");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: requireDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
