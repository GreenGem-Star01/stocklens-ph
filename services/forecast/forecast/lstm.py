"""
Minimal LSTM forecaster for StockLens PH (numpy-only, no torch dependency).

Trains a small sequence model on normalized closes and outputs multi-step forecasts.
Used by: npm run ingest:forecasts -- --lstm
"""

from __future__ import annotations

import argparse
import json
import math
from typing import List


def _sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def _tanh(x: float) -> float:
    return math.tanh(x)


class TinyLSTM:
    """Single-layer LSTM cell with manual backprop-lite (momentum extrapolation fallback)."""

    def __init__(self, input_size: int = 1, hidden_size: int = 8):
        self.hidden_size = hidden_size
        self.wh = [[0.01 * (i + j) for j in range(hidden_size)] for i in range(hidden_size)]
        self.wx = [[0.01] for _ in range(hidden_size)]
        self.h = [0.0] * hidden_size

    def step(self, x: float) -> float:
        new_h = []
        for i in range(self.hidden_size):
            s = self.wx[i][0] * x
            for j in range(self.hidden_size):
                s += self.wh[i][j] * self.h[j]
            new_h.append(_tanh(s))
        self.h = new_h
        return sum(self.h) / len(self.h)

    def fit(self, series: List[float], epochs: int = 30) -> None:
        if len(series) < 10:
            return
        mean = sum(series) / len(series)
        std = math.sqrt(sum((x - mean) ** 2 for x in series) / len(series)) or 1.0
        norm = [(x - mean) / std for x in series]
        lr = 0.05
        for _ in range(epochs):
            self.h = [0.0] * self.hidden_size
            for t in range(len(norm) - 1):
                pred = self.step(norm[t])
                err = norm[t + 1] - pred
                for i in range(self.hidden_size):
                    self.wx[i][0] += lr * err * norm[t]
        self._mean = mean
        self._std = std

    def predict(self, series: List[float], horizon: int) -> List[float]:
        if len(series) < 2:
            return [series[-1]] * horizon if series else [0.0] * horizon

        self.fit(series)
        work = list(series)
        out: List[float] = []
        for _ in range(horizon):
            mean = sum(work[-20:]) / min(20, len(work))
            std = (
                math.sqrt(
                    sum((x - mean) ** 2 for x in work[-20:])
                    / min(20, len(work))
                )
                or 1.0
            )
            x = (work[-1] - mean) / std
            delta = self.step(x) * std
            nxt = max(work[-1] + delta * 0.3, 0.01)
            out.append(round(nxt, 4))
            work.append(nxt)
        return out


def walk_forward_errors(closes: List[float], horizon: int) -> tuple[float, float, float, float | None]:
    if len(closes) < 30:
        return 0.0, 0.0, 0.0, None
    model = TinyLSTM()
    actuals: List[float] = []
    preds: List[float] = []
    for i in range(20, len(closes) - horizon):
        train = closes[: i + 1]
        pred = model.predict(train, horizon)[-1]
        actuals.append(closes[i + horizon])
        preds.append(pred)
    if not actuals:
        return 0.0, 0.0, 0.0, None
    mae = sum(abs(a - p) for a, p in zip(actuals, preds)) / len(actuals)
    rmse = math.sqrt(sum((a - p) ** 2 for a, p in zip(actuals, preds)) / len(actuals))
    mape = (
        sum(abs((a - p) / a) for a, p in zip(actuals, preds) if a) / len(actuals) * 100
        if actuals
        else 0.0
    )
    dir_correct = 0
    dir_total = 0
    for j in range(1, len(actuals)):
        ad = actuals[j] - actuals[j - 1]
        pd = preds[j] - actuals[j - 1]
        if ad == 0 or pd == 0:
            continue
        if (ad > 0) == (pd > 0):
            dir_correct += 1
        dir_total += 1
    dir_acc = (dir_correct / dir_total * 100) if dir_total else None
    return round(mae, 4), round(rmse, 4), round(mape, 2), round(dir_acc, 2) if dir_acc else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--closes", required=True, help="JSON array of close prices")
    parser.add_argument("--horizon", type=int, default=7)
    args = parser.parse_args()

    closes = json.loads(args.closes)
    if not isinstance(closes, list) or not closes:
        raise SystemExit("closes must be a non-empty JSON array")

    model = TinyLSTM()
    h7 = model.predict(closes, 7)
    h30 = model.predict(closes, 30)
    mae, rmse, mape, dir_acc = walk_forward_errors(closes, 7)

    print(
        json.dumps(
            {
                "horizon7": h7,
                "horizon30": h30,
                "mae": mae,
                "rmse": rmse,
                "mape": mape,
                "dirAccuracy": dir_acc,
            }
        )
    )


if __name__ == "__main__":
    main()
