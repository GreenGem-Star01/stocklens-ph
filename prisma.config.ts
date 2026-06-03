// Prisma 7: connection URLs live here, not in schema.prisma.
// See https://pris.ly/d/config-datasource
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

config();
if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrate needs a direct Postgres URL (Supabase: use DIRECT_URL, not PgBouncer :6543).
    url: env("DIRECT_URL"),
  },
});
