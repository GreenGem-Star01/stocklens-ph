import { describe, expect, it } from "vitest";

import {
  isDatabaseConnectionError,
  isPlaceholderDatabaseUrl,
  parseDatabaseUrl,
  validateDatabaseUrl,
} from "@/lib/db/database-url";

describe("database-url validation", () => {
  it("detects placeholders", () => {
    expect(isPlaceholderDatabaseUrl("postgresql://USER:PASSWORD@HOST.pooler")).toBe(
      true,
    );
  });

  it("rejects region-only pooler host", () => {
    expect(() =>
      validateDatabaseUrl(
        "postgresql://postgres.x:pass@ap-southeast-1.pooler.supabase.com:6543/postgres",
      ),
    ).toThrow(/aws-/);
  });

  it("accepts full Supabase pooler host", () => {
    const url =
      "postgresql://postgres.ref:pass@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    expect(parseDatabaseUrl(url)).toBe(url);
  });

  it("detects connection errors", () => {
    expect(isDatabaseConnectionError({ code: "ENOTFOUND" })).toBe(true);
    expect(isDatabaseConnectionError(new Error("getaddrinfo ENOTFOUND host"))).toBe(
      true,
    );
  });
});
