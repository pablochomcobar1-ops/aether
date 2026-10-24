import { describe, it, expect, vi } from "vitest";
import { createCheckout, newOrderNumber } from "@/lib/checkout";

const productId = "a".repeat(24);
const product = { _id: productId, slug: "ae-01-vapor-white", name: "AE-01 Vapor", price: 949900, active: true, images: ["/v.webp"], sizes: [{ uk: 9, stock: 3 }] };
const address = { name: "Jainam G", phone: "+91 98765 43210", line1: "12 Shanti Nagar", city: "Ahmedabad", state: "Gujarat", pincode: "380015" };
const body = (overrides = {}) => ({ email: "Buyer@Example.com", address, lines: [{ productId, size: 9, qty: 1 }], ...overrides });

function deps(overrides = {}) {
  return {
    loadProducts: vi.fn(async () => [product]),
    loadCoupon: vi.fn(async () => null),
    createRazorpayOrder: vi.fn(async ({ amount }) => ({ id: "order_TEST1", amount, currency: "INR" })),
    saveOrder: vi.fn(async (order) => order),
    ...overrides,
  };
}

describe("newOrderNumber", () => {
  it("looks like AE-XXXXXX with no confusable characters", () => {
    for (let i = 0; i < 200; i++) expect(newOrderNumber()).toMatch(/^AE-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
});

describe("createCheckout", () => {
  it("creates a pending order priced by the server", async () => {
    const d = deps();
    const result = await createCheckout({ body: body(), session: null }, d);
    expect(result.ok).toBe(true);
    expect(d.createRazorpayOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 949900, receipt: result.data.orderNumber }));
    const saved = d.saveOrder.mock.calls[0][0];
    expect(saved).toMatchObject({
      status: "pending",
      email: "buyer@example.com",
      subtotal: 949900,
      shipping: 0,
      total: 949900,
      razorpayOrderId: "order_TEST1",
      userId: null,
      address: { phone: "9876543210", line2: "" },
    });
    expect(saved.items[0]).toMatchObject({ slug: "ae-01-vapor-white", size: 9, qty: 1, unitPrice: 949900 });
    expect(saved.statusHistory[0].status).toBe("pending");
    expect(result.data).toMatchObject({ amount: 949900, razorpayOrderId: "order_TEST1" });
  });

  it("ignores any price or total the browser sends", async () => {
    const d = deps();
    const tampered = body({ total: 100, subtotal: 100, lines: [{ productId, size: 9, qty: 1, price: 1 }] });
    await createCheckout({ body: tampered, session: null }, d);
    expect(d.saveOrder.mock.calls[0][0].total).toBe(949900);
  });

  it("links the order to a signed-in customer", async () => {
    const d = deps();
    await createCheckout({ body: body(), session: { userId: "b".repeat(24), role: "customer" } }, d);
    expect(d.saveOrder.mock.calls[0][0].userId).toBe("b".repeat(24));
  });

  it("refuses more pairs than are in stock and creates nothing", async () => {
    const d = deps();
    const result = await createCheckout({ body: body({ lines: [{ productId, size: 9, qty: 4 }] }), session: null }, d);
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(result.error.items[0].message).toBe("Only 3 left in UK 9");
    expect(d.createRazorpayOrder).not.toHaveBeenCalled();
    expect(d.saveOrder).not.toHaveBeenCalled();
  });

  it("explains bad address fields in plain words", async () => {
    const result = await createCheckout({ body: body({ address: { ...address, pincode: "12345", phone: "12345" } }), session: null }, deps());
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(result.error.fields).toMatchObject({ pincode: "Enter a 6-digit PIN code", phone: "Enter a 10-digit Indian mobile number" });
  });

  it("rejects an empty bag", async () => {
    const result = await createCheckout({ body: body({ lines: [] }), session: null }, deps());
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("applies a valid coupon and records it", async () => {
    const coupon = { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 300000, maxUses: null, uses: 0, expiresAt: null, active: true };
    const d = deps({ loadCoupon: vi.fn(async () => coupon) });
    await createCheckout({ body: body({ couponCode: "welcome10" }), session: null }, d);
    expect(d.loadCoupon).toHaveBeenCalledWith("WELCOME10");
    expect(d.saveOrder.mock.calls[0][0]).toMatchObject({ discount: 94990, couponCode: "WELCOME10", total: 854910 });
  });

  it("stops the order when the coupon no longer works, so the price never changes silently", async () => {
    const d = deps({ loadCoupon: vi.fn(async () => null) });
    const result = await createCheckout({ body: body({ couponCode: "EXPIRED" }), session: null }, d);
    expect(result).toMatchObject({ ok: false, status: 409, error: { coupon: "This code isn't valid" } });
    expect(d.saveOrder).not.toHaveBeenCalled();
  });

  it("saves nothing if Razorpay is unreachable", async () => {
    const d = deps({ createRazorpayOrder: vi.fn(async () => { throw new Error("network down"); }) });
    const result = await createCheckout({ body: body(), session: null }, d);
    expect(result).toMatchObject({ ok: false, status: 502 });
    expect(d.saveOrder).not.toHaveBeenCalled();
  });
});
