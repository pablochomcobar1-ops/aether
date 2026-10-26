import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestDB, stopTestDB } from "../helpers/db";
import Coupon from "@/models/Coupon";
import { saveCouponData, toggleCouponActive } from "@/lib/admin";

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(() => Coupon.deleteMany({}));

const form = (over = {}) => ({ code: " diwali15 ", type: "percent", value: "15", minSubtotal: "4000", maxUses: "", expiresAt: "", active: true, ...over });

describe("saveCouponData", () => {
  it("creates a percent coupon with rupees turned into paise", async () => {
    const result = await saveCouponData(form());
    expect(result.ok).toBe(true);
    const saved = await Coupon.findOne({ code: "DIWALI15" }).lean();
    expect(saved).toMatchObject({ type: "percent", value: 15, minSubtotal: 400000, maxUses: null, expiresAt: null, active: true, uses: 0 });
  });

  it("stores flat discounts in paise", async () => {
    await saveCouponData(form({ code: "FLAT750", type: "flat", value: "750", maxUses: "100" }));
    expect(await Coupon.findOne({ code: "FLAT750" }).lean()).toMatchObject({ value: 75000, maxUses: 100 });
  });

  it("ends on the chosen day at midnight in India", async () => {
    await saveCouponData(form({ expiresAt: "2026-11-15" }));
    const saved = await Coupon.findOne({ code: "DIWALI15" }).lean();
    expect(saved.expiresAt.toISOString()).toBe("2026-11-15T18:30:00.000Z");
  });

  it("rejects bad input with field messages", async () => {
    const r = await saveCouponData(form({ code: "a!", value: "95", maxUses: "0", expiresAt: "soon" }));
    expect(Object.keys(r.fields).sort()).toEqual(["code", "expiresAt", "maxUses", "value"]);
    const flat = await saveCouponData(form({ type: "flat", value: "0" }));
    expect(flat.fields.value).toBeDefined();
  });

  it("explains a code that already exists", async () => {
    await saveCouponData(form());
    expect((await saveCouponData(form({ value: "20" }))).fields.code).toBe("This code already exists");
  });

  it("can't be used to reset the use counter", async () => {
    await saveCouponData(form({ uses: 0 }));
    await Coupon.updateOne({ code: "DIWALI15" }, { uses: 7 });
    const existing = await Coupon.findOne({ code: "DIWALI15" }).lean();
    await saveCouponData(form({ value: "20", uses: 0 }), String(existing._id));
    expect(await Coupon.findById(existing._id).lean()).toMatchObject({ value: 20, uses: 7 });
  });
});

describe("toggleCouponActive", () => {
  it("switches a coupon off and on", async () => {
    await saveCouponData(form());
    const { _id } = await Coupon.findOne({ code: "DIWALI15" }).lean();
    expect((await toggleCouponActive(String(_id))).active).toBe(false);
    expect((await toggleCouponActive(String(_id))).active).toBe(true);
  });
});
