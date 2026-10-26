import { connectDB } from "./db.js";
import RateLimit from "../models/RateLimit.js";

export async function rateLimit(key, { limit, windowSec }, now = new Date()) {
  await connectDB();

  let entry = await RateLimit.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: "after" }
  );

  if (!entry) {
    try {
      entry = await RateLimit.findOneAndUpdate(
        { key, expiresAt: { $lte: now } },
        { $set: { count: 1, expiresAt: new Date(now.getTime() + windowSec * 1000) } },
        { returnDocument: "after", upsert: true }
      );
    } catch (error) {
      if (error?.code !== 11000) throw error;
      return rateLimit(key, { limit, windowSec }, now);
    }
  }

  const ok = entry.count <= limit;
  return { ok, retryAfter: ok ? 0 : Math.ceil((entry.expiresAt.getTime() - now.getTime()) / 1000) };
}

// Looks without counting. Used to block an account after too many *failed* sign-ins
// without letting a stranger lock it with a few junk tries.
export async function isLimited(key, limit, now = new Date()) {
  await connectDB();
  const entry = await RateLimit.findOne({ key, expiresAt: { $gt: now } }).lean();
  return entry ? { limited: entry.count >= limit, retryAfter: Math.ceil((entry.expiresAt.getTime() - now.getTime()) / 1000) } : { limited: false, retryAfter: 0 };
}
