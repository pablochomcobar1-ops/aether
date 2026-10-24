import { connectDB } from "./db.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { sendOrderConfirmation } from "./email.js";

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
async function takeStock(items) {
  let short = false;
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.productId, sizes: { $elemMatch: { uk: item.size, stock: { $gte: item.qty } } } },
      { $inc: { "sizes.$.stock": -item.qty } }
    );
    if (result.modifiedCount !== 1) short = true;
  }
  return short;
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

  if (await takeStock(order.items)) await Order.updateOne({ _id: order._id }, { stockIssue: true });
  if (order.couponCode) await Coupon.updateOne({ code: order.couponCode }, { $inc: { uses: 1 } });
  await emailOnce(order, sendEmail);

  return { order: await Order.findById(order._id), alreadyPaid: false };
}
