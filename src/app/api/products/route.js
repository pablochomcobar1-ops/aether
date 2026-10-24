import { NextResponse } from "next/server";
import { getProductsByIds, toCard } from "@/lib/catalog";
import { productIdsSchema } from "@/lib/validators";
import { jsonError } from "@/lib/http";

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const parsed = productIdsSchema.safeParse(raw ? raw.split(",") : []);
  if (!parsed.success) return jsonError(400, "Those products couldn't be found.");
  if (!parsed.data.length) return NextResponse.json({ products: [] });

  const order = new Map(parsed.data.map((id, i) => [id, i]));
  const products = (await getProductsByIds(parsed.data))
    .filter((p) => p.active)
    .map(toCard)
    .sort((a, b) => order.get(a.id) - order.get(b.id));
  return NextResponse.json({ products });
}
