import { describe, it, expect } from "vitest";
import { sameOrigin, clientIp } from "@/lib/http";

const post = (headers) => new Request("https://aether.example/api/auth/login", { method: "POST", headers });

describe("sameOrigin", () => {
  it("allows requests from this site", () => {
    expect(sameOrigin(post({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(sameOrigin(post({ origin: "https://aether.example" }))).toBe(true);
  });

  it("blocks requests started by other websites", () => {
    expect(sameOrigin(post({ "sec-fetch-site": "cross-site", origin: "https://evil.com" }))).toBe(false);
    expect(sameOrigin(post({ "sec-fetch-site": "same-site" }))).toBe(false);
    expect(sameOrigin(post({ origin: "https://evil.com" }))).toBe(false);
  });

  it("trusts Sec-Fetch-Site over a spoofed Origin", () => {
    expect(sameOrigin(post({ "sec-fetch-site": "cross-site", origin: "https://aether.example" }))).toBe(false);
  });

  it("blocks requests with no origin information", () => {
    expect(sameOrigin(post({}))).toBe(false);
  });
});

describe("clientIp", () => {
  it("uses the first address in x-forwarded-for", () => {
    expect(clientIp(post({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back when there is no proxy header", () => {
    expect(clientIp(post({}))).toBe("local");
  });
});
