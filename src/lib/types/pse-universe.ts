export type PseListingStatus = "listed" | "delisted";

export type PseListedCompany = {
  symbol: string;
  ticker: string;
  path: string;
  companyName: string;
  sector: string;
  subsector: string;
  sectorCode?: string;
  subsectorCode?: string;
  board?: string;
  status: PseListingStatus;
  listingDate?: string;
  companyId?: string;
  edgeCompanyUrl?: string;
  hasAnalysis: boolean;
};

export type PseUniverseMeta = {
  asOf: string;
  source: string;
  sourceUrl: string;
  sectorGuideUrl: string;
  totalListed: number;
};

export type PseOfficialUniverse = {
  meta: PseUniverseMeta;
  companies: PseListedCompany[];
  indices?: PseListedCompany[];
};
