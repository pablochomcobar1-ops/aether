import { connectDB } from "./db.js";
import Product from "../models/Product.js";
import { SIDES, LINES, SIZES } from "./constants.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toPaise(value) {
  const rupees = Number(value);
  return Number.isFinite(rupees) && rupees >= 0 ? Math.round(rupees * 100) : null;
}

export function buildProductFilter({ side, line, size, min, max, q } = {}) {
  const filter = { active: true };

  if (SIDES.includes(side)) filter.side = side;
  if (Object.values(LINES).flat().includes(line)) filter.line = line;

  const uk = Number(size);
  if (SIZES.includes(uk)) filter.sizes = { $elemMatch: { uk, stock: { $gt: 0 } } };

  const minPaise = toPaise(min);
  const maxPaise = toPaise(max);
  if (minPaise !== null || maxPaise !== null) {
    filter.price = {};
    if (minPaise !== null) filter.price.$gte = minPaise;
    if (maxPaise !== null) filter.price.$lte = maxPaise;
  }

  const search = typeof q === "string" ? q.trim().slice(0, 60) : "";
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { colorway: pattern }];
  }

  return filter;
}

export async function listProducts(params) {
  await connectDB();
  return Product.find(buildProductFilter(params)).sort({ featured: -1, price: 1 }).lean();
}

export async function getProductBySlug(slug) {
  if (typeof slug !== "string") return null;
  await connectDB();
  return Product.findOne({ slug, active: true }).lean();
}

export async function getFeatured(side) {
  if (!SIDES.includes(side)) return [];
  await connectDB();
  return Product.find({ side, active: true, featured: true }).sort({ price: 1 }).limit(4).lean();
}

export function toCard(product) {
  const sizes = product.sizes.map(({ uk, stock }) => ({ uk, stock }));
  return {
    id: String(product._id),
    slug: product.slug,
    name: product.name,
    side: product.side,
    line: product.line,
    price: product.price,
    colorway: product.colorway ?? "",
    images: product.images ?? [],
    sizes,
    soldOut: sizes.every((s) => s.stock === 0),
  };
}

export function toDetail(product) {
  return { ...toCard(product), description: product.description, details: product.details ?? [] };
}

export async function getProductsByIds(ids) {
  await connectDB();
  return Product.find({ _id: { $in: ids } }).lean();
}

export async function getRelated(product, limit = 3) {
  await connectDB();
  return Product.find({ line: product.line, active: true, _id: { $ne: product._id } }).limit(limit).lean();
}
