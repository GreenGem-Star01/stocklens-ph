import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND_NAME, BRAND_SUFFIX } from "@/lib/constants/brand";

describe("BrandLogo", () => {
  afterEach(() => {
    cleanup();
  });

  it("links home with wordmark and PH suffix", () => {
    render(<BrandLogo />);
    const link = screen.getByRole("link", { name: /StockLens/i });
    expect(link.getAttribute("href")).toBe("/");
    expect(screen.getByText(BRAND_NAME)).toBeTruthy();
    expect(screen.getByText(BRAND_SUFFIX)).toBeTruthy();
  });

  it("renders mark-only variant without wordmark", () => {
    render(<BrandLogo variant="mark" />);
    expect(screen.queryByText(BRAND_SUFFIX)).toBeNull();
    expect(screen.getByRole("img", { name: BRAND_NAME })).toBeTruthy();
  });
});
