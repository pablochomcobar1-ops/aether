import { formatINR } from "./money.js";

export function evaluateCoupon(coupon, subtotal, now = new Date()) {
  const fail = (reason) => ({ ok: false, discount: 0, reason });

  if (!coupon || !coupon.active) return fail("This code isn't valid");
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now)
    return fail("This code has expired");
  if (coupon.maxUses != null && coupon.uses >= coupon.maxUses)
    return fail("This code has been fully used");
  if (subtotal < coupon.minSubtotal) {
    return fail(
      `Add ${formatINR(coupon.minSubtotal - subtotal)} more to use this code`,
    );
  }

  const raw =
    coupon.type === "percent"
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value;
  return { ok: true, discount: Math.min(raw, subtotal) };
}
