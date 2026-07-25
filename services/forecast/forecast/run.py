"""
StockLens PH forecast runner (scaffold).

Trains simple baselines on historical closes and maps trends to UI labels:
  - Projected Upward
  - Projected Downward
  - Mixed Signal

Wire output to Postgres when FORECAST_DATA_SOURCE=db in the Next.js app.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass


@dataclass
class ForecastResult:
    ticker: str
    horizon: str
    model: str
    predicted_price: float
    trend_label: str
    mae: float
    rmse: float


def naive_forecast(closes: list[float]) -> float:
    return closes[-1] if closes else 0.0


def moving_average_forecast(closes: list[float], window: int = 5) -> float:
    if not closes:
        return 0.0
    tail = closes[-window:]
    return sum(tail) / len(tail)


def linear_regression_forecast(closes: list[float]) -> float:
    if len(closes) < 2:
        return closes[-1] if closes else 0.0
    n = len(closes)
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(closes) / n
    num = sum((xs[i] - x_mean) * (closes[i] - y_mean) for i in range(n))
    den = sum((xs[i] - x_mean) ** 2 for i in range(n)) or 1.0
    slope = num / den
    intercept = y_mean - slope * x_mean
    return intercept + slope * n


def lstm_forecast(closes: list[float]) -> float:
    """Delegate to lstm.py TinyLSTM when available."""
    try:
        from forecast.lstm import TinyLSTM

        model = TinyLSTM()
        return model.predict(closes, 1)[0]
    except Exception:
        base = linear_regression_forecast(closes)
        if len(closes) >= 2:
            momentum = closes[-1] - closes[-2]
            return base + momentum * 0.5
        return base


def trend_label(last: float, predicted: float) -> str:
    delta = (predicted - last) / last if last else 0.0
    if delta > 0.01:
        return "Projected Upward"
    if delta < -0.01:
        return "Projected Downward"
    return "Mixed Signal"


def run_model(ticker: str, closes: list[float], model: str) -> ForecastResult:
    last = closes[-1]
    if model == "naive":
        pred = naive_forecast(closes)
    elif model == "ma":
        pred = moving_average_forecast(closes)
    elif model == "linear":
        pred = linear_regression_forecast(closes)
    else:
        pred = lstm_forecast(closes)

    errors = [abs(closes[i] - closes[i - 1]) for i in range(1, len(closes))]
    mae = sum(errors) / len(errors) if errors else 0.0
    rmse = (sum(e * e for e in errors) / len(errors)) ** 0.5 if errors else 0.0

    return ForecastResult(
        ticker=ticker,
        horizon="7d",
        model=model,
        predicted_price=round(pred, 2),
        trend_label=trend_label(last, pred),
        mae=round(mae, 2),
        rmse=round(rmse, 2),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run StockLens PH forecasts")
    parser.add_argument(
        "--tickers",
        nargs="+",
        default=["BDO.PS", "JFC.PS", "ALI.PS"],
    )
    parser.add_argument(
        "--models",
        nargs="+",
        default=["naive", "ma", "linear", "lstm"],
    )
    parser.add_argument("--output", default="-", help="JSON file or - for stdout")
    args = parser.parse_args()

    # Demo closes per ticker (replace with DB ingest in production)
    demo_closes: dict[str, list[float]] = {
        "BDO.PS": [134.5, 135.2, 136.0, 135.5, 137.0, 136.8, 137.5, 138.0, 137.8, 138.2, 138.5],
        "JFC.PS": [228, 230, 232, 235, 236, 238, 239, 240, 241, 241.5, 242],
        "ALI.PS": [33.2, 33.0, 32.8, 32.6, 32.5, 32.4, 32.3, 32.2, 32.1, 32.15, 32.15],
    }

    results: list[dict] = []
    for ticker in args.tickers:
        closes = demo_closes.get(ticker, demo_closes["BDO.PS"])
        for model in args.models:
            results.append(asdict(run_model(ticker, closes, model)))

    payload = json.dumps(results, indent=2)
    if args.output == "-":
        print(payload)
    else:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(payload)


if __name__ == "__main__":
    main()
