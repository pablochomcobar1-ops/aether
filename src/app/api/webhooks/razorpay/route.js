import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfilPaidOrder } from "@/lib/orders";

// Razorpay calls this directly, server to server. It is the safety net for customers
// who pay and then close the tab before the success page loads.
export async function POST(request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = event.payload?.order?.entity?.id ?? payment?.order_id;
    await fulfilPaidOrder({ razorpayOrderId, razorpayPaymentId: payment?.id });
  }

  // Always answer 200 for a genuine event, or Razorpay keeps retrying it.
  return NextResponse.json({ received: true });
}
