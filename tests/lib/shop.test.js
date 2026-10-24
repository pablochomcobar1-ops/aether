import { describe, it, expect } from "vitest";
import { cartPriceSchema, productIdsSchema } from "@/lib/validators";
import { toCard } from "@/lib/catalog";

const id = "a".repeat(24);

describe("cartPriceSchema", () => {
  it("accepts a normal bag and uppercases the coupon", () => {
    expect(cartPriceSchema.parse({ lines: [{ productId: id, size: 9, qty: 1 }], couponCode: " welcome10 " })).toEqual({
      lines: [{ productId: id, size: 9, qty: 1 }],
      couponCode: "WELCOME10",
    });
  });

  it("drops extra fields like a price sent from the browser", () => {
    const { lines } = cartPriceSchema.parse({ lines: [{ productId: id, size: 9, qty: 1, price: 1 }] });
    expect(lines[0]).not.toHaveProperty("price");
  });

  it("treats an empty coupon box as no coupon", () => {
    expect(cartPriceSchema.parse({ lines: [], couponCode: "" }).couponCode).toBeUndefined();
  });

  it("rejects bad product ids, sizes, quantities and objects", () => {
    for (const line of [
      { productId: "x", size: 9, qty: 1 },
      { productId: { $ne: null }, size: 9, qty: 1 },
      { productId: id, size: 13, qty: 1 },
      { productId: id, size: 9, qty: 0 },
      { productId: id, size: 9, qty: 1.5 },
      { productId: id, size: "9", qty: 1 },
    ]) {
      expect(cartPriceSchema.safeParse({ lines: [line] }).success).toBe(false);
    }
  });

  it("caps the bag at 20 different items", () => {
    const lines = Array.from({ length: 21 }, () => ({ productId: id, size: 9, qty: 1 }));
    expect(cartPriceSchema.safeParse({ lines }).success).toBe(false);
  });

  it("rejects coupon codes with symbols", () => {
    expect(cartPriceSchema.safeParse({ lines: [], couponCode: "A$B" }).success).toBe(false);
  });
});

describe("productIdsSchema", () => {
  it("accepts up to 50 valid ids", () => {
    expect(productIdsSchema.safeParse(Array(50).fill(id)).success).toBe(true);
    expect(productIdsSchema.safeParse(Array(51).fill(id)).success).toBe(false);
  });
});

describe("toCard", () => {
  const doc = {
    _id: { toString: () => id },
    slug: "mono-low",
    name: "Mono Low",
    side: "sport",
    line: "street",
    price: 399900,
    colorway: "Off White",
    images: ["/a.webp"],
    sizes: [{ uk: 9, stock: 0, _secret: true }],
    description: "hidden on cards",
    active: true,
  };

  it("keeps only what the shop needs", () => {
    expect(toCard(doc)).toEqual({
      id,
      slug: "mono-low",
      name: "Mono Low",
      side: "sport",
      line: "street",
      price: 399900,
      colorway: "Off White",
      images: ["/a.webp"],
      sizes: [{ uk: 9, stock: 0 }],
      soldOut: true,
    });
  });
});
