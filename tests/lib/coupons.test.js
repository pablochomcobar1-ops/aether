import { describe, it, expect } from "vitest";
import { evaluateCoupon } from "@/lib/coupons";

const now = new Date("2026-11-01T12:00:00Z");
const coupon = (overrides = {}) => ({
  code: "TEST",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  maxUses: null,
  uses: 0,
  expiresAt: null,
  active: true,
  ...overrides,
});

describe("evaluateCoupon", () => {
  it("takes 10% off", () => {
    expect(evaluateCoupon(coupon(), 500000, now)).toEqual({
      ok: true,
      discount: 50000,
    });
  });

  it("rounds a percent discount down to whole paise", () => {
    expect(evaluateCoupon(coupon(), 399999, now).discount).toBe(39999);
  });

  it("takes a flat amount off", () => {
    expect(
      evaluateCoupon(coupon({ type: "flat", value: 50000 }), 700000, now)
        .discount,
    ).toBe(50000);
  });

  it("tells you how much more to add when below the minimum", () => {
    const result = evaluateCoupon(
      coupon({ type: "flat", value: 50000, minSubtotal: 600000 }),
      400000,
      now,
    );
    expect(result).toEqual({
      ok: false,
      discount: 0,
      reason: "Add ₹2,000 more to use this code",
    });
  });

  it("rejects an expired code", () => {
    const result = evaluateCoupon(
      coupon({ expiresAt: new Date("2026-10-31T00:00:00Z") }),
      500000,
      now,
    );
    expect(result.reason).toBe("This code has expired");
  });

  it("rejects a fully used code", () => {
    expect(
      evaluateCoupon(coupon({ maxUses: 100, uses: 100 }), 500000, now).reason,
    ).toBe("This code has been fully used");
  });

  it("rejects an inactive or missing code", () => {
    expect(evaluateCoupon(coupon({ active: false }), 500000, now).reason).toBe(
      "This code isn't valid",
    );
    expect(evaluateCoupon(null, 500000, now).reason).toBe(
      "This code isn't valid",
    );
  });

  it("never discounts more than the subtotal", () => {
    expect(
      evaluateCoupon(coupon({ type: "flat", value: 900000 }), 400000, now)
        .discount,
    ).toBe(400000);
  });
});
