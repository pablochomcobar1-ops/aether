import { describe, it, expect } from "vitest";
import { buildOrderEmail } from "@/lib/email";

const order = {
  orderNumber: "AE-7KQ2XM",
  email: "buyer@example.com",
  address: { name: "<script>alert(1)</script>", phone: "9876543210", line1: "12 Road", line2: "", city: "Ahmedabad", state: "Gujarat", pincode: "380015" },
  items: [{ name: "AE-01 Vapor", size: 9, qty: 2, unitPrice: 949900 }],
  subtotal: 1899800,
  discount: 189980,
  couponCode: "WELCOME10",
  shipping: 0,
  total: 1709820,
};

describe("buildOrderEmail", () => {
  const email = buildOrderEmail(order, "https://aether.example");

  it("has a clear subject with the order number", () => {
    expect(email.subject).toBe("Order AE-7KQ2XM confirmed");
  });

  it("shows items and totals in rupees", () => {
    expect(email.html).toContain("AE-01 Vapor");
    expect(email.html).toContain("₹18,998");
    expect(email.html).toContain("−₹1,899.80");
    expect(email.html).toContain("₹17,098.20");
    expect(email.text).toContain("Total: ₹17,098.20");
  });

  it("escapes customer text so it can't inject HTML into the email", () => {
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("links to order tracking", () => {
    expect(email.html).toContain("https://aether.example/orders/track");
  });
});
