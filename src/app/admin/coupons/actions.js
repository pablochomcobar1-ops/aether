"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { saveCouponData, toggleCouponActive } from "@/lib/admin";

export async function saveCoupon(id, input) {
  await requireAdmin();
  const result = await saveCouponData(input, id ?? null);
  if (result.ok) revalidatePath("/admin/coupons");
  return result;
}

export async function toggleCoupon(id) {
  await requireAdmin();
  const result = await toggleCouponActive(id);
  if (result.ok) revalidatePath("/admin/coupons");
  return result;
}
