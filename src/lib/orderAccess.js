// Who may see an order's details (name, address, items) on the success page.
// Order numbers can be guessed in theory, so the number alone is never enough.
export const LAST_ORDER_COOKIE = "aether_last_order";
export const ORDER_NUMBER = /^AE-[A-Z0-9]{6}$/;

export function canViewOrder(order, { session, lastOrder } = {}) {
  if (!order) return false;
  if (session?.userId && order.userId && String(order.userId) === String(session.userId)) return true;
  return typeof lastOrder === "string" && lastOrder === order.orderNumber;
}
