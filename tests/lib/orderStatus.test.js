import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestDB, stopTestDB } from "../helpers/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { fulfilPaidOrder, nextStatuses, setOrderStatus } from "@/lib/orders";

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(async () => {
  await Product.deleteMany({});
  await Order.deleteMany({});
});

describe("nextStatuses", () => {
  it.each([
    ["pending", []],
    ["paid", ["packed", "cancelled"]],
    ["packed", ["shipped", "cancelled"]],
    ["shipped", ["delivered"]],
    ["delivered", []],
    ["cancelled", []],
  ])("%s → %j", (from, to) => {
    expect(nextStatuses(from)).toEqual(to);
  });

  it("knows nothing about made-up statuses", () => {
    expect(nextStatuses("refunded")).toEqual([]);
    expect(nextStatuses("__proto__")).toEqual([]);
  });
});

let seq = 0;
const shoe = (stock) =>
  Product.create({ slug: `s-${++seq}`, name: "S", side: "sport", line: "run", price: 500000, description: "Status test shoe.", sizes: [{ uk: 9, stock }] });

async function paidOrder(items) {
  const n = ++seq;
  await Order.create({
    orderNumber: `AE-S${String(n).padStart(5, "0")}`.replace(/0/g, "Q"),
    email: "a@b.com",
    address: { name: "A", phone: "9876543210", line1: "1", city: "C", state: "Gujarat", pincode: "380015" },
    items: items.map(({ product, qty }) => ({ productId: product._id, slug: product.slug, name: "S", size: 9, unitPrice: 500000, qty })),
    subtotal: 500000, shipping: 0, total: 500000, razorpayOrderId: `o_${n}`, status: "pending",
  });
  const { order } = await fulfilPaidOrder({ razorpayOrderId: `o_${n}`, razorpayPaymentId: `p_${n}` }, { sendEmail: async () => {} });
  return order;
}
const stockOf = async (product) => (await Product.findById(product._id).lean()).sizes[0].stock;

describe("setOrderStatus", () => {
  it("walks an order forward and records each step", async () => {
    const product = await shoe(5);
    const order = await paidOrder([{ product, qty: 1 }]);
    for (const status of ["packed", "shipped", "delivered"]) {
      expect((await setOrderStatus(String(order._id), status)).ok).toBe(true);
    }
    const saved = await Order.findById(order._id).lean();
    expect(saved.statusHistory.map((h) => h.status)).toEqual(["paid", "packed", "shipped", "delivered"]);
  });

  it("refuses jumps that aren't allowed", async () => {
    const product = await shoe(5);
    const order = await paidOrder([{ product, qty: 1 }]);
    const id = String(order._id);
    expect(await setOrderStatus(id, "delivered")).toMatchObject({ ok: false });
    await setOrderStatus(id, "packed");
    await setOrderStatus(id, "shipped");
    expect(await setOrderStatus(id, "cancelled")).toMatchObject({ ok: false });
    expect(await setOrderStatus(id, "pending")).toMatchObject({ ok: false });
    expect(await setOrderStatus(id, { $ne: null })).toMatchObject({ ok: false });
    expect(await setOrderStatus({ $ne: null }, "shipped")).toMatchObject({ ok: false });
  });

  it("puts stock back exactly once, even when cancel is clicked twice at the same time", async () => {
    const product = await shoe(5);
    const order = await paidOrder([{ product, qty: 2 }]);
    expect(await stockOf(product)).toBe(3);

    const results = await Promise.all([setOrderStatus(String(order._id), "cancelled"), setOrderStatus(String(order._id), "cancelled")]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await stockOf(product)).toBe(5);
    const saved = await Order.findById(order._id).lean();
    expect(saved.statusHistory.filter((h) => h.status === "cancelled")).toHaveLength(1);
  });

  it("only returns pairs that were actually taken when the order was short", async () => {
    const plenty = await shoe(4);
    const lastPair = await shoe(1);
    await paidOrder([{ product: lastPair, qty: 1 }]); // someone else buys the last pair
    const order = await paidOrder([{ product: plenty, qty: 1 }, { product: lastPair, qty: 1 }]);
    expect(order.stockIssue).toBe(true);
    expect(order.items.map((i) => i.stockTaken)).toEqual([true, false]);

    await setOrderStatus(String(order._id), "cancelled");
    expect(await stockOf(plenty)).toBe(4);
    expect(await stockOf(lastPair)).toBe(0);
  });
});
