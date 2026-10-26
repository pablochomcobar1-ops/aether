import { z } from "zod";
import { INDIAN_STATES } from "./constants.js";
import { ORDER_NUMBER } from "./orderAccess.js";

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
