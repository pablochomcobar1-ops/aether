import { describe, it, expect } from "vitest";
import { formatINR } from "@/lib/money";

describe("formatINR", () => {
  it("shows whole rupees without decimals", () => {
    expect(formatINR(1249900)).toBe("₹12,499");
    expect(formatINR(14900)).toBe("₹149");
    expect(formatINR(0)).toBe("₹0");
  });

  it("uses Indian digit grouping", () => {
    expect(formatINR(25000000)).toBe("₹2,50,000");
  });

  it("shows two decimals when there are paise", () => {
    expect(formatINR(1000050)).toBe("₹10,000.50");
  });
});
