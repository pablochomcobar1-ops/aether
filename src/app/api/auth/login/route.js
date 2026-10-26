import { NextResponse } from "next/server";
import { checkLogin, signSession, SESSION_COOKIE } from "@/lib/auth";
import { loginSchema, fieldErrors } from "@/lib/validators";
import { isLimited, rateLimit } from "@/lib/rateLimit";
import { sessionCookieOptions } from "@/lib/session";
import { clientIp, jsonError, readJson, sameOrigin, tooMany } from "@/lib/http";

const WRONG = "Email or password is incorrect.";
// Failed sign-ins per account, from any IP. Stops a password-guessing attack spread
// over many IPs, which the per-IP limits alone can't see.
const ACCOUNT_FAILS = { limit: 20, windowSec: 3600 };

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError(403, "This request isn't allowed.");

  const body = await readJson(request);
  if (!body) return jsonError(400, "That request couldn't be read. Try again.");
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
  const { email, password } = parsed.data;

  const ip = clientIp(request);
  for (const [key, rule] of [
    [`login:${ip}:${email}`, { limit: 5, windowSec: 900 }],
    [`login:${ip}`, { limit: 30, windowSec: 900 }],
  ]) {
    const result = await rateLimit(key, rule);
    if (!result.ok) return tooMany(result.retryAfter);
  }

  const failKey = `login-fail:${email}`;
  const locked = await isLimited(failKey, ACCOUNT_FAILS.limit);
  if (locked.limited) return tooMany(locked.retryAfter);

  const user = await checkLogin(email, password);
  if (!user) {
    await rateLimit(failKey, ACCOUNT_FAILS);
    return jsonError(401, WRONG);
  }

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(SESSION_COOKIE, await signSession({ userId: user._id, role: user.role }), sessionCookieOptions);
  return response;
}
