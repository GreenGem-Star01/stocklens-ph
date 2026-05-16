const hits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export function rateLimitHeaders(
  result: { ok: true } | { ok: false; retryAfter: number },
): HeadersInit {
  if (result.ok) {
    return { "X-RateLimit-Limit": String(MAX_REQUESTS) };
  }
  return {
    "Retry-After": String(result.retryAfter),
    "X-RateLimit-Limit": String(MAX_REQUESTS),
  };
}
