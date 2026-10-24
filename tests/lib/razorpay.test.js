import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay";

const SECRET = "test_key_secret";
const sign = (text, secret = SECRET) => crypto.createHmac("sha256", secret).update(text).digest("hex");

describe("verifyPaymentSignature", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  it("accepts the signature Razorpay sends for this order and payment", () => {
    expect(verifyPaymentSignature({ orderId, paymentId, signature: sign(`${orderId}|${paymentId}`) }, SECRET)).toBe(true);
  });

  it("rejects a signature for a different payment", () => {
    expect(verifyPaymentSignature({ orderId, paymentId: "pay_OTHER", signature: sign(`${orderId}|${paymentId}`) }, SECRET)).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    expect(verifyPaymentSignature({ orderId, paymentId, signature: sign(`${orderId}|${paymentId}`, "wrong") }, SECRET)).toBe(false);
  });

  it("returns false instead of crashing on missing, short or odd input", () => {
    for (const signature of [undefined, "", "abc", 123, { $ne: 1 }, "z".repeat(64)]) {
      expect(verifyPaymentSignature({ orderId, paymentId, signature }, SECRET)).toBe(false);
    }
    expect(verifyPaymentSignature({ orderId: undefined, paymentId, signature: sign(`undefined|${paymentId}`) }, SECRET)).toBe(false);
  });

  it("refuses to verify without a secret", () => {
    expect(verifyPaymentSignature({ orderId, paymentId, signature: sign(`${orderId}|${paymentId}`, "") }, "")).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });

  it("accepts the exact body Razorpay signed", () => {
    expect(verifyWebhookSignature(body, sign(body, "whsec"), "whsec")).toBe(true);
  });

  it("rejects the body if even one character changed", () => {
    expect(verifyWebhookSignature(body.replace("pay_1", "pay_2"), sign(body, "whsec"), "whsec")).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature(body, null, "whsec")).toBe(false);
  });
});
