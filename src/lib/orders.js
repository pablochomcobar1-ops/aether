import { connectDB } from "./db.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { sendOrderConfirmation } from "./email.js";
import { ORDER_STATUSES } from "./constants.js";
import { objectIdSchema } from "./validators.js";

// Claims the "email sent" flag first, so two confirmations can never both send.
async function emailOnce(order, sendEmail) {
  const claimed = await Order.findOneAndUpdate({ _id: order._id, emailSent: false }, { emailSent: true });
  if (!claimed) return;
  try {
    await sendEmail(order);
  } catch (error) {
    console.error(`[orders] confirmation email failed for ${order.orderNumber}: ${error.message}`);
    await Order.updateOne({ _id: order._id }, { emailSent: false });
  }
}

// Takes stock only if enough is left. Two buyers can never both get the last pair.
// Returns one true/false per item: was it taken?
async function takeStock(items) {
  const taken = [];
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.productId, sizes: { $elemMatch: { uk: item.size, stock: { $gte: item.qty } } } },
      { $inc: { "sizes.$.stock": -item.qty } }
    );
    taken.push(result.modifiedCount === 1);
  }
  return taken;
}

export async function fulfilPaidOrder(
  { razorpayOrderId, razorpayPaymentId },
  { sendEmail = sendOrderConfirmation } = {},
  now = new Date()
) {
  if (typeof razorpayOrderId !== "string" || typeof razorpayPaymentId !== "string") {
    return { order: null, alreadyPaid: false };
  }
  await connectDB();

  // Only one caller can move an order from pending to paid. Everyone else gets "already paid".
  const order = await Order.findOneAndUpdate(
    { razorpayOrderId, status: "pending" },
    { $set: { status: "paid", razorpayPaymentId }, $push: { statusHistory: { status: "paid", at: now } } },
    { returnDocument: "after" }
  );

  if (!order) {
    const existing = await Order.findOne({ razorpayOrderId });
    if (existing?.status === "paid" && !existing.emailSent) {
      await emailOnce(existing, sendEmail);
      return { order: await Order.findById(existing._id), alreadyPaid: true };
    }
    return { order: existing, alreadyPaid: Boolean(existing) };
  }

  const taken = await takeStock(order.items);
  const flags = Object.fromEntries(taken.map((ok, i) => [`items.${i}.stockTaken`, ok]));
  await Order.updateOne({ _id: order._id }, { $set: { ...flags, stockIssue: taken.includes(false) } });
  if (order.couponCode) await Coupon.updateOne({ code: order.couponCode }, { $inc: { uses: 1 } });
  await emailOnce(order, sendEmail);

  return { order: await Order.findById(order._id), alreadyPaid: false };
}

const FLOW = {
  pending: [],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function nextStatuses(current) {
  return Object.hasOwn(FLOW, current) ? FLOW[current] : [];
}

// Puts back only what was taken. Orders from before `stockTaken` existed: everything was
// taken unless the order was flagged short.
async function returnStock(order) {
  for (const item of order.items) {
    if (!(item.stockTaken ?? !order.stockIssue)) continue;
    await Product.updateOne({ _id: item.productId, "sizes.uk": item.size }, { $inc: { "sizes.$.stock": item.qty } });
  }
}

export async function setOrderStatus(orderId, status, now = new Date()) {
  if (!objectIdSchema.safeParse(orderId).success) return { ok: false, error: "That order doesn't exist." };
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
  await connectDB();

  const current = await Order.findById(orderId).select("status").lean();
  if (!current) return { ok: false, error: "That order doesn't exist." };
  if (!nextStatuses(current.status).includes(status)) {
    return { ok: false, error: `A ${current.status} order can't be marked ${status}.` };
  }

  // Matching on the old status makes the move atomic: if two admins (or two clicks) race,
  // only one update finds the order still in its old status.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: current.status },
    { $set: { status }, $push: { statusHistory: { status, at: now } } },
    { returnDocument: "after" }
  ).lean();
  if (!order) return { ok: false, error: "This order just changed. Refresh to see its new status." };

  if (status === "cancelled") await returnStock(order);
  return { ok: true, status };
}
