/**
 * PSEi composite index quote from PSE EDGE Index Summary (not stockdataList).
 */
import type { EodQuote } from "./yahoo-eod";

const INDEX_SUMMARY_URL = "https://edge.pse.com.ph/index/form.do";

const USER_AGENT =
  "StockLensPH-ingest/1.0 (educational; PSE EDGE index summary)";

const PSEI_ROW_RE =
  /<td class="label">PSEi<\/td>\s*<td class="alignR">([^<]+)<\/td>\s*<td class="alignR" style="color:([^"]+)">\s*([^<]+)<\/td>\s*<td class="alignR" style="color:([^"]+)">\s*([^<]+)<\/td>/;

function parseNumber(raw: string): number {
  return Number.parseFloat(raw.replace(/[₱,\s▼▲]/g, "")) || 0;
}

/** EDGE index page: red = up, green = down (Philippine convention). */
function signedChange(changeAbs: number, color: string): number {
  const c = color.toLowerCase();
  if (c === "green") return -Math.abs(changeAbs);
  return Math.abs(changeAbs);
}

export function parsePseiIndexFromHtml(html: string): EodQuote | null {
  const match = html.match(PSEI_ROW_RE);
  if (!match) return null;

  const lastClose = parseNumber(match[1]!);
  const changeAbs = signedChange(parseNumber(match[3]!), match[2]!);
  const changePctRaw = match[5]!.replace(/[▼▲]/g, "").trim();
  const changePct = parseNumber(changePctRaw);
  const signedPct =
    match[4]!.toLowerCase() === "green" ? -Math.abs(changePct) : Math.abs(changePct);

  if (!lastClose) return null;

  const prev = lastClose - changeAbs;
  const asOf = new Date();

  return {
    symbol: "PSEI",
    lastClose,
    changePct: signedPct,
    changeAbs,
    volume: null,
    asOf,
  };
}

export async function fetchPseiIndexQuote(): Promise<EodQuote | null> {
  const res = await fetch(INDEX_SUMMARY_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  const html = await res.text();
  return parsePseiIndexFromHtml(html);
}
