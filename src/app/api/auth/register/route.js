import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth";
import { registerSchema, fieldErrors } from "@/lib/validators";
import { rateLimit } from "@/lib/rateLimit";
import { sessionCookieOptions } from "@/lib/session";
import { clientIp, jsonError, readJson, sameOrigin, tooMany } from "@/lib/http";

const EMAIL_TAKEN = "An account with this email already exists. Sign in instead.";

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError(403, "This request isn't allowed.");

  const limit = await rateLimit(`register:${clientIp(request)}`, { limit: 5, windowSec: 3600 });
  if (!limit.ok) return tooMany(limit.retryAfter);

  const body = await readJson(request);
  if (!body) return jsonError(400, "That request couldn't be read. Try again.");
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
  const { name, email, password } = parsed.data;

  await connectDB();
  if (await User.exists({ email })) return jsonError(409, EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } });

  let user;
  try {
    user = await User.create({ name, email, passwordHash: await hashPassword(password), role: "customer" });
  } catch (error) {
    if (error?.code === 11000) return jsonError(409, EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } });
    throw error;
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, await signSession({ userId: user._id, role: user.role }), sessionCookieOptions);
  return response;
}
