import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db.js";
import Product from "../src/models/Product.js";
import Coupon from "../src/models/Coupon.js";
import User from "../src/models/User.js";
import { products, coupons, retiredSlugs } from "./seed-data.mjs";

// Existing shoes keep their live stock: re-running the seed updates text and prices only.
async function upsert(Model, key, data, { keep = [] } = {}) {
  const existing = await Model.findOne({ [key]: data[key] });
  const doc = existing ?? new Model();
  const fields = existing ? Object.fromEntries(Object.entries(data).filter(([k]) => !keep.includes(k))) : data;
  doc.set(fields);
  await doc.save();
}

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Skipped admin: set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
    return;
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await upsert(User, "email", { name: "AETHER Admin", email: ADMIN_EMAIL.toLowerCase(), passwordHash, role: "admin" });
  console.log(`Admin ready: ${ADMIN_EMAIL}`);
}

await connectDB();
for (const product of products) await upsert(Product, "slug", product, { keep: ["sizes", "active"] });
console.log(`Products ready: ${products.length}`);
const retired = await Product.updateMany({ slug: { $in: retiredSlugs } }, { active: false });
if (retired.modifiedCount) console.log(`Old shoes hidden: ${retired.modifiedCount}`);
for (const coupon of coupons) await upsert(Coupon, "code", coupon, { keep: ["uses", "active"] });
console.log(`Coupons ready: ${coupons.map((c) => c.code).join(", ")}`);
await seedAdmin();
await mongoose.disconnect();
