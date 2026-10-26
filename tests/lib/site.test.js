import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("../../src/lib/site.js")).SITE_URL;
}
afterEach(() => vi.unstubAllEnvs());

describe("SITE_URL", () => {
  it("uses the configured address without a trailing slash", async () => {
    expect(await load({ NEXT_PUBLIC_SITE_URL: "https://aether.vercel.app/" })).toBe("https://aether.vercel.app");
  });
  it("adds https:// when it was left off", async () => {
    expect(await load({ NEXT_PUBLIC_SITE_URL: "aether.vercel.app" })).toBe("https://aether.vercel.app");
  });
  it("falls back to Vercel's production address when the variable is empty", async () => {
    expect(await load({ NEXT_PUBLIC_SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "aether-abc.vercel.app" })).toBe("https://aether-abc.vercel.app");
  });
  it("falls back to localhost when nothing is set or the value is junk", async () => {
    expect(await load({ NEXT_PUBLIC_SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "" })).toBe("http://localhost:3000");
    expect(await load({ NEXT_PUBLIC_SITE_URL: "http://exa mple.com" })).toBe("http://localhost:3000");
  });
});
