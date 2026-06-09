import { readFileSync } from "node:fs";
import { join } from "node:path";

type UniverseRow = {
  symbol: string;
  status?: string;
  companyId?: string;
};

/** Listed equities + PSEi index symbol for bars/forecast ingest. */
export function loadIngestSymbols(): string[] {
  const path = join(process.cwd(), "data/pse-official-universe.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    companies?: UniverseRow[];
    indices?: UniverseRow[];
  };

  const equities = (raw.companies ?? [])
    .filter((c) => c.status === "listed" && c.companyId)
    .map((c) => c.symbol.toUpperCase());

  const indices = (raw.indices ?? [])
    .filter((c) => c.companyId)
    .map((c) => c.symbol.toUpperCase());

  const symbols = [...new Set([...indices, ...equities])];
  return symbols.sort((a, b) => {
    if (a === "PSEI") return -1;
    if (b === "PSEI") return 1;
    return a.localeCompare(b);
  });
}

export function loadCompanyIdBySymbol(): Map<string, string> {
  const path = join(process.cwd(), "data/pse-official-universe.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    companies?: UniverseRow[];
    indices?: UniverseRow[];
  };
  const map = new Map<string, string>();
  for (const row of [...(raw.companies ?? []), ...(raw.indices ?? [])]) {
    if (row.companyId) {
      map.set(row.symbol.toUpperCase(), row.companyId);
    }
  }
  return map;
}
