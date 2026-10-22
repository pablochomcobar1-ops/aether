import { describe, it, expect } from "vitest";
import { priceCart } from "@/lib/pricing";

const now = new Date("2026-11-01T12:00:00Z");

function product(id, price, sizes = [{ uk: 9, stock: 5 }], overrides = {}) {
  return {
    _id: id,
    slug: `shoe-${id}`,
    name: `Shoe ${id}`,
    price,
    active: true,
    images: [`/img/${id}.webp`],
    sizes,
    ...overrides,
  };
}

const welcome10 = {
  code: "WELCOME10",
  type: "percent",
  value: 10,
  minSubtotal: 300000,
  maxUses: null,
  uses: 0,
  expiresAt: null,
  active: true,
};

describe("priceCart", () => {
  it("adds up line totals and gives free shipping at ₹5,000 or more", () => {
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 2 }],
      products: [product("a", 450000)],
      now,
    });
    expect(result).toMatchObject({
      subtotal: 900000,
      discount: 0,
      shipping: 0,
      total: 900000,
      errors: [],
    });
    expect(result.items[0]).toMatchObject({
      unitPrice: 450000,
      qty: 2,
      lineTotal: 900000,
      image: "/img/a.webp",
    });
  });

  it("charges ₹149 shipping below ₹5,000", () => {
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 1 }],
      products: [product("a", 450000)],
      now,
    });
    expect(result).toMatchObject({
      subtotal: 450000,
      shipping: 14900,
      total: 464900,
    });
  });

  it("checks free shipping after the discount", () => {
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 1 }],
      products: [product("a", 520000)],
      coupon: welcome10,
      now,
    });
    expect(result).toMatchObject({
      subtotal: 520000,
      discount: 52000,
      shipping: 14900,
      total: 482900,
      couponCode: "WELCOME10",
    });
  });

  it("gives free shipping at exactly ₹5,000 after discount", () => {
    const flat = {
      ...welcome10,
      code: "FLAT",
      type: "flat",
      value: 100000,
      minSubtotal: 0,
    };
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 1 }],
      products: [product("a", 600000)],
      coupon: flat,
      now,
    });
    expect(result).toMatchObject({
      discount: 100000,
      shipping: 0,
      total: 500000,
    });
  });

  it("blocks more than 5 of one size, even when split across lines", () => {
    const result = priceCart({
      lines: [
        { productId: "a", size: 9, qty: 3 },
        { productId: "a", size: 9, qty: 3 },
      ],
      products: [product("a", 450000, [{ uk: 9, stock: 10 }])],
      now,
    });
    expect(result.items).toEqual([]);
    expect(result.errors[0].message).toBe("You can buy up to 5 of each size");
  });

  it("says how many are left when asking for too many", () => {
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 2 }],
      products: [product("a", 450000, [{ uk: 9, stock: 1 }])],
      now,
    });
    expect(result.errors[0].message).toBe("Only 1 left in UK 9");
  });

  it("says when a size is sold out", () => {
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 1 }],
      products: [product("a", 450000, [{ uk: 9, stock: 0 }])],
      now,
    });
    expect(result.errors[0].message).toBe("UK 9 is sold out");
  });

  it("rejects unknown and inactive products", () => {
    const result = priceCart({
      lines: [
        { productId: "ghost", size: 9, qty: 1 },
        { productId: "b", size: 9, qty: 1 },
      ],
      products: [product("b", 450000, undefined, { active: false })],
      now,
    });
    expect(result.errors.map((e) => e.message)).toEqual([
      "This item is no longer available",
      "This item is no longer available",
    ]);
    expect(result.total).toBe(0);
  });

  it("rejects zero, negative and fractional quantities", () => {
    for (const qty of [0, -1, 1.5]) {
      const result = priceCart({
        lines: [{ productId: "a", size: 9, qty }],
        products: [product("a", 450000)],
        now,
      });
      expect(result.errors[0].message).toBe("Choose a valid quantity");
    }
  });

  it("ignores any price sent from the browser", () => {
    const result = priceCart({
      lines: [
        { productId: "a", size: 9, qty: 1, price: 1, unitPrice: 1, total: 1 },
      ],
      products: [product("a", 450000)],
      now,
    });
    expect(result.items[0].unitPrice).toBe(450000);
    expect(result.total).toBe(464900);
  });

  it("keeps the order going when only the coupon fails", () => {
    const result = priceCart({
      lines: [{ productId: "a", size: 9, qty: 1 }],
      products: [product("a", 250000)],
      coupon: welcome10,
      now,
    });
    expect(result).toMatchObject({
      discount: 0,
      couponCode: null,
      couponError: "Add ₹500 more to use this code",
      total: 264900,
    });
  });

  it("charges nothing for an empty cart", () => {
    expect(priceCart({ lines: [], products: [], now })).toMatchObject({
      subtotal: 0,
      shipping: 0,
      total: 0,
    });
  });
});
