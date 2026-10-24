import crypto from "node:crypto";
import { checkoutSchema } from "./validators.js";
import { priceCart } from "./pricing.js";

// No 0/O or 1/I/L, so order numbers are easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newOrderNumber() {
  let code = "AE-";
  for (let i = 0; i < 6; i++) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return code;
}

function checkoutFieldErrors(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path[0] === "address" ? issue.path[1] : issue.path[0];
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}

const fail = (status, error) => ({ ok: false, status, error });

export async function createCheckout({ body, session }, deps, now = new Date()) {
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const fields = checkoutFieldErrors(parsed.error);
    return fail(400, { message: fields.lines ?? "Check the highlighted fields.", fields });
  }
  const { lines, couponCode, email, address } = parsed.data;

  const products = await deps.loadProducts([...new Set(lines.map((l) => l.productId))]);
  const coupon = couponCode ? ((await deps.loadCoupon(couponCode)) ?? { code: couponCode, active: false }) : null;
  const priced = priceCart({ lines, products, coupon, now });

  if (priced.errors.length) {
    return fail(409, { message: "Some items in your bag changed. Check them and try again.", items: priced.errors });
  }
  if (coupon && priced.couponError) {
    return fail(409, { message: priced.couponError, coupon: priced.couponError });
  }
  if (!priced.items.length) return fail(400, { message: "Your bag is empty" });

  const orderNumber = newOrderNumber();
  let payment;
  try {
    payment = await deps.createRazorpayOrder({ amount: priced.total, receipt: orderNumber, notes: { orderNumber } });
  } catch {
    return fail(502, { message: "Payments are unavailable right now. Try again in a minute." });
  }
  if (payment.amount !== priced.total) {
    return fail(502, { message: "Payments are unavailable right now. Try again in a minute." });
  }

  await deps.saveOrder({
    orderNumber,
    userId: session?.userId ?? null,
    email,
    address,
    items: priced.items.map(({ productId, slug, name, image, size, unitPrice, qty }) => ({ productId, slug, name, image, size, unitPrice, qty })),
    subtotal: priced.subtotal,
    discount: priced.discount,
    couponCode: priced.couponCode,
    shipping: priced.shipping,
    total: priced.total,
    razorpayOrderId: payment.id,
    status: "pending",
    statusHistory: [{ status: "pending", at: now }],
  });

  return { ok: true, data: { orderNumber, razorpayOrderId: payment.id, amount: priced.total, currency: "INR" } };
}
