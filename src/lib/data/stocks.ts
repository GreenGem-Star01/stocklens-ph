import type { ChartPoint, StockAnalysis } from "@/lib/types/stock-analysis";

const models = [
  {
    model: "Naive Baseline",
    mae: "2.45",
    rmse: "3.12",
    mape: "1.78%",
    notes: "Previous day's price",
  },
  {
    model: "Moving Average (5-day)",
    mae: "1.98",
    rmse: "2.54",
    mape: "1.43%",
    notes: "Simple average of last 5 days",
  },
  {
    model: "Linear Regression",
    mae: "1.76",
    rmse: "2.21",
    mape: "1.28%",
    notes: "Trend-based extrapolation",
  },
  {
    model: "LSTM",
    mae: "1.32",
    rmse: "1.67",
    mape: "0.96%",
    notes: "Deep learning sequence model",
  },
];

function buildChart(
  historical: number[],
  forecast: number[],
  startLabel = "May 2",
): ChartPoint[] {
  const dates = [
    "May 2",
    "May 5",
    "May 6",
    "May 7",
    "May 8",
    "May 9",
    "May 12",
    "May 13",
    "May 14",
    "May 15",
    "May 16",
    "May 17",
    "May 18",
    "May 19",
    "May 20",
    "May 21",
    "May 22",
    "May 23",
  ];
  const points: ChartPoint[] = [];
  for (let i = 0; i < historical.length; i++) {
    points.push({
      date: dates[i] ?? startLabel,
      price: historical[i],
      forecast: null,
    });
  }
  for (let j = 0; j < forecast.length; j++) {
    const idx = historical.length + j;
    points.push({
      date: dates[idx] ?? `May ${17 + j}`,
      price: null,
      forecast: forecast[j],
    });
  }
  return points;
}

const bdoChart = buildChart(
  [134.5, 135.2, 136.0, 135.5, 137.0, 136.8, 137.5, 138.0, 137.8, 138.2, 138.5],
  [139.1, 139.5, 140.2, 140.8, 141.2, 141.5, 142.0],
);

const jfcChart = buildChart(
  [228, 230, 232, 235, 236, 238, 239, 240, 241, 241.5, 242],
  [243.5, 244.2, 245.0, 246.1, 247.0, 247.8, 248.5],
);

const aliChart = buildChart(
  [33.2, 33.0, 32.8, 32.6, 32.5, 32.4, 32.3, 32.2, 32.1, 32.15, 32.15],
  [32.0, 31.9, 31.85, 31.82, 31.8, 31.78, 31.75],
);

const telChart = buildChart(
  [1270, 1275, 1278, 1280, 1282, 1283, 1284, 1284.5, 1285, 1285, 1285],
  [1286, 1287, 1288, 1289, 1290, 1291, 1292],
);

const smphChart = buildChart(
  [27.5, 27.8, 28.0, 28.1, 28.3, 28.4, 28.5, 28.6, 28.7, 28.85, 28.9],
  [29.0, 29.1, 29.2, 29.3, 29.4, 29.45, 29.5],
);

const pseiChart = buildChart(
  [6420, 6435, 6440, 6448, 6455, 6460, 6465, 6470, 6475, 6478, 6480],
  [6485, 6490, 6498, 6505, 6510, 6515, 6520],
);

const bdo: StockAnalysis = {
  info: { name: "BDO Unibank, Inc.", ticker: "BDO.PS", sector: "Financials" },
  metrics: {
    lastClose: "₱138.50",
    dailyChange: "+2.3%",
    dailyChangePositive: true,
    volume: "2.4M",
    weekRange: "₱118 - ₱145",
  },
  lastUpdated: "May 16, 2026 at 2:30 PM PST",
  trend: "Projected Upward",
  forecastTarget: "₱142.00",
  chartData: bdoChart,
  chartDomain: [133, 143],
  forecastStartDate: "May 16",
  performance: {
    mae: "1.32",
    rmse: "1.67",
    mape: "0.96%",
    directionalAccuracy: "68%",
  },
  modelComparison: models,
  aiInsight: {
    summary:
      "The LSTM forecast suggests a slight upward movement over the next 7 trading days, with the price expected to rise from ₱138.50 to approximately ₱142.00.",
    caution:
      "The model's performance (MAE: 1.32, Directional Accuracy: 68%) indicates moderate confidence. Interpret cautiously and do not use as the sole basis for investment decisions.",
    context:
      "The forecast aligns with recent positive momentum in the financials sector, but market conditions can change rapidly.",
  },
  marketContext: {
    disclosures: [
      "May 14: Q1 2026 earnings report filed - Net income up 8.5% YoY",
      "May 10: Board meeting scheduled for dividend declaration",
      "May 5: Updated corporate governance manual submitted",
    ],
    pseiIndex: "6,480",
    pseiChange: "+0.3%",
    pseiPositive: true,
    sectorNote:
      "Financials have shown resilience this month, with banking stocks benefiting from stable rates and improved loan growth. Sector average: +1.8% this week.",
  },
};

const jfc: StockAnalysis = {
  info: {
    name: "Jollibee Foods Corporation",
    ticker: "JFC.PS",
    sector: "Consumer",
  },
  metrics: {
    lastClose: "₱242.00",
    dailyChange: "+1.8%",
    dailyChangePositive: true,
    volume: "1.1M",
    weekRange: "₱210 - ₱255",
  },
  lastUpdated: "May 16, 2026 at 2:30 PM PST",
  trend: "Projected Upward",
  forecastTarget: "₱248.50",
  chartData: jfcChart,
  chartDomain: [225, 252],
  forecastStartDate: "May 16",
  performance: {
    mae: "2.10",
    rmse: "2.85",
    mape: "1.12%",
    directionalAccuracy: "64%",
  },
  modelComparison: models.map((m) =>
    m.model === "LSTM"
      ? { ...m, mae: "2.10", rmse: "2.85", mape: "1.12%" }
      : m,
  ),
  aiInsight: {
    summary:
      "JFC shows steady consumer demand with the LSTM model projecting continued upside toward ₱248.50 over the next week.",
    caution:
      "Food service margins remain sensitive to commodity costs; forecast confidence is moderate (Directional Accuracy: 64%).",
    context:
      "Same-store sales growth in domestic markets supports the upward projection, though regional expansion costs may add volatility.",
  },
  marketContext: {
    disclosures: [
      "May 13: Store expansion update for Visayas region",
      "May 8: Dividend record date announced",
    ],
    pseiIndex: "6,480",
    pseiChange: "+0.3%",
    pseiPositive: true,
    sectorNote:
      "Consumer discretionary names are outperforming on resilient domestic spending. Sector average: +1.2% this week.",
  },
};

const ali: StockAnalysis = {
  info: { name: "Ayala Land, Inc.", ticker: "ALI.PS", sector: "Real Estate" },
  metrics: {
    lastClose: "₱32.15",
    dailyChange: "-0.5%",
    dailyChangePositive: false,
    volume: "3.8M",
    weekRange: "₱28 - ₱36",
  },
  lastUpdated: "May 16, 2026 at 2:30 PM PST",
  trend: "Projected Downward",
  forecastTarget: "₱31.80",
  chartData: aliChart,
  chartDomain: [31, 34],
  forecastStartDate: "May 16",
  performance: {
    mae: "0.42",
    rmse: "0.58",
    mape: "1.35%",
    directionalAccuracy: "61%",
  },
  modelComparison: models,
  aiInsight: {
    summary:
      "ALI's forecast points to mild downward pressure, with prices potentially easing from ₱32.15 toward ₱31.80.",
    caution:
      "Real estate names are rate-sensitive; small absolute errors still matter at lower price levels.",
    context:
      "Residential pre-sales have softened in select metros, weighing on near-term sentiment for property developers.",
  },
  marketContext: {
    disclosures: [
      "May 12: New township project groundbreaking in Laguna",
      "May 6: Property sales bulletin for Q1 2026",
    ],
    pseiIndex: "6,480",
    pseiChange: "+0.3%",
    pseiPositive: true,
    sectorNote:
      "Property developers are mixed as rate-cut expectations shift. Sector average: -0.4% this week.",
  },
};

const tel: StockAnalysis = {
  info: { name: "PLDT Inc.", ticker: "TEL.PS", sector: "Telecom" },
  metrics: {
    lastClose: "₱1,285.00",
    dailyChange: "+0.9%",
    dailyChangePositive: true,
    volume: "0.2M",
    weekRange: "₱1,180 - ₱1,320",
  },
  lastUpdated: "May 16, 2026 at 2:30 PM PST",
  trend: "Mixed Signal",
  forecastTarget: "₱1,290.00",
  chartData: telChart,
  chartDomain: [1268, 1295],
  forecastStartDate: "May 16",
  performance: {
    mae: "8.50",
    rmse: "11.20",
    mape: "0.68%",
    directionalAccuracy: "59%",
  },
  modelComparison: models,
  aiInsight: {
    summary:
      "TEL exhibits a flat-to-slightly-positive pattern with the model projecting a narrow band around ₱1,290.",
    caution:
      "Directional accuracy is below 60%, signaling limited conviction—treat as a Mixed Signal environment.",
    context:
      "Fiber rollout capex and dividend yield support the stock, but competition in mobile data caps upside.",
  },
  marketContext: {
    disclosures: [
      "May 11: Network modernization capex guidance reaffirmed",
      "May 4: Quarterly subscriber metrics released",
    ],
    pseiIndex: "6,480",
    pseiChange: "+0.3%",
    pseiPositive: true,
    sectorNote:
      "Telecoms are range-bound with stable cash flows. Sector average: +0.5% this week.",
  },
};

const smph: StockAnalysis = {
  info: {
    name: "SM Prime Holdings, Inc.",
    ticker: "SMPH.PS",
    sector: "Real Estate",
  },
  metrics: {
    lastClose: "₱28.90",
    dailyChange: "+1.2%",
    dailyChangePositive: true,
    volume: "5.2M",
    weekRange: "₱25 - ₱31",
  },
  lastUpdated: "May 16, 2026 at 2:30 PM PST",
  trend: "Projected Upward",
  forecastTarget: "₱29.50",
  chartData: smphChart,
  chartDomain: [27, 31],
  forecastStartDate: "May 16",
  performance: {
    mae: "0.38",
    rmse: "0.52",
    mape: "1.41%",
    directionalAccuracy: "66%",
  },
  modelComparison: models,
  aiInsight: {
    summary:
      "Mall foot traffic recovery supports a modest upside path for SMPH toward ₱29.50.",
    caution:
      "Retail REIT flows and lease renewals remain key swing factors for the forecast.",
    context:
      "Provincial mall openings and cinema attendance trends are improving quarter over quarter.",
  },
  marketContext: {
    disclosures: [
      "May 15: Mall occupancy rate update for Metro Manila",
      "May 9: Sustainability bond allocation report",
    ],
    pseiIndex: "6,480",
    pseiChange: "+0.3%",
    pseiPositive: true,
    sectorNote:
      "Mall operators are benefiting from higher consumer traffic. Sector average: +0.9% this week.",
  },
};

const psei: StockAnalysis = {
  info: { name: "PSEi Index", ticker: "PSEI.PS", sector: "Index" },
  metrics: {
    lastClose: "6,480",
    dailyChange: "+0.3%",
    dailyChangePositive: true,
    volume: "—",
    weekRange: "6,200 - 6,550",
  },
  lastUpdated: "May 16, 2026 at 2:30 PM PST",
  trend: "Projected Upward",
  forecastTarget: "6,520",
  chartData: pseiChart,
  chartDomain: [6410, 6530],
  forecastStartDate: "May 16",
  performance: {
    mae: "12.50",
    rmse: "16.80",
    mape: "0.19%",
    directionalAccuracy: "62%",
  },
  modelComparison: models,
  aiInsight: {
    summary:
      "The PSEi benchmark is projected to grind higher toward 6,520 as breadth improves across large caps.",
    caution:
      "Index-level forecasts aggregate diverse sectors; macro shocks can invalidate short-horizon models quickly.",
    context:
      "Foreign fund flows turned mildly positive this week, supporting index-level momentum.",
  },
  marketContext: {
    disclosures: [
      "May 16: Market-wide trading summary published",
      "May 14: Sector performance bulletin",
    ],
    pseiIndex: "6,480",
    pseiChange: "+0.3%",
    pseiPositive: true,
    sectorNote:
      "Index breadth is improving with financials and industrials leading advancers.",
  },
};

const stockCatalog: Record<string, StockAnalysis> = {
  "BDO.PS": bdo,
  "JFC.PS": jfc,
  "ALI.PS": ali,
  "TEL.PS": tel,
  "SMPH.PS": smph,
  "PSEI.PS": psei,
};

export function getStockAnalysisStatic(ticker: string): StockAnalysis | null {
  return stockCatalog[ticker] ?? null;
}

export function getAllStockAnalyses(): StockAnalysis[] {
  return Object.values(stockCatalog);
}
