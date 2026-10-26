// Turns a stored order into what customers see: a status timeline and a trimmed copy
// with no phone, street address, email or payment ids.
const STEPS = ["paid", "packed", "shipped", "delivered"];
export const STATUS_LABELS = {
  pending: "Awaiting payment",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function reachedAt(history, status) {
  const entry = history.findLast((h) => h.status === status);
  return entry ? new Date(entry.at) : null;
}

export function orderTimeline({ status, statusHistory = [] }) {
  if (status === "cancelled") {
    const reached = STEPS.filter((s) => reachedAt(statusHistory, s));
    return [
      ...reached.map((s) => ({ status: s, label: STATUS_LABELS[s], at: reachedAt(statusHistory, s), state: "done" })),
      { status: "cancelled", label: STATUS_LABELS.cancelled, at: reachedAt(statusHistory, "cancelled"), state: "cancelled" },
    ];
  }
  const current = STEPS.indexOf(status);
  return STEPS.map((s, i) => ({
    status: s,
    label: STATUS_LABELS[s],
    at: reachedAt(statusHistory, s),
    state: i < current ? "done" : i === current ? "current" : "upcoming",
  }));
}

export function toPublicOrder(order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: new Date(order.createdAt).toISOString(),
    items: order.items.map(({ slug, name, image, size, qty, unitPrice }) => ({
      slug,
      name,
      image: image ?? null,
      size,
      qty,
      lineTotal: unitPrice * qty,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode ?? null,
    shipping: order.shipping,
    total: order.total,
    city: order.address?.city ?? "",
    state: order.address?.state ?? "",
    stockIssue: Boolean(order.stockIssue),
    timeline: orderTimeline(order).map((step) => ({ ...step, at: step.at ? step.at.toISOString() : null })),
  };
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const formatOrderDate = (value) => dateFormat.format(new Date(value));
