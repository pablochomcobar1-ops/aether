import { describe, it, expect, beforeAll, vi } from "vitest";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import {
  hashPassword,
  verifyPassword,
  signSession,
  readSession,
  checkLogin,
  authorizeAdmin,
} from "@/lib/auth";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("passwords", () => {
  it("hashes with bcrypt cost 12 and never stores the password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).not.toContain("correct horse");
  });

  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });
});

describe("sessions", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ userId: "u1", role: "customer" });
    expect(await readSession(token)).toEqual({ userId: "u1", role: "customer" });
  });

  it("rejects a token with one character changed", async () => {
    const token = await signSession({ userId: "u1", role: "customer" });
    const i = token.length - 5;
    const tampered = token.slice(0, i) + (token[i] === "a" ? "b" : "a") + token.slice(i + 1);
    expect(await readSession(tampered)).toBeNull();
  });

  it("rejects a token where someone edited the role to admin", async () => {
    const token = await signSession({ userId: "u1", role: "customer" });
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "u1", role: "admin" })).toString("base64url");
    expect(await readSession(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000);
    const token = await signSession({ userId: "u1", role: "customer" }, eightDaysAgo);
    expect(await readSession(token)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const other = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("some-other-secret-that-is-32-chars-long!!"));
    expect(await readSession(other)).toBeNull();
  });

  it("rejects an unsigned token (alg: none)", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "u1", role: "admin", exp: 9999999999 })).toString("base64url");
    expect(await readSession(`${header}.${payload}.`)).toBeNull();
  });

  it("returns null for a missing or junk cookie", async () => {
    expect(await readSession(undefined)).toBeNull();
    expect(await readSession("not-a-token")).toBeNull();
  });

  it("refuses to sign with a short secret", async () => {
    process.env.SESSION_SECRET = "too-short";
    await expect(signSession({ userId: "u1", role: "customer" })).rejects.toThrow(/32 characters/);
    process.env.SESSION_SECRET = SECRET;
  });
});

describe("checkLogin", () => {
  it("returns the user for the right password", async () => {
    const passwordHash = await hashPassword("right-password");
    const findUser = async () => ({ _id: "u1", role: "customer", name: "A", passwordHash });
    expect(await checkLogin("a@b.com", "right-password", findUser)).toMatchObject({ _id: "u1" });
  });

  it("returns null for a wrong password", async () => {
    const passwordHash = await hashPassword("right-password");
    const findUser = async () => ({ _id: "u1", passwordHash });
    expect(await checkLogin("a@b.com", "wrong-password", findUser)).toBeNull();
  });

  it("still runs a password check when the email doesn't exist, so timing doesn't leak accounts", async () => {
    const spy = vi.spyOn(bcrypt, "compare");
    expect(await checkLogin("nobody@b.com", "whatever-pass", async () => null)).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe("authorizeAdmin", () => {
  it("allows a user whose role in the database is admin", async () => {
    const loadRole = async () => "admin";
    expect(await authorizeAdmin({ userId: "u1", role: "admin" }, loadRole)).toBe(true);
  });

  it("refuses a customer", async () => {
    expect(await authorizeAdmin({ userId: "u1", role: "customer" }, async () => "customer")).toBe(false);
  });

  it("refuses when the cookie says admin but the database says customer", async () => {
    expect(await authorizeAdmin({ userId: "u1", role: "admin" }, async () => "customer")).toBe(false);
  });

  it("refuses when there is no session or the user was deleted", async () => {
    expect(await authorizeAdmin(null, async () => "admin")).toBe(false);
    expect(await authorizeAdmin({ userId: "gone", role: "admin" }, async () => null)).toBe(false);
  });
});
