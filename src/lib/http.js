import { NextResponse } from "next/server";

// Blocks requests started by other websites (CSRF). Modern browsers send Sec-Fetch-Site;
// older ones send Origin. A request with neither is refused.
export function sameOrigin(request) {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const jsonError = (status, error, extra = {}) => NextResponse.json({ error, ...extra }, { status });

export const tooMany = (retryAfter) =>
  NextResponse.json(
    { error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
