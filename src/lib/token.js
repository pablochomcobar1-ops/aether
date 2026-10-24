import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "aether_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const ROLES = ["customer", "admin"];

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession({ userId, role }, now = new Date()) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_MAX_AGE)
    .sign(secretKey());
}

export async function readSession(token) {
  if (typeof token !== "string" || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || !ROLES.includes(payload.role)) return null;
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
