import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, safeNext, fieldErrors } from "@/lib/validators";

describe("registerSchema", () => {
  const valid = { name: "Jainam", email: "  Jainam@Example.COM ", password: "a-long-password" };

  it("trims the name and lowercases the email", () => {
    expect(registerSchema.parse({ ...valid, name: "  Jainam  " })).toEqual({
      name: "Jainam",
      email: "jainam@example.com",
      password: "a-long-password",
    });
  });

  it("explains each problem in plain words", () => {
    const result = registerSchema.safeParse({ name: "J", email: "nope", password: "short" });
    expect(fieldErrors(result.error)).toEqual({
      name: "Enter your name (at least 2 letters)",
      email: "Enter a valid email address",
      password: "Use at least 8 characters",
    });
  });

  it("rejects passwords longer than bcrypt can safely use (72 bytes)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "é".repeat(40) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
  });

  it("rejects non-text values sent instead of strings", () => {
    expect(registerSchema.safeParse({ ...valid, email: { $ne: null } }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("needs an email and a password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(Object.keys(fieldErrors(result.error))).toEqual(["email", "password"]);
  });
});

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/orders")).toBe("/orders");
    expect(safeNext("/admin/products?page=2")).toBe("/admin/products?page=2");
  });

  it("blocks redirects to other websites", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined, ["/a"]]) {
      expect(safeNext(bad)).toBe("/");
    }
  });
});
