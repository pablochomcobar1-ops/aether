import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { SIZES } from "./constants.js";
import { fieldErrors, objectIdSchema, productFormSchema, stockSchema } from "./validators.js";

// These functions trust nothing about the caller. The server actions that use them
// check the admin role first; these check the data.

const PAID_STATUSES = ["paid", "packed", "shipped", "delivered"];
export const LOW_STOCK = 2;
const IST_OFFSET = 330 * 60 * 1000;

// Midnight in India, as a UTC Date. Vercel runs in UTC, so "today" has to be worked out.
export function istStart(now, unit) {
  const ist = new Date(now.getTime() + IST_OFFSET);
  const day = unit === "month" ? 1 : ist.getUTCDate();
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), day) - IST_OFFSET);
}

export async function getDashboard(now = new Date()) {
  await connectDB();
  const [today, month, lowStock, refunds] = await Promise.all([
    Order.countDocuments({ status: { $in: PAID_STATUSES }, createdAt: { $gte: istStart(now, "day") } }),
    Order.aggregate([
      { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: istStart(now, "month") } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    Product.find({ active: true, sizes: { $elemMatch: { stock: { $lte: LOW_STOCK } } } })
      .select("name colorway slug sizes")
      .sort({ name: 1 })
      .lean(),
    Order.find({ stockIssue: true, status: { $ne: "cancelled" } })
      .select("orderNumber email total createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    paidToday: today,
    revenueThisMonth: month[0]?.revenue ?? 0,
    ordersThisMonth: month[0]?.orders ?? 0,
    lowStock: lowStock.map((p) => ({
      id: String(p._id),
      name: p.name,
      colorway: p.colorway ?? "",
      sizes: p.sizes.filter((s) => s.stock <= LOW_STOCK).map(({ uk, stock }) => ({ uk, stock })),
    })),
    refunds: refunds.map((o) => ({ id: String(o._id), orderNumber: o.orderNumber, email: o.email, total: o.total })),
  };
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listAdminProducts(q) {
  await connectDB();
  const search = typeof q === "string" ? q.trim().slice(0, 60) : "";
  const filter = search
    ? { $or: ["name", "slug", "colorway"].map((f) => ({ [f]: new RegExp(escapeRegex(search), "i") })) }
    : {};
  return Product.find(filter).sort({ side: -1, line: 1, name: 1 }).lean();
}

export async function getAdminProduct(id) {
  if (!objectIdSchema.safeParse(id).success) return null;
  await connectDB();
  return Product.findById(id).lean();
}

export async function saveProductData(input, id = null) {
  const parsed = productFormSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) };
  if (id !== null && !objectIdSchema.safeParse(id).success) return { ok: false, error: "That product doesn't exist." };

  await connectDB();
  try {
    let product;
    if (id) {
      product = await Product.findById(id);
      if (!product) return { ok: false, error: "That product doesn't exist." };
      product.set(parsed.data);
      await product.save();
    } else {
      // New shoes start with every size at zero; stock is set on the next screen.
      product = await Product.create({ ...parsed.data, sizes: SIZES.map((uk) => ({ uk, stock: 0 })) });
    }
    return { ok: true, product: { id: String(product._id), slug: product.slug } };
  } catch (error) {
    if (error?.code === 11000) {
      return { ok: false, error: "Check the highlighted fields.", fields: { slug: "Another product already uses this slug" } };
    }
    if (error instanceof mongoose.Error.ValidationError) {
      const fields = Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v.message]));
      return { ok: false, error: "Check the highlighted fields.", fields };
    }
    throw error;
  }
}

export async function setSizeStock(input) {
  const parsed = stockSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { productId, uk, stock } = parsed.data;

  await connectDB();
  let result = await Product.updateOne({ _id: productId, "sizes.uk": uk }, { $set: { "sizes.$.stock": stock } });
  if (!result.matchedCount) {
    result = await Product.updateOne({ _id: productId, "sizes.uk": { $ne: uk } }, { $push: { sizes: { uk, stock } } });
  }
  if (!result.matchedCount) return { ok: false, error: "That product doesn't exist." };
  return { ok: true, uk, stock };
}

export async function toggleProductActive(id) {
  if (!objectIdSchema.safeParse(id).success) return { ok: false, error: "That product doesn't exist." };
  await connectDB();
  // One atomic flip, so two quick clicks can't leave it in a confused state.
  const product = await Product.findOneAndUpdate({ _id: id }, [{ $set: { active: { $not: "$active" } } }], {
    returnDocument: "after",
    updatePipeline: true,
  })
    .select("active slug")
    .lean();
  if (!product) return { ok: false, error: "That product doesn't exist." };
  return { ok: true, active: product.active, slug: product.slug };
}
