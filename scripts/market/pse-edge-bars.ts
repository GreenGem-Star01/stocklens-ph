/**
 * PSE EDGE historical OHLCV (DisclosureCht.ax). Batch ingest only.
 * Yahoo .PS works for PSEi indices only; equities use EDGE chart data.
 */
import type { DailyBar } from "./yahoo-eod";

const DISCLOSURE_CHART_URL =
  "https://edge.pse.com.ph/common/DisclosureCht.ax";

const STOCK_DATA_URL =
  "https://edge.pse.com.ph/mobile/com.pse.ctrl.companyinformation.krx?method=stockdataList";

const USER_AGENT =
  "StockLensPH-ingest/1.0 (educational; PSE EDGE historical)";

type EdgeChartRow = {
  OPEN?: number;
  HIGH?: number;
  LOW?: number;
  CLOSE?: number;
  CHART_DATE?: string;
  VALUE?: number;
};

type EdgeStockRow = {
  SECURITY_ID?: string;
  SYMBOL?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatEdgeDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function parseChartDate(raw: string): string | null {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export async function fetchPseEdgeSecurityId(
  companyId: string,
  symbol: string,
  delayMs = 50,
): Promise<string | null> {
  const body = new URLSearchParams({
    company_id: companyId,
    isApp: "N",
  });

  const res = await fetch(STOCK_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: body.toString(),
  });

  if (delayMs > 0) await sleep(delayMs);
  if (!res.ok) return null;

  const json = (await res.json()) as { list?: EdgeStockRow[] };
  const row =
    json.list?.find(
      (r) => (r.SYMBOL ?? "").toUpperCase() === symbol.toUpperCase(),
    ) ?? json.list?.[0];
  return row?.SECURITY_ID ?? null;
}

export async function fetchPseEdgeHistoricalBars(
  symbol: string,
  companyId: string,
  securityId: string,
  rangeDays: number,
  delayMs = 80,
): Promise<DailyBar[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);

  const res = await fetch(DISCLOSURE_CHART_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      cmpy_id: companyId,
      security_id: securityId,
      startDate: formatEdgeDate(start),
      endDate: formatEdgeDate(end),
    }),
  });

  if (delayMs > 0) await sleep(delayMs);
  if (!res.ok) return [];

  const json = (await res.json()) as { chartData?: EdgeChartRow[] };
  const rows = json.chartData ?? [];
  const bare = symbol.replace(/\.PS$/i, "").toUpperCase();
  const cutoff = start.toISOString().slice(0, 10);
  const bars: DailyBar[] = [];

  for (const row of rows) {
    const close = row.CLOSE;
    if (close == null || Number.isNaN(close)) continue;
    const tradeDate = row.CHART_DATE ? parseChartDate(row.CHART_DATE) : null;
    if (!tradeDate || tradeDate < cutoff) continue;

    bars.push({
      symbol: bare,
      tradeDate,
      open: row.OPEN ?? close,
      high: row.HIGH ?? close,
      low: row.LOW ?? close,
      close,
      volume: null,
    });
  }

  return bars;
}
