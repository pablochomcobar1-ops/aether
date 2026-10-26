import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { startTestDB, stopTestDB } from "../helpers/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import { fulfilPaidOrder } from "@/lib/orders";

beforeAll(startTestDB);
afterAll(stopTestDB);

let seq = 0;
async function makeProduct(stock) {
  return Product.create({
    slug: `test-shoe-${++seq}`,
    name: "Test Shoe",
    side: "sport",
    line: "run",
    price: 500000,
    description: "A test shoe.",
    sizes: [{ uk: 9, stock }],
  });
}

async function makeOrder(product, { qty = 1, couponCode = null } = {}) {
  const n = ++seq;
  return Order.create({
    orderNumber: `AE-T${String(n).padStart(5, "0")}`,
    email: "buyer@example.com",
    address: { name: "A", phone: "9876543210", line1: "1 Road", city: "Ahmedabad", state: "Gujarat", pincode: "380015" },
    items: [{ productId: product._id, slug: product.slug, name: product.name, size: 9, unitPrice: 500000, qty }],
    subtotal: 500000 * qty,
    discount: 0,
    couponCode,
    shipping: 0,
    total: 500000 * qty,
    razorpayOrderId: `order_test_${n}`,
    status: "pending",
    statusHistory: [{ status: "pending" }],
  });
}

const stockOf = async (product) => (await Product.findById(product._id)).sizes[0].stock;
let sendEmail;
beforeEach(() => {
  sendEmail = vi.fn(async () => {});
});

describe("fulfilPaidOrder", () => {
  it("refuses a webhook whose amount doesn't match what we charged", async () => {
    const product = await makeProduct(3);
    const order = await makeOrder(product);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await fulfilPaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_x", amount: 100 }, { sendEmail });
    spy.mockRestore();
    expect(result).toMatchObject({ order: null, amountMismatch: true });
    expect((await Order.findById(order._id)).status).toBe("pending");
    expect(await stockOf(product)).toBe(3);
    expect(sendEmail).not.toHaveBeenCalled();

    const ok = await fulfilPaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_y", amount: 500000 }, { sendEmail });
    expect(ok.order.status).toBe("paid");
  });

  it("marks the order paid, records the payment and takes the stock", async () => {
    const product = await makeProduct(3);
    const order = await makeOrder(product, { qty: 2 });
    const result = await fulfilPaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_1" }, { sendEmail });

    expect(result.alreadyPaid).toBe(false);
    expect(result.order).toMatchObject({ status: "paid", razorpayPaymentId: "pay_1", stockIssue: false, emailSent: true });
    expect(result.order.statusHistory.map((h) => h.status)).toEqual(["pending", "paid"]);
    expect(await stockOf(product)).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("counts a payment once when the success page and the webhook arrive together", async () => {
    const product = await makeProduct(5);
    const order = await makeOrder(product);
    const confirm = () => fulfilPaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_2" }, { sendEmail });

    const results = await Promise.all([confirm(), confirm(), confirm()]);

    expect(results.filter((r) => !r.alreadyPaid)).toHaveLength(1);
    expect(await stockOf(product)).toBe(4);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const saved = await Order.findById(order._id);
    expect(saved.statusHistory.filter((h) => h.status === "paid")).toHaveLength(1);
  });

  it("never sells the last pair twice: stock stops at 0 and the second order is flagged", async () => {
    const product = await makeProduct(1);
    const first = await makeOrder(product);
    const second = await makeOrder(product);

    const results = await Promise.all([
      fulfilPaidOrder({ razorpayOrderId: first.razorpayOrderId, razorpayPaymentId: "pay_a" }, { sendEmail }),
      fulfilPaidOrder({ razorpayOrderId: second.razorpayOrderId, razorpayPaymentId: "pay_b" }, { sendEmail }),
    ]);

    expect(await stockOf(product)).toBe(0);
    expect(results.map((r) => r.order.status)).toEqual(["paid", "paid"]);
    expect(results.filter((r) => r.order.stockIssue)).toHaveLength(1);
  });

  it("uses a coupon once, even if the payment is confirmed twice", async () => {
    const coupon = await Coupon.create({ code: `TEST${++seq}`, type: "percent", value: 10 });
    const product = await makeProduct(5);
    const order = await makeOrder(product, { couponCode: coupon.code });
    const ids = { razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_c" };

    await fulfilPaidOrder(ids, { sendEmail });
    await fulfilPaidOrder(ids, { sendEmail });

    expect((await Coupon.findById(coupon._id)).uses).toBe(1);
  });

  it("keeps the order paid when the email fails, and allows a later retry", async () => {
    const product = await makeProduct(5);
    const order = await makeOrder(product);
    const failing = vi.fn(async () => {
      throw new Error("Resend is down");
    });
    const result = await fulfilPaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_d" }, { sendEmail: failing });

    expect(result.order.status).toBe("paid");
    expect(result.order.emailSent).toBe(false);
  });

  it("returns nothing for an order that doesn't exist", async () => {
    const result = await fulfilPaidOrder({ razorpayOrderId: "order_nope", razorpayPaymentId: "pay_x" }, { sendEmail });
    expect(result).toEqual({ order: null, alreadyPaid: false });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("ignores ids that aren't plain text (query injection)", async () => {
    const result = await fulfilPaidOrder({ razorpayOrderId: { $ne: null }, razorpayPaymentId: "pay_x" }, { sendEmail });
    expect(result.order).toBeNull();
  });

  it("leaves a cancelled order alone", async () => {
    const product = await makeProduct(5);
    const order = await makeOrder(product);
    await Order.updateOne({ _id: order._id }, { status: "cancelled" });

    const result = await fulfilPaidOrder({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_e" }, { sendEmail });

    expect(result.order.status).toBe("cancelled");
    expect(await stockOf(product)).toBe(5);
    expect(mongoose.connection.readyState).toBe(1);
  });
});
