import { describe, expect, it } from "vitest";
import { canViewOrder, ORDER_NUMBER } from "../../src/lib/orderAccess.js";

const guestOrder = { orderNumber: "AE-7KQ2MX", userId: null };
const userOrder = { orderNumber: "AE-PX4N8R", userId: "64b000000000000000000001" };

describe("canViewOrder", () => {
  it("lets the browser that placed the order see it", () => {
    expect(canViewOrder(guestOrder, { lastOrder: "AE-7KQ2MX" })).toBe(true);
  });

  it("refuses someone who only knows the order number", () => {
    expect(canViewOrder(guestOrder, {})).toBe(false);
    expect(canViewOrder(guestOrder, { lastOrder: "AE-OTHER1" })).toBe(false);
  });

  it("lets the account that owns the order see it on any device", () => {
    expect(canViewOrder(userOrder, { session: { userId: "64b000000000000000000001" } })).toBe(true);
  });

  it("refuses a different signed-in account", () => {
    expect(canViewOrder(userOrder, { session: { userId: "64b000000000000000000002" } })).toBe(false);
  });

  it("never lets a signed-in user see guest orders through the session check", () => {
    expect(canViewOrder(guestOrder, { session: { userId: "64b000000000000000000001" } })).toBe(false);
  });

  it("handles a missing order", () => {
    expect(canViewOrder(null, { lastOrder: "AE-7KQ2MX" })).toBe(false);
  });
});

describe("ORDER_NUMBER", () => {
  it("accepts real numbers and rejects junk", () => {
    expect(ORDER_NUMBER.test("AE-7KQ2MX")).toBe(true);
    for (const bad of ["ae-7kq2mx", "AE-7KQ2M", "AE-7KQ2MX1", "AE-7KQ2MX\n", { $ne: "" }]) {
      expect(ORDER_NUMBER.test(bad)).toBe(false);
    }
  });
});
