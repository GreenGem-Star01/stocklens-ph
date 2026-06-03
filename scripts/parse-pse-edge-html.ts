import type { PseListedCompany } from "../src/lib/types/pse-universe";

const CM_DETAIL_REGEX = /cmDetail\('(\d+)','(\d+)'\)/;

export function parseTotalFromHtml(html: string): number | null {
  const match = html.match(/\[Total\s+(\d+)\]/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, "").trim());
}

function parseRow(
  rowHtml: string,
  analyzedTickers: Set<string>,
): PseListedCompany | null {
  if (!rowHtml.includes("<td")) return null;

  const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
  if (cells.length < 5) return null;

  const companyCell = cells[0][1];
  const symbolCell = cells[1][1];
  const sector = stripTags(cells[2][1]);
  const subsector = stripTags(cells[3][1]);
  const listingDate = stripTags(cells[4][1]);

  const symbol = stripTags(symbolCell).toUpperCase();
  const companyName = stripTags(companyCell);

  if (!symbol || !companyName || !sector) return null;

  const detailMatch =
    companyCell.match(CM_DETAIL_REGEX) ?? symbolCell.match(CM_DETAIL_REGEX);
  const companyId = detailMatch?.[1];

  const ticker = `${symbol}.PS`;

  return {
    symbol,
    ticker,
    path: symbol.toLowerCase(),
    companyName,
    sector,
    subsector: subsector || sector,
    status: "listed",
    listingDate: listingDate || undefined,
    companyId: companyId || undefined,
    edgeCompanyUrl: companyId
      ? `https://edge.pse.com.ph/companyPage/stock_information.ax?cmpy_id=${companyId}`
      : undefined,
    hasAnalysis: analyzedTickers.has(ticker),
  };
}

export function parseCompaniesFromHtml(
  html: string,
  analyzedTickers: Set<string>,
): PseListedCompany[] {
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];

  const rows = tbodyMatch[1].split(/<\/tr>/i);
  const companies: PseListedCompany[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const company = parseRow(row, analyzedTickers);
    if (!company || seen.has(company.symbol)) continue;
    seen.add(company.symbol);
    companies.push(company);
  }

  return companies.sort((a, b) => a.symbol.localeCompare(b.symbol));
}
