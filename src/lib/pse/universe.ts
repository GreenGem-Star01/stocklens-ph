import rawUniverse from "../../../data/pse-official-universe.json";
import { ALL_STOCK_SEEDS } from "@/lib/data/stock-seeds";
import { pseOfficialUniverseSchema } from "@/lib/pse/universe-schema";
import type {
  PseListedCompany,
  PseOfficialUniverse,
} from "@/lib/types/pse-universe";

const parsed = pseOfficialUniverseSchema.safeParse(rawUniverse);
if (!parsed.success) {
  throw new Error(
    `Invalid pse-official-universe.json: ${parsed.error.message}`,
  );
}

const universe: PseOfficialUniverse = parsed.data;

const ANALYZED_TICKERS = new Set(
  ALL_STOCK_SEEDS.map((s) => s.ticker.toUpperCase()),
);

export function getPseUniverse(): PseOfficialUniverse {
  return universe;
}

export function getPseMeta() {
  return universe.meta;
}

export function getListedEquities(): PseListedCompany[] {
  return universe.companies.filter((c) => c.status === "listed");
}

export function getPseIndices(): PseListedCompany[] {
  return universe.indices ?? [];
}

export function getAllCatalogEntries(): PseListedCompany[] {
  return [...getListedEquities(), ...getPseIndices()];
}

export function getPseCompanyBySymbol(symbol: string): PseListedCompany | null {
  const upper = symbol.toUpperCase().replace(/\.PS$/i, "");
  return (
    universe.companies.find((c) => c.symbol === upper) ??
    getPseIndices().find((c) => c.symbol === upper) ??
    null
  );
}

export function getPseCompanyByTicker(ticker: string): PseListedCompany | null {
  const normalized = ticker.toUpperCase().includes(".PS")
    ? ticker.toUpperCase()
    : `${ticker.toUpperCase()}.PS`;
  const fromEquities = universe.companies.find((c) => c.ticker === normalized);
  if (fromEquities) return fromEquities;
  return getPseIndices().find((c) => c.ticker === normalized) ?? null;
}

export function getPseCompanyByPath(path: string): PseListedCompany | null {
  const slug = path.toLowerCase().replace(/\.ps$/i, "");
  return (
    universe.companies.find((c) => c.path === slug) ??
    getPseIndices().find((c) => c.path === slug) ??
    null
  );
}

export function isAnalyzedTicker(ticker: string): boolean {
  const normalized = ticker.toUpperCase().includes(".PS")
    ? ticker.toUpperCase()
    : `${ticker.toUpperCase()}.PS`;
  return ANALYZED_TICKERS.has(normalized);
}

export function getPseSectors(): string[] {
  const sectors = new Set(getListedEquities().map((c) => c.sector));
  return Array.from(sectors).sort((a, b) => a.localeCompare(b));
}

export function getSubsectorsForSector(sector: string): string[] {
  const subs = new Set(
    getListedEquities()
      .filter((c) => c.sector === sector)
      .map((c) => c.subsector),
  );
  return Array.from(subs).sort((a, b) => a.localeCompare(b));
}

export function getListedEquityCount(): number {
  return getListedEquities().length;
}

export type OfficialListingLabels = {
  sector: string;
  subsector: string;
};

/** Official PSE EDGE sector labels for a ticker (single taxonomy source). */
export function getOfficialListingLabels(
  ticker: string,
): OfficialListingLabels | null {
  const company = getPseCompanyByTicker(ticker);
  if (!company) return null;
  return {
    sector: company.sector,
    subsector: company.subsector,
  };
}
