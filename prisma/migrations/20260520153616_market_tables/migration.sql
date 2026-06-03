-- CreateTable
CREATE TABLE "market_quotes_latest" (
    "symbol" TEXT NOT NULL,
    "last_close" DECIMAL(18,6) NOT NULL,
    "change_pct" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "change_abs" DECIMAL(18,6),
    "volume" BIGINT,
    "as_of" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'dss',

    CONSTRAINT "market_quotes_latest_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "market_bars_daily" (
    "symbol" TEXT NOT NULL,
    "trade_date" DATE NOT NULL,
    "open" DECIMAL(18,6) NOT NULL,
    "high" DECIMAL(18,6) NOT NULL,
    "low" DECIMAL(18,6) NOT NULL,
    "close" DECIMAL(18,6) NOT NULL,
    "volume" BIGINT,

    CONSTRAINT "market_bars_daily_pkey" PRIMARY KEY ("symbol","trade_date")
);

-- CreateIndex
CREATE INDEX "market_quotes_latest_as_of_idx" ON "market_quotes_latest"("as_of" DESC);

-- CreateIndex
CREATE INDEX "market_bars_daily_symbol_date_idx" ON "market_bars_daily"("symbol", "trade_date" DESC);
