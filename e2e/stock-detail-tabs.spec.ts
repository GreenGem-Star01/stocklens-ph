import { expect, test } from "@playwright/test";

// Coverage for the stock detail page's tabbed restructure (previously a
// single 9-section vertical stack), the technical chart's panel toggles,
// and the "How forecasts work" dialog — all added in the same pass and
// only manually verified until now.

test.describe("stock detail page tabs", () => {
  test("each tab shows its own content and hides the others", async ({
    page,
  }) => {
    await page.goto("/stock/bdo");

    // Technical is the default active tab.
    await expect(
      page.getByText("Technical Analysis", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Model Comparison")).not.toBeVisible();

    await page.getByRole("tab", { name: "Forecast" }).click();
    await expect(
      page.getByRole("img", { name: /Price chart for BDO\.PS/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Technical Analysis", { exact: true }),
    ).not.toBeVisible();

    await page.getByRole("tab", { name: "Models" }).click();
    await expect(page.getByText("Model Comparison")).toBeVisible();
    await expect(page.getByText("Forecast Performance Metrics")).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Price chart for BDO\.PS/i }),
    ).not.toBeVisible();

    // BDO is a demo/analyzed ticker, so it has an Insights tab.
    await page.getByRole("tab", { name: "Insights" }).click();
    await expect(page.getByText("AI Market Insight")).toBeVisible();
    await expect(page.getByText("Market Context")).toBeVisible();
  });
});

test.describe("technical chart panel toggles", () => {
  // CI/this e2e run uses MARKET_DATA_SOURCE=static (no bar history — see
  // the same note in stock-technical-range.spec.ts), so the chart itself
  // always renders its "No bar history yet" empty state here regardless of
  // ticker. The toggle buttons aren't gated on data availability though —
  // test their aria-pressed state directly instead of chart panel content.
  test("toggling updates pressed state, and the last panel can't be released", async ({
    page,
  }) => {
    await page.goto("/stock/bdo");

    const priceBtn = page.getByRole("button", { name: "Price + SMA", exact: true });
    const volumeBtn = page.getByRole("button", { name: "Volume", exact: true });
    const rsiBtn = page.getByRole("button", { name: "RSI", exact: true });
    const macdBtn = page.getByRole("button", { name: "MACD", exact: true });

    for (const btn of [priceBtn, volumeBtn, rsiBtn, macdBtn]) {
      await expect(btn).toHaveAttribute("aria-pressed", "true");
    }

    await volumeBtn.click();
    await expect(volumeBtn).toHaveAttribute("aria-pressed", "false");

    // Hide everything except Price + SMA.
    await rsiBtn.click();
    await macdBtn.click();
    await expect(rsiBtn).toHaveAttribute("aria-pressed", "false");
    await expect(macdBtn).toHaveAttribute("aria-pressed", "false");
    await expect(priceBtn).toHaveAttribute("aria-pressed", "true");

    // The sole remaining panel can't be toggled off.
    await priceBtn.click();
    await expect(priceBtn).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("forecast methodology dialog", () => {
  test("explains all four models and metrics, grounded in the real implementation", async ({
    page,
  }) => {
    await page.goto("/stock/bdo");
    await page.getByRole("tab", { name: "Forecast" }).click();

    await page.getByRole("button", { name: "How forecasts work" }).click();
    const dialog = page.getByRole("dialog", { name: "How forecasts work" });
    await expect(dialog).toBeVisible();
    for (const model of ["Naive baseline", "Moving Average", "Linear Regression", "LSTM"]) {
      await expect(dialog.getByText(model, { exact: true })).toBeVisible();
    }
    // These render as "MAE:", "RMSE:", etc. (label + colon), so match the
    // substring rather than the exact bare metric name.
    for (const metric of ["MAE:", "RMSE:", "MAPE:", "Directional accuracy:"]) {
      await expect(dialog.getByText(metric)).toBeVisible();
    }

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });
});

test.describe("forecast model selection", () => {
  test("switching between models produces different live forecast output", async ({
    page,
  }) => {
    await page.goto("/stock/bdo");
    await page.getByRole("tab", { name: "Forecast" }).click();

    const modelSelect = page.getByRole("combobox", { name: "Forecast model" });

    const linearResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/stocks/bdo/forecast") &&
        res.url().includes("model=linear"),
    );
    await modelSelect.click();
    await page.getByRole("option", { name: "Linear Reg", exact: true }).click();
    const linearBody = (await (await linearResponse).json()) as {
      forecast7d: string;
    };

    const lstmResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/stocks/bdo/forecast") &&
        res.url().includes("model=lstm"),
    );
    await modelSelect.click();
    await page.getByRole("option", { name: "LSTM", exact: true }).click();
    const lstmBody = (await (await lstmResponse).json()) as {
      forecast7d: string;
    };

    expect(lstmBody.forecast7d).toBeTruthy();
    expect(linearBody.forecast7d).toBeTruthy();
    expect(lstmBody.forecast7d).not.toBe(linearBody.forecast7d);
  });
});
