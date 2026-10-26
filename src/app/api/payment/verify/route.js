import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { fulfilPaidOrder } from "@/lib/orders";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp, jsonError, readJson, sameOrigin, tooMany } from "@/lib/http";

// Called by the checkout page right after Razorpay's popup reports success.
export async function POST(request) {
  if (!sameOrigin(request)) return jsonError(403, "This request isn't allowed.");

  const limit = await rateLimit(`verify:${clientIp(request)}`, { limit: 20, windowSec: 60 });
  if (!limit.ok) return tooMany(limit.retryAfter);

  const body = await readJson(request);
  const ids = {
    orderId: body?.razorpay_order_id,
    paymentId: body?.razorpay_payment_id,
    signature: body?.razorpay_signature,
  };
  if (!verifyPaymentSignature(ids)) {
    return jsonError(400, "We couldn't confirm this payment yet. Please don't pay again. If money left your account, we'll match it to your order or refund it.");
  }

  const { order } = await fulfilPaidOrder({ razorpayOrderId: ids.orderId, razorpayPaymentId: ids.paymentId });
  if (!order) return jsonError(404, "We couldn't find this order.");

  return NextResponse.json({ orderNumber: order.orderNumber, status: order.status });
}
