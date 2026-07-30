import { query } from "@/lib/db/client";
import { isDbMarketEnabled } from "@/lib/db/config";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

// Fallback used when the DB isn't configured (MARKET_DATA_SOURCE=static,
// local dev without a database) or a DB call fails, so a rate-limit check
// never 500s a route. On Vercel's serverless Node runtime this only holds
// within a single warm instance — a cold-started instance gets its own
// empty Map — which is exactly why the DB-backed path below is what
// actually enforces the limit in production.
const memoryHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(key: string): RateLimitResult {
  const now = Date.now();
  const entry = memoryHits.get(key);

  if (!entry || now > entry.resetAt) {
    memoryHits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

// Single atomic UPSERT — the row-level lock Postgres takes during the
// ON CONFLICT UPDATE serializes concurrent requests for the same key, so
// this doesn't need separate read-then-write steps to avoid a race.
async function checkRateLimitInDb(key: string): Promise<RateLimitResult> {
  const rows = await query<{ count: number; reset_at: Date }>(
    `INSERT INTO rate_limits (key, count, reset_at)
     VALUES ($1, 1, NOW() + INTERVAL '60 seconds')
     ON CONFLICT (key) DO UPDATE SET
       count = CASE
         WHEN rate_limits.reset_at < NOW() THEN 1
         ELSE rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN rate_limits.reset_at < NOW() THEN NOW() + INTERVAL '60 seconds'
         ELSE rate_limits.reset_at
       END
     RETURNING count, reset_at`,
    [key],
  );

  const row = rows[0];
  if (!row) return { ok: true };

  if (row.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil(
      (new Date(row.reset_at).getTime() - Date.now()) / 1000,
    );
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }
  return { ok: true };
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (!isDbMarketEnabled()) {
    return checkRateLimitInMemory(key);
  }
  try {
    return await checkRateLimitInDb(key);
  } catch {
    return checkRateLimitInMemory(key);
  }
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  if (result.ok) {
    return { "X-RateLimit-Limit": String(MAX_REQUESTS) };
  }
  return {
    "Retry-After": String(result.retryAfter),
    "X-RateLimit-Limit": String(MAX_REQUESTS),
  };
}
