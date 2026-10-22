import mongoose from "mongoose";
import { SIZES, ORDER_STATUSES } from "@/lib/constants";

const wholePaise = {
  validator: Number.isInteger,
  message: "Amounts must be whole paise",
};

const itemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: String,
    size: { type: Number, required: true, enum: SIZES },
    unitPrice: { type: Number, required: true, min: 0, validate: wholePaise },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const money = { type: Number, required: true, min: 0, validate: wholePaise };

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^AE-[A-Z0-9]{6}$/,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: addressSchema, required: true },
    items: {
      type: [itemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "An order needs at least one item",
      },
    },
    subtotal: money,
    discount: { ...money, default: 0 },
    couponCode: { type: String, default: null },
    shipping: money,
    total: money,
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    stockIssue: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
