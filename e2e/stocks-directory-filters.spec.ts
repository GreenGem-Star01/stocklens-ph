import { expect, test } from "@playwright/test";

// Regression coverage for a bug fixed in stock-directory.tsx: three
// useEffect chains (subsector reset on sector change, page reset on filter
// change, page clamp on shrinking results) were replaced with render-time
// derived state. These tests pin the user-visible behavior so a future
// "cleanup" of that logic can't silently reintroduce the stale-state bugs.
test.describe("stocks directory filters", () => {
  test("subsector resets to 'all' when sector changes", async ({ page }) => {
    await page.goto("/stocks");

    const sectorSelect = page.getByRole("combobox", { name: "Filter by sector" });
    const subsectorSelect = page.getByRole("combobox", {
      name: "Filter by subsector",
    });

    await sectorSelect.click();
    await page.getByRole("option", { name: /^Financials/ }).click();
    await expect(subsectorSelect).toBeEnabled();

    await subsectorSelect.click();
    await page.getByRole("option", { name: "Banks" }).click();
    await expect(subsectorSelect).toContainText("Banks");

    // Switch to a different sector that doesn't have a "Banks" subsector.
    await sectorSelect.click();
    await page.getByRole("option", { name: /^Industrial/ }).click();

    // SelectValue renders the raw option value ("all"), not its label ("All subsectors").
    await expect(subsectorSelect).toContainText("all");
  });

  test("switching to 'All sectors' resets subsector without a stale value", async ({
    page,
  }) => {
    await page.goto("/stocks");

    const sectorSelect = page.getByRole("combobox", { name: "Filter by sector" });
    const subsectorSelect = page.getByRole("combobox", {
      name: "Filter by subsector",
    });

    await sectorSelect.click();
    await page.getByRole("option", { name: /^Financials/ }).click();
    await expect(subsectorSelect).toBeEnabled();
    await subsectorSelect.click();
    await page.getByRole("option", { name: "Banks" }).click();

    await sectorSelect.click();
    await page.getByRole("option", { name: "All sectors" }).click();

    // SelectValue renders the raw option value ("all"), not its label ("All subsectors").
    await expect(subsectorSelect).toContainText("all");
    await expect(subsectorSelect).toBeDisabled();
  });

  test("narrowing the search while on page 2+ resets to page 1 without a stale range", async ({
    page,
  }) => {
    await page.goto("/stocks");

    const nextButton = page.getByRole("button", { name: "Next" });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await expect(page.getByText(/^Showing 51–100 of/)).toBeVisible();

    await page.getByRole("searchbox", { name: "Search stocks" }).fill("BDO");

    await expect(page.getByText(/^Showing 1–1 of 1 /)).toBeVisible();
    await expect(page.getByRole("cell", { name: "BDO.PS" })).toBeVisible();
  });
});
