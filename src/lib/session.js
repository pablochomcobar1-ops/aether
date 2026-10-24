import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, authorizeAdmin, readSession } from "./auth.js";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function getSession() {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(next = "/") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!(await authorizeAdmin(session))) redirect("/login?next=/admin");
  return session;
}
