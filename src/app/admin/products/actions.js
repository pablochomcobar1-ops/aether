"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { saveProductData, setSizeStock, toggleProductActive } from "@/lib/admin";

// Anyone can call a server action directly, without the admin pages. So every action
// checks the role itself, from the database, before doing anything.

function refreshStore() {
  // Prices, stock and visibility show up across the whole store.
  revalidatePath("/", "layout");
}

export async function saveProduct(id, input) {
  await requireAdmin();
  const result = await saveProductData(input, id ?? null);
  if (result.ok) refreshStore();
  return result;
}

export async function setStock(productId, uk, stock) {
  await requireAdmin();
  const result = await setSizeStock({ productId, uk, stock });
  if (result.ok) refreshStore();
  return result;
}

export async function toggleActive(productId) {
  await requireAdmin();
  const result = await toggleProductActive(productId);
  if (result.ok) refreshStore();
  return result;
}
