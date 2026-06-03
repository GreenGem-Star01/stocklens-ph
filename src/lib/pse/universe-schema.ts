import { z } from "zod";

export const pseListedCompanySchema = z.object({
  symbol: z.string().min(1),
  ticker: z.string().min(1),
  path: z.string().min(1),
  companyName: z.string().min(1),
  sector: z.string().min(1),
  subsector: z.string().min(1),
  sectorCode: z.string().optional(),
  subsectorCode: z.string().optional(),
  board: z.string().optional(),
  status: z.enum(["listed", "delisted"]),
  listingDate: z.string().optional(),
  companyId: z.string().optional(),
  edgeCompanyUrl: z.string().url().optional(),
  hasAnalysis: z.boolean(),
});

export const pseOfficialUniverseSchema = z.object({
  meta: z.object({
    asOf: z.string(),
    source: z.string(),
    sourceUrl: z.string().url(),
    sectorGuideUrl: z.string().url(),
    totalListed: z.number().int().positive(),
  }),
  companies: z.array(pseListedCompanySchema).min(1),
  indices: z.array(pseListedCompanySchema).optional(),
});
