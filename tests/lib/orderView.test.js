import { describe, expect, it } from "vitest";
import { formatOrderDate, orderTimeline, toPublicOrder } from "../../src/lib/orderView.js";

const at = (d) => new Date(`2026-10-${d}T10:00:00Z`);
const history = (...pairs) => pairs.map(([status, d]) => ({ status, at: at(d) }));

describe("orderTimeline", () => {
  it("marks the steps reached so far and the one we are on", () => {
    const steps = orderTimeline({ status: "packed", statusHistory: history(["pending", 20], ["paid", 20], ["packed", 21]) });
    expect(steps.map((s) => [s.status, s.state])).toEqual([
      ["paid", "done"],
      ["packed", "current"],
      ["shipped", "upcoming"],
      ["delivered", "upcoming"],
    ]);
    expect(steps[1].at).toEqual(at(21));
    expect(steps[2].at).toBeNull();
  });

  it("shows every step done once delivered", () => {
    const steps = orderTimeline({
      status: "delivered",
      statusHistory: history(["paid", 20], ["packed", 21], ["shipped", 22], ["delivered", 24]),
    });
    expect(steps.at(-1)).toMatchObject({ status: "delivered", state: "current" });
    expect(steps.slice(0, 3).every((s) => s.state === "done")).toBe(true);
  });

  it("ends with a cancelled step after the last step actually reached", () => {
    const steps = orderTimeline({ status: "cancelled", statusHistory: history(["paid", 20], ["packed", 21], ["cancelled", 22]) });
    expect(steps.map((s) => [s.status, s.state])).toEqual([
      ["paid", "done"],
      ["packed", "done"],
      ["cancelled", "cancelled"],
    ]);
  });
});

describe("toPublicOrder", () => {
  const order = {
    orderNumber: "AE-7KQ2MX",
    status: "paid",
    email: "buyer@example.com",
    address: { name: "A", phone: "9876543210", line1: "12 Road", line2: "", city: "Ahmedabad", state: "Gujarat", pincode: "380015" },
    items: [{ productId: "x", slug: "ae-01-vapor-white", name: "AE-01 Vapor", image: "/a.webp", size: 9, unitPrice: 949900, qty: 2 }],
    subtotal: 1899800, discount: 0, couponCode: null, shipping: 0, total: 1899800,
    razorpayOrderId: "order_secret", razorpayPaymentId: "pay_secret", stockIssue: false,
    createdAt: at(20), statusHistory: history(["paid", 20]),
  };

  it("keeps what a tracking page needs and drops contact and payment details", () => {
    const view = toPublicOrder(order);
    expect(view).toMatchObject({ orderNumber: "AE-7KQ2MX", total: 1899800, city: "Ahmedabad", state: "Gujarat" });
    expect(view.items[0]).toMatchObject({ name: "AE-01 Vapor", size: 9, qty: 2, lineTotal: 1899800 });
    const json = JSON.stringify(view);
    for (const secret of ["9876543210", "12 Road", "380015", "buyer@example.com", "order_secret", "pay_secret"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("is safe to send as JSON", () => {
    const view = JSON.parse(JSON.stringify(toPublicOrder(order)));
    expect(view.placedAt).toBe(at(20).toISOString());
    expect(view.timeline[0].at).toBe(at(20).toISOString());
  });
});

describe("formatOrderDate", () => {
  it("formats in India time and survives missing dates", () => {
    expect(formatOrderDate("2026-10-25T19:00:00Z")).toBe("26 Oct 2026");
    expect(formatOrderDate(undefined)).toBe("—");
    expect(formatOrderDate("not a date")).toBe("—");
  });
});
