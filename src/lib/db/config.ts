import {
  isDatabaseConnectionError,
  validateDatabaseUrl,
} from "@/lib/db/database-url";

export type MarketDataSource = "static" | "db";

export function getMarketDataSource(): MarketDataSource {
  const value = process.env.MARKET_DATA_SOURCE?.toLowerCase();
  return value === "db" ? "db" : "static";
}

export function isDbMarketEnabled(): boolean {
  return getMarketDataSource() === "db";
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "MARKET_DATA_SOURCE=db requires DATABASE_URL in .env.local (Supabase Transaction pooler, port 6543, ?pgbouncer=true).",
    );
  }
  return validateDatabaseUrl(url);
}

export { isDatabaseConnectionError };
