import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrendBadge } from "@/components/ui/trend-badge";

describe("TrendBadge", () => {
  it("renders projected upward label with trend-up styles", () => {
    render(<TrendBadge trend="Projected Upward" />);
    const badge = screen.getByText("Projected Upward");
    expect(badge).toBeTruthy();
    expect(badge.className).toMatch(/text-trend-up/);
    expect(badge.className).toMatch(/border-trend-up/);
  });

  it("renders projected downward label with trend-down styles", () => {
    render(<TrendBadge trend="Projected Downward" />);
    const badge = screen.getByText("Projected Downward");
    expect(badge.className).toMatch(/text-trend-down/);
    expect(badge.className).toMatch(/border-trend-down/);
  });

  it("renders mixed signal label with trend-mixed styles", () => {
    render(<TrendBadge trend="Mixed Signal" />);
    const badge = screen.getByText("Mixed Signal");
    expect(badge.className).toMatch(/text-trend-mixed/);
    expect(badge.className).toMatch(/border-trend-mixed/);
  });
});
