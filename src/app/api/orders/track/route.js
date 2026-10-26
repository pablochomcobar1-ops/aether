import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { trackOrder } from "@/lib/tracking";
import { toPublicOrder } from "@/lib/orderView";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp, jsonError, readJson, sameOrigin, tooMany } from "@/lib/http";

async function loadOrder(query) {
  await connectDB();
  return Order.findOne(query).lean();
}

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError(403, "This request isn't allowed.");

  // 10 lookups per 15 minutes per IP: plenty for a customer, far too slow to guess numbers.
  const limit = await rateLimit(`track:${clientIp(request)}`, { limit: 10, windowSec: 15 * 60 });
  if (!limit.ok) return tooMany(limit.retryAfter);

  const result = await trackOrder(await readJson(request), loadOrder);
  if (!result.ok) return NextResponse.json({ error: result.error, fields: result.fields }, { status: result.status });
  return NextResponse.json({ order: toPublicOrder(result.order) });
}
