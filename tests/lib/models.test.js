import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Product from "@/models/Product";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import Order from "@/models/Order";

function validProduct(overrides = {}) {
  return {
    slug: "volt-runner",
    name: "Volt Runner",
    side: "sport",
    line: "run",
    price: 849900,
    description: "A light daily trainer.",
    sizes: [
      { uk: 8, stock: 4 },
      { uk: 9, stock: 0 },
    ],
    ...overrides,
  };
}

async function errorsFor(Model, data) {
  try {
    await new Model(data).validate();
    return {};
  } catch (error) {
    return error.errors;
  }
}

describe("Product", () => {
  it("accepts a valid product", async () => {
    expect(await errorsFor(Product, validProduct())).toEqual({});
  });

  it("rejects a sport price below ₹3,000", async () => {
    const errors = await errorsFor(Product, validProduct({ price: 250000 }));
    expect(errors.price).toBeDefined();
  });

  it("rejects an atelier price above ₹20,000", async () => {
    const errors = await errorsFor(
      Product,
      validProduct({ side: "atelier", line: "formal", price: 2100000 }),
    );
    expect(errors.price).toBeDefined();
  });

  it("rejects a collection from the other side", async () => {
    const errors = await errorsFor(
      Product,
      validProduct({ line: "old-money" }),
    );
    expect(errors.line).toBeDefined();
  });

  it("rejects UK 13", async () => {
    const errors = await errorsFor(
      Product,
      validProduct({ sizes: [{ uk: 13, stock: 1 }] }),
    );
    expect(errors["sizes.0.uk"]).toBeDefined();
  });

  it("rejects negative or fractional stock", async () => {
    expect(
      (
        await errorsFor(
          Product,
          validProduct({ sizes: [{ uk: 8, stock: -1 }] }),
        )
      )["sizes.0.stock"],
    ).toBeDefined();
    expect(
      (
        await errorsFor(
          Product,
          validProduct({ sizes: [{ uk: 8, stock: 1.5 }] }),
        )
      )["sizes.0.stock"],
    ).toBeDefined();
  });

  it("rejects the same size twice", async () => {
    const errors = await errorsFor(
      Product,
      validProduct({
        sizes: [
          { uk: 8, stock: 1 },
          { uk: 8, stock: 2 },
        ],
      }),
    );
    expect(errors.sizes).toBeDefined();
  });
});

describe("User", () => {
  it("stores email in lowercase", () => {
    const user = new User({
      name: "Test",
      email: "  A@B.com ",
      passwordHash: "x",
    });
    expect(user.email).toBe("a@b.com");
  });

  it("defaults to the customer role", () => {
    expect(new User({}).role).toBe("customer");
  });
});

describe("Coupon", () => {
  it("rejects a percent discount over 90", async () => {
    const errors = await errorsFor(Coupon, {
      code: "HUGE",
      type: "percent",
      value: 95,
    });
    expect(errors.value).toBeDefined();
  });

  it("stores codes in uppercase", () => {
    expect(new Coupon({ code: "welcome10" }).code).toBe("WELCOME10");
  });
});

describe("Order", () => {
  it("rejects an unknown status", async () => {
    const errors = await errorsFor(Order, {
      orderNumber: "AE-ABC123",
      email: "a@b.com",
      address: {
        name: "A",
        phone: "9876543210",
        line1: "1",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          slug: "x",
          name: "X",
          size: 9,
          unitPrice: 100,
          qty: 1,
        },
      ],
      subtotal: 100,
      shipping: 0,
      total: 100,
      razorpayOrderId: "order_1",
      status: "lost",
    });
    expect(Object.keys(errors)).toEqual(["status"]);
  });
});
