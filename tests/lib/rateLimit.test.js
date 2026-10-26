import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDB, stopTestDB } from "../helpers/db";
import { isLimited, rateLimit } from "@/lib/rateLimit";

beforeAll(startTestDB);
afterAll(stopTestDB);

const rule = { limit: 5, windowSec: 900 };

describe("rateLimit", () => {
  it("allows 5 attempts, then blocks the 6th and says when to retry", async () => {
    const now = new Date("2026-11-01T10:00:00Z");
    for (let i = 0; i < 5; i++) expect((await rateLimit("login:a", rule, now)).ok).toBe(true);
    const blocked = await rateLimit("login:a", rule, new Date(now.getTime() + 60_000));
    expect(blocked).toEqual({ ok: false, retryAfter: 840 });
  });

  it("opens again after the window ends", async () => {
    const now = new Date("2026-11-01T10:00:00Z");
    for (let i = 0; i < 6; i++) await rateLimit("login:b", rule, now);
    const later = new Date(now.getTime() + 901_000);
    expect((await rateLimit("login:b", rule, later)).ok).toBe(true);
  });

  it("counts each key separately", async () => {
    const now = new Date("2026-11-01T10:00:00Z");
    for (let i = 0; i < 6; i++) await rateLimit("login:c", rule, now);
    expect((await rateLimit("login:d", rule, now)).ok).toBe(true);
  });

  // FerretDB (used only in Claude's sandbox) loses concurrent updates; real MongoDB runs this test.
  it.skipIf(process.env.TEST_DB_NOT_ATOMIC)("lets exactly 5 through when 12 attempts arrive at the same moment", async () => {
    const now = new Date("2026-11-01T10:00:00Z");
    const results = await Promise.all(Array.from({ length: 12 }, () => rateLimit("login:e", rule, now)));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });

  it("isLimited looks without counting", async () => {
    const rule = { limit: 3, windowSec: 3600 };
    const now = new Date("2026-10-26T10:00:00Z");
    expect((await isLimited("fail:x", 3, now)).limited).toBe(false);
    for (let i = 0; i < 3; i++) await rateLimit("fail:x", rule, now);
    expect((await isLimited("fail:x", 3, now)).limited).toBe(true);
    expect((await isLimited("fail:x", 3, now)).limited).toBe(true);
    expect((await isLimited("fail:x", 3, new Date("2026-10-26T11:00:01Z"))).limited).toBe(false);
  });
});
