import { z } from "zod";

import { INDIAN_STATES, LINES, PRICE_RANGE, SIDES, SIZES } from "./constants.js";
import { ORDER_NUMBER } from "./orderAccess.js";

// Zod can speed itself up with eval(). Our Content Security Policy forbids eval, so tell
// zod not to try (it would work anyway, but the browser logs a violation each time).
z.config({ jitless: true });

const email = z
  .string({ error: "Enter a valid email address" })
  .trim()
  .toLowerCase()
  .max(254, "Enter a valid email address")
  .pipe(z.email({ error: "Enter a valid email address" }));

const fitsBcrypt = (value) => new TextEncoder().encode(value).length <= 72;

export const registerSchema = z.object({
  name: z
    .string({ error: "Enter your name (at least 2 letters)" })
    .trim()
    .min(2, "Enter your name (at least 2 letters)")
    .max(60, "Keep your name under 60 characters"),
  email,
  password: z
    .string({ error: "Use at least 8 characters" })
    .min(8, "Use at least 8 characters")
    .refine(fitsBcrypt, "Use 72 characters or fewer"),
});

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Enter your password" })
    .min(1, "Enter your password")
    .refine(fitsBcrypt, "Email or password is incorrect"),
});

export function fieldErrors(error) {
  const out = {};
  for (const issue of error?.issues ?? []) {
    const key = issue.path[0];
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function safeNext(value) {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Unknown product");

export const cartLinesSchema = z
  .array(
    z.object({
      productId: objectId,
      size: z.number().int().min(6).max(12),
      qty: z.number().int().min(1).max(99),
    })
  )
  .max(20, "Your bag can hold up to 20 different items");

export const cartPriceSchema = z.object({
  lines: cartLinesSchema,
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(20)
    .regex(/^[A-Z0-9]*$/, "This code isn't valid")
    .optional()
    .transform((v) => v || undefined),
});

export const productIdsSchema = z.array(objectId).max(50);

const text = (min, max, message) => z.string({ error: message }).trim().min(min, message).max(max, message);

export const addressSchema = z.object({
  name: text(2, 60, "Enter the full name for delivery"),
  phone: z
    .string({ error: "Enter a 10-digit Indian mobile number" })
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number")),
  line1: text(3, 120, "Enter your house number and street"),
  line2: z.string().trim().max(120, "Keep this under 120 characters").optional().default(""),
  city: text(2, 60, "Enter your city"),
  state: z.enum(INDIAN_STATES, { error: "Choose your state" }),
  pincode: z.string({ error: "Enter a 6-digit PIN code" }).trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
});

export const checkoutSchema = z.object({
  lines: cartLinesSchema.min(1, "Your bag is empty"),
  couponCode: cartPriceSchema.shape.couponCode,
  email,
  address: addressSchema,
});

export const trackSchema = z.object({
  orderNumber: z
    .string({ error: "Enter the order number from your email, like AE-7KQ2MX" })
    .trim()
    .toUpperCase()
    .regex(ORDER_NUMBER, "Enter the order number from your email, like AE-7KQ2MX"),
  email,
});

// ---- Admin ----

const IMAGE_PATH = /^\/images\/products\/[a-z0-9-]+\.(webp|jpe?g|png|avif)$/;
const checkbox = z.unknown().optional().transform((v) => v === true || v === "on");
const lineList = (maxItems, maxLength, label) =>
  z
    .string()
    .optional()
    .default("")
    .transform((v) => v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))
    .pipe(
      z
        .array(z.string().max(maxLength, `Keep each ${label} under ${maxLength} characters`))
        .max(maxItems, `Add up to ${maxItems} ${label}s`)
    );

export const productFormSchema = z
  .object({
    name: text(2, 80, "Enter a name (2 to 80 characters)"),
    slug: z
      .string({ error: "Enter a slug, like ae-01-vapor-white" })
      .trim()
      .toLowerCase()
      .max(80, "Keep the slug under 80 characters")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use a-z, 0-9 and single dashes, like ae-01-vapor-white"),
    side: z.enum(SIDES, { error: "Choose a side" }),
    line: z.string({ error: "Choose a collection" }),
    price: z
      .string({ error: "Enter the price in whole rupees, like 9499" })
      .trim()
      .regex(/^\d{1,6}$/, "Enter the price in whole rupees, like 9499")
      .transform((v) => Number(v) * 100),
    colorway: z.string().trim().max(60, "Keep the colourway under 60 characters").optional().default(""),
    description: text(10, 1000, "Write a description (10 to 1000 characters)"),
    details: lineList(8, 200, "detail"),
    images: lineList(8, 200, "image").pipe(
      z.array(z.string().regex(IMAGE_PATH, "Each image must be a path like /images/products/name-1.webp"))
    ),
    featured: checkbox,
    active: checkbox,
  })
  .superRefine((data, ctx) => {
    if (!LINES[data.side].includes(data.line)) {
      ctx.addIssue({ code: "custom", path: ["line"], message: "Pick a collection from this side" });
    }
    const [low, high] = PRICE_RANGE[data.side];
    if (data.price < low || data.price > high) {
      const label = data.side === "sport" ? "Sport" : "Atelier";
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: `${label} shoes are priced ₹${(low / 100).toLocaleString("en-IN")} to ₹${(high / 100).toLocaleString("en-IN")}`,
      });
    }
  });

export const stockSchema = z.object({
  productId: objectId,
  uk: z.number().int().refine((v) => SIZES.includes(v), "Unknown size"),
  stock: z.number({ error: "Enter a whole number" }).int("Enter a whole number").min(0, "Stock can't be negative").max(999, "Keep stock under 1000"),
});

export const objectIdSchema = objectId;

const optionalWhole = (message, min) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || String(v).trim() === "" ? null : String(v).trim()))
    .pipe(z.string().regex(/^\d{1,7}$/, message).transform(Number).refine((n) => n >= min, message).nullable());

export const couponFormSchema = z
  .object({
    code: z
      .string({ error: "Use 3 to 20 letters or numbers" })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, "Use 3 to 20 letters or numbers"),
    type: z.enum(["percent", "flat"], { error: "Choose percent or flat" }),
    value: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
    minSubtotal: optionalWhole("Enter whole rupees, or leave empty", 0),
    maxUses: optionalWhole("Enter a number of 1 or more, or leave empty", 1),
    expiresAt: z
      .string()
      .optional()
      .transform((v) => v?.trim() || null)
      .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date").nullable()),
    active: z.unknown().optional().transform((v) => v === true || v === "on"),
  })
  // `when` makes this run even if other fields failed, so every problem shows at once.
  .superRefine(
    (data, ctx) => {
      const raw = String(data?.value ?? "").trim();
      const whole = /^\d{1,7}$/.test(raw) ? Number(raw) : NaN;
      const percent = data?.type === "percent";
      if (percent ? whole >= 1 && whole <= 90 : whole >= 1) return;
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: percent ? "Enter a percent from 1 to 90" : "Enter whole rupees, like 500",
      });
    },
    { when: () => true }
  )
  .transform((data, ctx) => {
    const whole = Number(data.value);
    let expiresAt = null;
    if (data.expiresAt) {
      // The code works until midnight India time at the end of the chosen day.
      expiresAt = new Date(`${data.expiresAt}T23:59:59.999+05:30`);
      expiresAt = new Date(expiresAt.getTime() + 1);
      if (Number.isNaN(expiresAt.getTime())) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Pick a date" });
        return z.NEVER;
      }
    }
    return {
      code: data.code,
      type: data.type,
      value: data.type === "percent" ? whole : whole * 100,
      minSubtotal: (data.minSubtotal ?? 0) * 100,
      maxUses: data.maxUses,
      expiresAt,
      active: data.active,
    };
  });
