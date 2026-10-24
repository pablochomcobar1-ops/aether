import crypto from "node:crypto";
import Razorpay from "razorpay";

let client;

function getClient() {
  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = process.env;
  if (!keyId || !keySecret) throw new Error("Razorpay keys are missing. Add them to .env.local");
  if (!keyId.startsWith("rzp_test_")) throw new Error("This demo store only accepts Razorpay test keys (rzp_test_...)");
  client ??= new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

export async function createRazorpayOrder({ amount, receipt, notes }) {
  const order = await getClient().orders.create({ amount, currency: "INR", receipt, notes });
  return { id: order.id, amount: order.amount, currency: order.currency };
}

const hmac = (secret, text) => crypto.createHmac("sha256", secret).update(text).digest("hex");

// Constant-time comparison, so an attacker can't learn the right signature by timing guesses.
function sameHex(expected, given) {
  if (typeof given !== "string" || !/^[a-f0-9]{64}$/.test(given)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(given, "hex"));
}

export function verifyPaymentSignature({ orderId, paymentId, signature }, secret = process.env.RAZORPAY_KEY_SECRET) {
  if (!secret || typeof orderId !== "string" || typeof paymentId !== "string" || !orderId || !paymentId) return false;
  return sameHex(hmac(secret, `${orderId}|${paymentId}`), signature);
}

export function verifyWebhookSignature(rawBody, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret || typeof rawBody !== "string") return false;
  return sameHex(hmac(secret, rawBody), signature);
}
