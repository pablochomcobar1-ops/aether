import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import { getProductsByIds } from "@/lib/catalog";
import { createCheckout } from "@/lib/checkout";
import { createRazorpayOrder } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rateLimit";
import { getSession } from "@/lib/session";
import { clientIp, jsonError, readJson, sameOrigin, tooMany } from "@/lib/http";
import { LAST_ORDER_COOKIE } from "@/lib/orderAccess";

function toRazorpayContact(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91${digits}` : "";
}

const deps = {
  loadProducts: getProductsByIds,
  loadCoupon: async (code) => {
    await connectDB();
    return Coupon.findOne({ code }).lean();
  },
  createRazorpayOrder,
  saveOrder: async (order) => {
    await connectDB();
    return Order.create(order);
  },
};

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError(403, "This request isn't allowed.");

  const limit = await rateLimit(`checkout:${clientIp(request)}`, { limit: 10, windowSec: 60 });
  if (!limit.ok) return tooMany(limit.retryAfter);

  const body = await readJson(request);
  if (!body) return jsonError(400, "That request couldn't be read. Try again.");

  const result = await createCheckout({ body, session: await getSession() }, deps);
  if (!result.ok) return NextResponse.json({ error: result.error.message, ...result.error }, { status: result.status });

  const response = NextResponse.json(
    {
      ...result.data,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      // Razorpay wants the country code, or it asks for the number again.
      prefill: { name: body.address?.name ?? "", email: body.email ?? "", contact: toRazorpayContact(body.address?.phone) },
    },
    { status: 201 }
  );
  // Only this browser gets to open the success page for this order (see lib/orderAccess.js).
  response.cookies.set(LAST_ORDER_COOKIE, result.data.orderNumber, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return response;
}
