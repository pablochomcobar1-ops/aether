import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { sessionCookieOptions } from "@/lib/session";
import { jsonError, sameOrigin } from "@/lib/http";

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError(403, "This request isn't allowed.");
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
