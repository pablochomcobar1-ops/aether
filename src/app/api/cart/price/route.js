import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { getProductsByIds, toCard } from "@/lib/catalog";
import { priceCart } from "@/lib/pricing";
import { cartPriceSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp, jsonError, readJson, tooMany } from "@/lib/http";

export async function POST(request) {
  const body = await readJson(request);
  const parsed = cartPriceSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Your bag couldn't be read. Try refreshing the page.");
  const { lines, couponCode } = parsed.data;

  let coupon = null;
  if (couponCode) {
    const limit = await rateLimit(`coupon:${clientIp(request)}`, { limit: 20, windowSec: 600 });
    if (!limit.ok) return tooMany(limit.retryAfter);
    await connectDB();
    coupon = (await Coupon.findOne({ code: couponCode }).lean()) ?? { code: couponCode, active: false };
  }

  const products = lines.length ? await getProductsByIds([...new Set(lines.map((l) => l.productId))]) : [];
  const result = priceCart({ lines, products, coupon });
  const cards = new Map(products.map((p) => [String(p._id), toCard(p)]));
  const priced = new Map(result.items.map((i) => [`${i.productId}:${i.size}`, i]));
  const failed = new Map(result.errors.map((e) => [`${e.productId}:${e.size}`, e.message]));

  const merged = new Map();
  for (const line of lines) merged.set(`${line.productId}:${line.size}`, line);

  const rows = [...merged.entries()].map(([key, line]) => {
    const card = cards.get(line.productId);
    const item = priced.get(key);
    const stock = card?.sizes.find((s) => s.uk === line.size)?.stock ?? 0;
    return {
      productId: line.productId,
      size: line.size,
      qty: item?.qty ?? line.qty,
      slug: card?.slug ?? null,
      name: card?.name ?? "Unavailable item",
      colorway: card?.colorway ?? "",
      image: card?.images[0] ?? null,
      unitPrice: card?.price ?? 0,
      lineTotal: item?.lineTotal ?? 0,
      maxQty: Math.min(5, stock),
      error: failed.get(key) ?? null,
    };
  });

  return NextResponse.json({
    rows,
    subtotal: result.subtotal,
    discount: result.discount,
    couponCode: result.couponCode,
    couponError: result.couponError,
    shipping: result.shipping,
    total: result.total,
    hasErrors: result.errors.length > 0,
  });
}
