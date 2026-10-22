import { evaluateCoupon } from "./coupons.js";
import { MAX_QTY, FREE_SHIPPING_MIN, SHIPPING_FEE } from "./constants.js";

function mergeLines(lines) {
  const merged = new Map();
  for (const { productId, size, qty } of lines) {
    const key = `${productId}:${size}`;
    const current = merged.get(key);
    merged.set(key, {
      productId: String(productId),
      size: Number(size),
      qty: (current?.qty ?? 0) + Number(qty),
    });
  }
  return [...merged.values()];
}

function checkLine(line, product) {
  if (!product || !product.active) return "This item is no longer available";
  const sizeEntry = product.sizes.find((s) => s.uk === line.size);
  if (!sizeEntry) return "This size isn't available";
  if (!Number.isInteger(line.qty) || line.qty < 1)
    return "Choose a valid quantity";
  if (line.qty > MAX_QTY) return `You can buy up to ${MAX_QTY} of each size`;
  if (sizeEntry.stock === 0) return `UK ${line.size} is sold out`;
  if (line.qty > sizeEntry.stock)
    return `Only ${sizeEntry.stock} left in UK ${line.size}`;
  return null;
}

export function priceCart({
  lines,
  products,
  coupon = null,
  now = new Date(),
}) {
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items = [];
  const errors = [];

  for (const line of mergeLines(lines)) {
    const product = byId.get(line.productId);
    const message = checkLine(line, product);
    if (message) {
      errors.push({ productId: line.productId, size: line.size, message });
      continue;
    }
    items.push({
      productId: line.productId,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0] ?? null,
      size: line.size,
      unitPrice: product.price,
      qty: line.qty,
      lineTotal: product.price * line.qty,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  let discount = 0;
  let couponError = null;
  if (coupon) {
    const result = evaluateCoupon(coupon, subtotal, now);
    if (result.ok) discount = result.discount;
    else couponError = result.reason;
  }

  const afterDiscount = subtotal - discount;
  const shipping =
    items.length === 0 || afterDiscount >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;

  return {
    items,
    subtotal,
    discount,
    couponCode: discount > 0 ? coupon.code : null,
    couponError,
    shipping,
    total: afterDiscount + shipping,
    errors,
  };
}
