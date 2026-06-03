/**
 * Sync listed companies from PSE EDGE (free, PSE-operated directory).
 * Run: npm run sync:pse
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { ALL_STOCK_SEEDS } from "../src/lib/data/stock-seeds";
import type { PseOfficialUniverse } from "../src/lib/types/pse-universe";
import {
  parseCompaniesFromHtml,
  parseTotalFromHtml,
} from "./parse-pse-edge-html";

const EDGE_SEARCH_URL = "https://edge.pse.com.ph/companyDirectory/search.ax";
const MIN_LISTINGS = 200;
const PAGE_DELAY_MS = 250;
const MAX_PAGES = 20;

const analyzedTickers = new Set(
  ALL_STOCK_SEEDS.map((s) => s.ticker.toUpperCase()),
);

async function fetchPage(pageNo: number): Promise<string> {
  const body = new URLSearchParams({
    pageNo: String(pageNo),
    keyword: "",
    sector: "ALL",
    subsector: "ALL",
    sortType: "",
    dateSortType: "DESC",
    cmpySortType: "ASC",
    symbolSortType: "ASC",
  });

  const res = await fetch(EDGE_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "StockLensPH-sync/1.0 (educational; +https://github.com/GreenGem-Star01/stocklens-ph)",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`PSE EDGE HTTP ${res.status} on page ${pageNo}`);
  }
  return res.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllListings(): Promise<{
  companies: ReturnType<typeof parseCompaniesFromHtml>;
  totalReported: number;
}> {
  const bySymbol = new Map<
    string,
    ReturnType<typeof parseCompaniesFromHtml>[number]
  >();
  let totalReported = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await fetchPage(page);
    if (page === 1) {
      totalReported = parseTotalFromHtml(html) ?? 0;
    }

    const batch = parseCompaniesFromHtml(html, analyzedTickers);
    let added = 0;
    for (const company of batch) {
      if (!bySymbol.has(company.symbol)) {
        bySymbol.set(company.symbol, company);
        added++;
      }
    }

    console.log(`Page ${page}: +${added} new (${bySymbol.size} total)`);

    if (added === 0 && page > 1) break;
    if (totalReported > 0 && bySymbol.size >= totalReported) break;
    await sleep(PAGE_DELAY_MS);
  }

  return {
    companies: [...bySymbol.values()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol),
    ),
    totalReported,
  };
}

function buildPseiIndex(): PseOfficialUniverse["indices"] {
  const psei = ALL_STOCK_SEEDS.find((s) => s.ticker === "PSEI.PS");
  if (!psei) return undefined;
  return [
    {
      symbol: "PSEI",
      ticker: "PSEI.PS",
      path: "psei",
      companyName: psei.name,
      sector: "Index",
      subsector: "Composite Index",
      status: "listed",
      hasAnalysis: true,
    },
  ];
}

async function main() {
  console.log("Fetching PSE EDGE listed company directory...");
  const { companies, totalReported } = await fetchAllListings();

  if (companies.length < MIN_LISTINGS) {
    throw new Error(
      `Only ${companies.length} listings parsed (expected >= ${MIN_LISTINGS}). EDGE HTML format may have changed.`,
    );
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const universe: PseOfficialUniverse = {
    meta: {
      asOf,
      source: "PSE EDGE Listed Company Directory",
      sourceUrl: "https://edge.pse.com.ph/companyDirectory/",
      sectorGuideUrl:
        "https://documents.pse.com.ph/wp-content/uploads/sites/15/2022/01/PSE-Sector-Classification-Guide.pdf",
      totalListed: companies.length,
    },
    companies,
    indices: buildPseiIndex(),
  };

  const outPath = join(process.cwd(), "data", "pse-official-universe.json");
  writeFileSync(outPath, `${JSON.stringify(universe, null, 2)}\n`, "utf8");

  const bySector = new Map<string, number>();
  for (const c of companies) {
    bySector.set(c.sector, (bySector.get(c.sector) ?? 0) + 1);
  }

  console.log(`\nWrote ${companies.length} listings to ${outPath}`);
  console.log(`PSE EDGE reported total: ${totalReported}`);
  console.log(`With demo analysis: ${companies.filter((c) => c.hasAnalysis).length}`);

  const bySymbol = new Map(companies.map((c) => [c.symbol, c]));
  let sectorMismatches = 0;
  for (const seed of ALL_STOCK_SEEDS) {
    if (seed.ticker === "PSEI.PS") continue;
    const symbol = seed.ticker.replace(/\.PS$/i, "");
    const listed = bySymbol.get(symbol);
    if (!listed) continue;
    if (listed.sector !== seed.sector) {
      sectorMismatches++;
      console.warn(
        `  Sector mismatch ${symbol}: seed="${seed.sector}" official="${listed.sector}"`,
      );
    }
  }
  if (sectorMismatches > 0) {
    console.warn(
      `\n${sectorMismatches} analyzed seed(s) use non-official sector labels (app uses official from universe).`,
    );
  }

  console.log("\nBy sector:");
  for (const [sector, count] of [...bySector.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`  ${sector}: ${count}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
