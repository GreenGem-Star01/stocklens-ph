/**
 * Batch EOD quotes ingest → market_quotes_latest + optional snapshot
 * Run: npm run setup:market-data
 * Source: PSE EDGE (default) or --source=yahoo
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import universe from "../data/pse-official-universe.json";
import { closeIngestPool, getIngestPool } from "./lib/db-ingest";
import { fetchPseiIndexQuote } from "./market/pse-edge-index";
import {
  fetchPseEdgeQuotes,
  type EdgeQuoteInput,
} from "./market/pse-edge-quotes";
import { fetchYahooEodQuotes } from "./market/yahoo-eod";
import type { EodQuote } from "./market/yahoo-eod";

const MIN_QUOTES = 200;
const SOURCE_PSE = "pse_edge_eod";
const SOURCE_PSE_INDEX = "pse_edge_index_summary";
const SOURCE_YAHOO = "yahoo_finance_eod";

async function upsertQuotes(
  quotes: Awaited<ReturnType<typeof fetchPseEdgeQuotes>>,
  source: string,
): Promise<number> {
  const pool = getIngestPool();
  let written = 0;

  for (const q of quotes) {
    await pool.query(
      `INSERT INTO market_quotes_latest
         (symbol, last_close, change_pct, change_abs, volume, as_of, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (symbol) DO UPDATE SET
         last_close = EXCLUDED.last_close,
         change_pct = EXCLUDED.change_pct,
         change_abs = EXCLUDED.change_abs,
         volume = EXCLUDED.volume,
         as_of = EXCLUDED.as_of,
         source = EXCLUDED.source`,
      [
        q.symbol,
        q.lastClose,
        q.changePct,
        q.changeAbs,
        q.volume,
        q.asOf.toISOString(),
        source,
      ],
    );
    written++;
  }

  return written;
}

function writeSnapshot(
  quotes: EodQuote[],
  source: string,
  indexQuote?: EodQuote | null,
): void {
  const asOf =
    quotes.reduce(
      (max, q) => (q.asOf > max ? q.asOf : max),
      new Date(0),
    ) || new Date();

  const quoteRows = quotes.map((q) => ({
    symbol: q.symbol,
    lastClose: q.lastClose,
    changePct: q.changePct,
    changeAbs: q.changeAbs,
    volume: q.volume,
    asOf: q.asOf.toISOString(),
    source,
  }));

  if (indexQuote) {
    const existing = quoteRows.findIndex((r) => r.symbol === "PSEI");
    const row = {
      symbol: "PSEI",
      lastClose: indexQuote.lastClose,
      changePct: indexQuote.changePct,
      changeAbs: indexQuote.changeAbs,
      volume: indexQuote.volume,
      asOf: indexQuote.asOf.toISOString(),
      source: SOURCE_PSE_INDEX,
    };
    if (existing >= 0) quoteRows[existing] = row;
    else quoteRows.push(row);
  }

  const payload = {
    asOf: asOf.toISOString(),
    source,
    quotes: quoteRows,
  };

  const outPath = join(process.cwd(), "data/market-quotes-snapshot.json");
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote snapshot: ${outPath} (${quotes.length} quotes)`);
}

async function main(): Promise<void> {
  const writeSnapshotFlag = process.argv.includes("--write-snapshot");
  const useYahoo = process.argv.includes("--source=yahoo");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const companies = universe.companies.filter(
    (c) => c.status === "listed" && c.companyId,
  );

  let inputs: EdgeQuoteInput[] = companies.map((c) => ({
    symbol: c.symbol,
    companyId: c.companyId!,
  }));

  const indices = (universe as { indices?: Array<{ symbol: string; companyId?: string }> })
    .indices;
  if (indices) {
    for (const idx of indices) {
      if (idx.companyId && !inputs.some((i) => i.symbol === idx.symbol)) {
        inputs.push({ symbol: idx.symbol, companyId: idx.companyId });
      }
    }
  }

  if (limit && limit > 0) inputs = inputs.slice(0, limit);

  const source = useYahoo ? SOURCE_YAHOO : SOURCE_PSE;
  console.log(
    `Fetching EOD quotes for ${inputs.length} symbols (${source})...`,
  );

  let quotes: EodQuote[] = useYahoo
    ? await fetchYahooEodQuotes(
        inputs.map((i) => i.symbol),
        {
          delayMs: 80,
          concurrency: 8,
          onProgress: (done, total) => {
            if (done % 25 === 0 || done === total) {
              console.log(`  ${done}/${total}`);
            }
          },
        },
      )
    : await fetchPseEdgeQuotes(inputs, {
        delayMs: 50,
        concurrency: 10,
        onProgress: (done, total) => {
          if (done % 25 === 0 || done === total) {
            console.log(`  ${done}/${total}`);
          }
        },
      });

  let indexQuote: EodQuote | null = null;
  if (!useYahoo) {
    console.log("Fetching PSEi from EDGE index summary...");
    indexQuote = await fetchPseiIndexQuote();
    if (indexQuote) {
      console.log(
        `  PSEI ${indexQuote.lastClose.toLocaleString("en-PH")} (${indexQuote.changePct >= 0 ? "+" : ""}${indexQuote.changePct.toFixed(2)}%)`,
      );
    } else {
      console.warn("  PSEI index quote unavailable from EDGE index summary");
    }
  }

  console.log(`Fetched ${quotes.length} equity quotes`);

  if (process.env.DATABASE_URL) {
    const written = await upsertQuotes(quotes, source);
    if (indexQuote) {
      await upsertQuotes([indexQuote], SOURCE_PSE_INDEX);
    }
    console.log(
      `Upserted ${written}${indexQuote ? " + PSEI" : ""} rows to market_quotes_latest`,
    );
    await closeIngestPool();
  } else {
    console.warn("DATABASE_URL not set — skipping DB upsert");
  }

  if (writeSnapshotFlag || !process.env.DATABASE_URL) {
    writeSnapshot(quotes, source, indexQuote);
  }

  const totalCount = quotes.length + (indexQuote ? 1 : 0);
  if (totalCount < MIN_QUOTES && !limit) {
    console.error(
      `Expected at least ${MIN_QUOTES} quotes, got ${totalCount}`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
