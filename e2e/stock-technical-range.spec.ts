import { expect, test } from "@playwright/test";

// Regression coverage for a race condition fixed in stock-technical-section.tsx:
// switching the Range select quickly could let a slow, now-stale fetch response
// overwrite a faster, newer one. CI runs with MARKET_DATA_SOURCE=static, which
// has no bar history, so every range returns empty data and the race itself
// can't be reproduced here — this test instead pins the two things that ARE
// verifiable without a live DB: no crash during rapid switching, and the panel
// settles on whatever range was clicked last. Verify the actual data-swap
// behavior manually against MARKET_DATA_SOURCE=db.
test.describe("stock technical analysis range switching", () => {
  test("rapid range switching settles on the last selection without errors", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/stock/bdo");

    const rangeSelect = page.getByRole("combobox", {
      name: "Technical analysis range",
    });
    await expect(rangeSelect).toBeVisible();

    const sequence = ["90 days", "1 year", "30 days", "1 year"] as const;
    for (const label of sequence) {
      await rangeSelect.click();
      await page.getByRole("option", { name: label }).click();
      // Deliberately shorter than a real fetch round-trip — the point is to
      // fire the next change before the previous one has settled.
      await page.waitForTimeout(80);
    }

    // SelectValue renders the raw option value ("1y"), not its label ("1 year").
    await expect(rangeSelect).toContainText("1y");
    expect(pageErrors).toEqual([]);
  });
});
