/** PSE universe uses bare symbols (BDO); app tickers use BDO.PS */
export function tickerToSymbol(ticker: string): string {
  return ticker.toUpperCase().replace(/\.PS$/i, "");
}

export function symbolToTicker(symbol: string): string {
  const upper = symbol.toUpperCase();
  return upper.includes(".PS") ? upper : `${upper}.PS`;
}
