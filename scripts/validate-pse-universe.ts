/**
 * Validate committed PSE universe + optional market snapshot (CI-safe, no network).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { pseOfficialUniverseSchema } from "../src/lib/pse/universe-schema";

const MIN_LISTINGS = 200;
const MIN_SNAPSHOT_QUOTES = 200;
const EPOCH_PLACEHOLDER = "1970-01-01";

function main(): void {
  const root = process.cwd();
  const universePath = join(root, "data/pse-official-universe.json");
  const raw = JSON.parse(readFileSync(universePath, "utf8"));
  const parsed = pseOfficialUniverseSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("Invalid pse-official-universe.json:", parsed.error.message);
    process.exit(1);
  }

  const { companies, meta } = parsed.data;
  if (companies.length < MIN_LISTINGS) {
    console.error(
      `Expected >= ${MIN_LISTINGS} companies, got ${companies.length}`,
    );
    process.exit(1);
  }

  const symbols = new Set<string>();
  for (const c of companies) {
    if (symbols.has(c.symbol)) {
      console.error(`Duplicate symbol: ${c.symbol}`);
      process.exit(1);
    }
    symbols.add(c.symbol);
    if (!c.sector?.trim() || !c.subsector?.trim()) {
      console.error(`Missing sector/subsector: ${c.symbol}`);
      process.exit(1);
    }
  }

  if (meta.totalListed !== companies.length) {
    console.warn(
      `meta.totalListed (${meta.totalListed}) != companies.length (${companies.length})`,
    );
  }

  console.log(`Universe OK: ${companies.length} listings (as of ${meta.asOf})`);

  const quotesSnapshotPath = join(root, "data/market-quotes-snapshot.json");
  if (!existsSync(quotesSnapshotPath)) {
    console.log("No market-quotes-snapshot.json (optional for CI)");
  } else {
    // File is tracked in git and `import`-ed directly by the app — a missing
    // file is fine (generated on demand), but a present-and-corrupt file
    // means the app will crash at build/runtime, so that must hard-fail here
    // rather than be swallowed as "optional".
    const snapshot = JSON.parse(readFileSync(quotesSnapshotPath, "utf8")) as {
      asOf?: string;
      quotes?: unknown[];
    };
    const count = Array.isArray(snapshot.quotes) ? snapshot.quotes.length : 0;
    if (count < MIN_SNAPSHOT_QUOTES) {
      console.error(
        `market-quotes-snapshot.json has ${count} quotes (expected >= ${MIN_SNAPSHOT_QUOTES})`,
      );
      process.exit(1);
    }
    if (snapshot.asOf?.startsWith(EPOCH_PLACEHOLDER)) {
      console.error("Snapshot asOf is placeholder; run npm run setup:market-data");
      process.exit(1);
    }
    console.log(`Quotes snapshot OK: ${count} quotes (as of ${snapshot.asOf})`);
  }
  // Forecasts snapshot now lives in Supabase Storage, not a local file — see
  // src/lib/market/forecasts-snapshot.ts. Its shape is validated at publish
  // time in scripts/ingest-market-forecasts.ts instead of here.
}

main();
