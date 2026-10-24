import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/token";

// First line of defence only. Every admin page and action still checks the database itself.
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const needsAdmin = pathname.startsWith("/admin");

  if (!session || (needsAdmin && session.role !== "admin")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/orders"],
};
