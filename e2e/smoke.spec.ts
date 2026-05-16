import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("dashboard loads with search", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("button", { name: /Search Philippine stock ticker/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Analyze Stock" })).toBeVisible();
    await expect(page.getByRole("link", { name: /browse all 30 stocks/i })).toBeVisible();
  });

  test("stocks browse page filters and navigates to analysis", async ({
    page,
  }) => {
    await page.goto("/stocks");
    await expect(
      page.getByRole("heading", { name: "All stocks" }),
    ).toBeVisible();
    await page.getByRole("searchbox", { name: "Search stocks" }).fill("MBT");
    await expect(page.getByRole("cell", { name: "Metrobank" })).toBeVisible();
    await page.getByRole("link", { name: "Analyze" }).first().click();
    await expect(page).toHaveURL(/\/stock\/mbt/);
    await expect(page.getByText("MBT.PS")).toBeVisible();
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
