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

  test("catalog stock page loads without forecast chart", async ({ page }) => {
    await page.goto("/stock/aaa");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Listed on the PSE/i)).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Price chart for AAA\.PS/i }),
    ).toHaveCount(0);
    await expect(page.getByText(/No live quote in the database yet/i)).toHaveCount(
      0,
    );
    await expect(page.getByText(/End-of-day data/i)).toBeVisible();
    await expect(page.getByText("Market price", { exact: true })).toBeVisible();
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
    await expect(
      page.getByRole("img", {
        name: /Price chart for BDO\.PS/i,
      }),
    ).toBeVisible();
  });
});
