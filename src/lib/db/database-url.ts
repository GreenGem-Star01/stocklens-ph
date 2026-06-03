const PLACEHOLDER_MARKERS = [
  "HOST.pooler",
  "USER:PASSWORD",
  "REPLACE_ME",
  "INGEST_USER",
  "READONLY_USER",
  "[YOUR-PASSWORD]",
  "YOUR_PASSWORD",
  "YOUR_REGION",
] as const;

/** Region slug used alone as hostname (invalid — needs aws-N- prefix). */
const REGION_ONLY_POOLER =
  /^postgresql:\/\/[^@]+@([a-z]{2}-[a-z]+-\d)\.pooler\.supabase\.com/i;

export function isPlaceholderDatabaseUrl(url: string): boolean {
  return PLACEHOLDER_MARKERS.some((m) => url.includes(m));
}

export function isInvalidSupabasePoolerHost(url: string): string | null {
  const match = url.match(REGION_ONLY_POOLER);
  if (match) {
    return (
      `DATABASE_URL host "${match[1]}.pooler.supabase.com" is invalid. ` +
      `Copy the full Supabase pooler host from Settings → Database ` +
      `(e.g. aws-1-${match[1]}.pooler.supabase.com), not the region slug alone.`
    );
  }

  if (url.includes("pooler.supabase.com") && !url.includes("aws-")) {
    return (
      "DATABASE_URL must include the aws-N- prefix in the Supabase pooler hostname " +
      "(e.g. aws-1-ap-southeast-1.pooler.supabase.com)."
    );
  }

  return null;
}

export function validateDatabaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase pooler URL to .env.local (port 6543, ?pgbouncer=true).",
    );
  }
  if (isPlaceholderDatabaseUrl(trimmed)) {
    throw new Error(
      "DATABASE_URL is still a placeholder. In Supabase: Settings → Database → Connection string (Transaction pooler, port 6543).",
    );
  }

  const hostError = isInvalidSupabasePoolerHost(trimmed);
  if (hostError) {
    throw new Error(hostError);
  }

  return trimmed;
}

export function parseDatabaseUrl(url: string): string {
  return validateDatabaseUrl(url);
}

export function isDatabaseConnectionError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const code = (err as { code?: string }).code;
    if (code === "ENOTFOUND" || code === "ETIMEDOUT" || code === "ECONNREFUSED") {
      return true;
    }
  }
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED") ||
    message.includes("getaddrinfo")
  );
}
