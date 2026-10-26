import { trackSchema, fieldErrors } from "./validators.js";

// One message for "no such order" and "wrong email", so the form can't be used
// to find out which order numbers exist.
export const NOT_FOUND = "We couldn't find that order. Check the number and email.";

export async function trackOrder(body, loadOrder) {
  const parsed = trackSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) };
  }
  const { orderNumber, email } = parsed.data;
  const order = await loadOrder({ orderNumber, email, status: { $ne: "pending" } });
  if (!order) return { ok: false, status: 404, error: NOT_FOUND };
  return { ok: true, order };
}
