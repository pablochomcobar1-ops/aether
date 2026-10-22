import { describe, it, expect } from "vitest";
import { buildProductFilter } from "@/lib/catalog";

describe("buildProductFilter", () => {
  it("only ever shows active products", () => {
    expect(buildProductFilter()).toEqual({ active: true });
  });

  it("filters by side and collection", () => {
    expect(buildProductFilter({ side: "atelier", line: "formal" })).toEqual({
      active: true,
      side: "atelier",
      line: "formal",
    });
  });

  it("ignores values that aren't real sides, collections or sizes", () => {
    expect(
      buildProductFilter({ side: "kids", line: "beach", size: "13" }),
    ).toEqual({ active: true });
  });

  it("ignores objects sent instead of text (query injection)", () => {
    expect(
      buildProductFilter({ side: { $ne: null }, line: { $gt: "" } }),
    ).toEqual({ active: true });
  });

  it("matches a size only when it has stock", () => {
    expect(buildProductFilter({ size: "9" }).sizes).toEqual({
      $elemMatch: { uk: 9, stock: { $gt: 0 } },
    });
  });

  it("turns rupee prices from the URL into paise", () => {
    expect(buildProductFilter({ min: "5000", max: "12000" }).price).toEqual({
      $gte: 500000,
      $lte: 1200000,
    });
  });

  it("ignores a price that isn't a number", () => {
    expect(buildProductFilter({ min: "cheap" }).price).toBeUndefined();
  });

  it("treats search text literally, so symbols can't break the query", () => {
    const { $or } = buildProductFilter({ q: "  (oxford*  " });
    expect($or[0].name.test("The (Oxford* edition")).toBe(true);
    expect($or[0].name.test("Oxford")).toBe(false);
  });
});
