import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("dashboard loads with search", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("button", { name: /Search Philippine stock ticker/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Analyze Stock" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse all \d+ stocks/i }),
    ).toBeVisible();
  });

  test("stocks browse page filters and navigates to analysis", async ({
    page,
  }) => {
    await page.goto("/stocks");
    await expect(
      page.getByRole("heading", { name: "All stocks" }),
    ).toBeVisible();
    await page.getByRole("searchbox", { name: "Search stocks" }).fill("MBT");
    await expect(page.getByRole("cell", { name: "MBT.PS" })).toBeVisible();
    await page.getByRole("link", { name: "Analyze" }).first().click();
    await expect(page).toHaveURL(/\/stock\/mbt/);
    await expect(page.getByText("MBT.PS")).toBeVisible();
  });

  test("stocks page filters by sector query param", async ({ page }) => {
    await page.goto("/stocks?sector=Financials");
    await expect(
      page.getByRole("heading", { name: "All stocks" }),
    ).toBeVisible();
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(rows.nth(i)).toContainText("Financials");
    }
  });

  test("stock page loads full analysis for a non-blue-chip ticker", async ({
    page,
  }) => {
    // As of the technical-analysis/forecasts pipeline, full analysis renders
    // for every listed ticker (not just blue-chip demo seeds) — this pins
    // that AAA.PS, a non-demo ticker, gets the same treatment as BDO.
    await page.goto("/stock/aaa");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Asia Amalgamated/i,
    );
    await expect(page.getByText("AAA.PS")).toBeVisible();
    // "Technical" is the default active tab on the stock page.
    await expect(page.getByText("Technical Analysis", { exact: true })).toBeVisible();
    // The forecast price chart lives under the "Forecast" tab.
    await page.getByRole("tab", { name: "Forecast" }).click();
    await expect(
      page.getByRole("img", { name: /Price chart for AAA\.PS/i }),
    ).toBeVisible();
  });

  test("stocks directory shows neutral flat change without plus sign", async ({
    page,
  }) => {
    await page.goto("/stocks");
    await page.getByRole("searchbox", { name: "Search stocks" }).fill("AAA");
    const changeCell = page.getByRole("cell", { name: "0.0%" }).first();
    await expect(changeCell).toBeVisible();
    await expect(changeCell).not.toHaveClass(/text-trend-up/);
    await expect(changeCell).not.toHaveText("+0.0%");
  });

  test("stock analysis page loads for BDO", async ({ page }) => {
    await page.goto("/stock/bdo");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/BDO/i);
    await expect(page.getByText("BDO.PS")).toBeVisible();
    // The forecast price chart lives under the "Forecast" tab.
    await page.getByRole("tab", { name: "Forecast" }).click();
    await expect(
      page.getByRole("img", {
        name: /Price chart for BDO\.PS/i,
      }),
    ).toBeVisible();
  });

  // Regression coverage for a bug where this page rendered a bundled static
  // demo array regardless of provider/data source, so it never reflected
  // live forecasts even when the DB-backed pipeline had fresh data. The page
  // must now come from getForecastsData() and render whatever it returns —
  // pinning the summary/table/tab wiring here catches a future revert back
  // to a hardcoded import even in environments where the underlying numbers
  // happen to match the old demo values.
  test("forecasts page loads data through the market provider and all tabs render", async ({
    page,
  }) => {
    await page.goto("/forecasts");
    await expect(page.getByRole("heading", { name: "Forecasts" })).toBeVisible();

    await expect(page.getByText("Total Forecasts Today")).toBeVisible();
    const totalToday = await page
      .locator("text=Total Forecasts Today")
      .locator("xpath=../../..")
      .getByText(/^\d+$/)
      .innerText();
    expect(Number(totalToday)).toBeGreaterThan(0);

    await expect(page.getByText(/Last updated: /)).toBeVisible();
    await expect(page.getByText("Average Model Accuracy")).toBeVisible();
    await expect(page.getByText("Projected Upward Forecasts")).toBeVisible();

    // "All Forecasts" is the default tab.
    await expect(page.getByRole("cell", { name: /\.PS$/ }).first()).toBeVisible();

    await page.getByRole("tab", { name: "Projected Upward" }).click();
    await expect(page.getByText(/stocks? with projected upward movement/)).toBeVisible();

    await page.getByRole("tab", { name: "Projected Downward" }).click();
    await expect(page.getByText(/stocks? with projected downward movement/)).toBeVisible();

    await page.getByRole("tab", { name: "Model Performance" }).click();
    await expect(
      page.getByText("Model Performance Comparison", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("row", { name: /Naive Baseline/ })).toBeVisible();
    await expect(page.getByText("Key Insights")).toBeVisible();
    // The insight names whichever model actually scored best — it must not
    // be hardcoded to a fixed model/percentage regardless of the data.
    await expect(
      page.getByText(/model currently has the strongest average directional accuracy/),
    ).toBeVisible();
  });
});
