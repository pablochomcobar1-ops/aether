"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { setOrderStatus } from "@/lib/orders";

export async function changeOrderStatus(orderId, status) {
  await requireAdmin();
  const result = await setOrderStatus(orderId, status);
  // Cancelling puts stock back, so the store's pages need refreshing too.
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
