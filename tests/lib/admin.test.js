import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestDB, stopTestDB } from "../helpers/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { getDashboard, istStart, saveProductData, setSizeStock, toggleProductActive } from "@/lib/admin";

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(async () => {
  await Product.deleteMany({});
  await Order.deleteMany({});
});

const form = (over = {}) => ({
  name: "Test Runner",
  slug: "test-runner",
  side: "sport",
  line: "run",
  price: "8499",
  colorway: "White",
  description: "A light runner for testing.",
  details: "Mesh upper\n\n  Foam sole  ",
  images: "/images/products/test-runner-1.webp",
  featured: "on",
  ...over,
});

describe("saveProductData", () => {
  it("creates a product in paise with every size at zero stock", async () => {
    const result = await saveProductData(form());
    expect(result.ok).toBe(true);
    const saved = await Product.findById(result.product.id).lean();
    expect(saved).toMatchObject({ price: 849900, featured: true, active: false, details: ["Mesh upper", "Foam sole"] });
    expect(saved.sizes.map((s) => [s.uk, s.stock])).toEqual([6, 7, 8, 9, 10, 11, 12].map((uk) => [uk, 0]));
  });

  it("updates an existing product without touching its stock", async () => {
    const { product } = await saveProductData(form({ active: "on" }));
    await setSizeStock({ productId: product.id, uk: 9, stock: 4 });
    const result = await saveProductData(form({ price: "9999", active: "on" }), product.id);
    expect(result.ok).toBe(true);
    const saved = await Product.findById(product.id).lean();
    expect(saved.price).toBe(999900);
    expect(saved.sizes.find((s) => s.uk === 9).stock).toBe(4);
  });

  it("rejects prices outside the side's range and collections from the other side", async () => {
    const result = await saveProductData(form({ price: "25000", line: "formal" }));
    expect(result.ok).toBe(false);
    expect(result.fields.line).toMatch(/collection/);
    expect(result.fields.price).toBe("Sport shoes are priced ₹3,000 to ₹12,000");
  });

  it("rejects image paths that point anywhere else", async () => {
    for (const images of ["https://evil.example/x.webp", "javascript:alert(1)", "/images/products/../../.env"]) {
      const result = await saveProductData(form({ images }));
      expect(result.fields.images).toMatch(/\/images\/products\//);
    }
  });

  it("explains a duplicate slug", async () => {
    await saveProductData(form());
    const result = await saveProductData(form({ name: "Other" }));
    expect(result.fields.slug).toBe("Another product already uses this slug");
  });

  it("ignores fields the form doesn't have, like a sneaked-in stock or _id", async () => {
    const { product } = await saveProductData(form({ sizes: [{ uk: 9, stock: 999 }], _id: "64b000000000000000000001" }));
    const saved = await Product.findById(product.id).lean();
    expect(String(saved._id)).toBe(product.id);
    expect(saved.sizes.every((s) => s.stock === 0)).toBe(true);
  });
});

describe("setSizeStock", () => {
  it("sets one size and refuses bad numbers", async () => {
    const { product } = await saveProductData(form());
    expect(await setSizeStock({ productId: product.id, uk: 10, stock: 7 })).toEqual({ ok: true, uk: 10, stock: 7 });
    for (const bad of [{ stock: -1 }, { stock: 2.5 }, { uk: 13 }, { productId: { $ne: null } }]) {
      expect((await setSizeStock({ productId: product.id, uk: 10, stock: 3, ...bad })).ok).toBe(false);
    }
    const saved = await Product.findById(product.id).lean();
    expect(saved.sizes.find((s) => s.uk === 10).stock).toBe(7);
  });

  it("adds a size the product was missing", async () => {
    const p = await Product.create({ slug: "few", name: "Few", side: "sport", line: "run", price: 500000, description: "Few sizes here.", sizes: [{ uk: 9, stock: 1 }] });
    await setSizeStock({ productId: String(p._id), uk: 11, stock: 2 });
    const saved = await Product.findById(p._id).lean();
    expect(saved.sizes.map((s) => s.uk)).toEqual([9, 11]);
  });
});

describe("toggleProductActive", () => {
  it("flips visibility each time", async () => {
    const { product } = await saveProductData(form());
    expect((await toggleProductActive(product.id)).active).toBe(true);
    expect((await toggleProductActive(product.id)).active).toBe(false);
  });
});

describe("getDashboard", () => {
  it("counts India's today and this month, ignoring unpaid and cancelled orders", async () => {
    // 26 Oct 2026, 00:30 in India = 25 Oct, 19:00 UTC
    const now = new Date("2026-10-25T19:00:00Z");
    expect(istStart(now, "day").toISOString()).toBe("2026-10-25T18:30:00.000Z");
    expect(istStart(now, "month").toISOString()).toBe("2026-09-30T18:30:00.000Z");

    const p = await Product.create({ slug: "dash", name: "Dash", side: "sport", line: "run", price: 500000, description: "Dashboard shoe.", sizes: [{ uk: 8, stock: 1 }, { uk: 9, stock: 9 }] });
    let n = 0;
    const order = (status, createdAt, extra = {}) =>
      Order.create({
        orderNumber: `AE-D${String(++n).padStart(5, "0")}`.replace(/0/g, "Q"),
        email: "a@b.com",
        address: { name: "A", phone: "9876543210", line1: "1", city: "C", state: "Gujarat", pincode: "380015" },
        items: [{ productId: p._id, slug: "dash", name: "Dash", size: 9, unitPrice: 500000, qty: 1 }],
        subtotal: 500000, shipping: 0, total: 500000, razorpayOrderId: `o${n}`, status, createdAt, ...extra,
      });
    await order("paid", new Date("2026-10-25T18:45:00Z")); // today in India
    await order("shipped", new Date("2026-10-25T10:00:00Z")); // yesterday in India, same month
    await order("pending", new Date("2026-10-25T18:50:00Z"));
    await order("cancelled", new Date("2026-10-25T18:50:00Z"), { stockIssue: true });
    await order("paid", new Date("2026-09-30T18:00:00Z")); // still September in India
    await order("packed", new Date("2026-10-02T10:00:00Z"), { stockIssue: true });

    const d = await getDashboard(now);
    expect(d.paidToday).toBe(1);
    expect(d.ordersThisMonth).toBe(3);
    expect(d.revenueThisMonth).toBe(1500000);
    expect(d.lowStock).toEqual([{ id: String(p._id), name: "Dash", colorway: "", sizes: [{ uk: 8, stock: 1 }] }]);
    expect(d.refunds.map((r) => r.orderNumber)).toEqual(["AE-DQQQQ6"]);
  });
});
