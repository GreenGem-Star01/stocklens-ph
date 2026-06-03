import { getPseSectors } from "@/lib/pse/universe";

export function sectorToSlug(sector: string): string {
  return sector
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugToSector(slug: string): string | null {
  const normalized = slug.toLowerCase();
  const match = getPseSectors().find((s) => sectorToSlug(s) === normalized);
  return match ?? null;
}

export function getAllSectorSlugs(): { slug: string; sector: string }[] {
  return getPseSectors().map((sector) => ({
    slug: sectorToSlug(sector),
    sector,
  }));
}

/** Canonical browse URL: slug route for a sector, query params for search/subsector only. */
export function buildStocksBrowseUrl(options: {
  sector?: string;
  subsector?: string;
  query?: string;
}): string {
  const params = new URLSearchParams();
  const q = options.query?.trim() ?? "";
  const sector = options.sector ?? "all";
  const subsector = options.subsector ?? "all";

  if (q) params.set("q", q);
  if (subsector !== "all" && sector !== "all") {
    params.set("subsector", subsector);
  }

  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";

  if (sector === "all") {
    return `/stocks${suffix}`;
  }

  const slug = sectorToSlug(sector);
  if (!slugToSector(slug)) {
    params.set("sector", sector);
    return `/stocks?${params.toString()}`;
  }

  return `/stocks/sector/${slug}${suffix}`;
}
