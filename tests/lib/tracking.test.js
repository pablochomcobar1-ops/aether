import { describe, expect, it, vi } from "vitest";
import { trackOrder, NOT_FOUND } from "../../src/lib/tracking.js";

const paid = { orderNumber: "AE-7KQ2MX", email: "buyer@example.com", status: "paid", items: [], statusHistory: [], createdAt: new Date() };

function loader(order) {
  return vi.fn(async (query) =>
    order && query.orderNumber === order.orderNumber && query.email === order.email && query.status.$ne !== order.status
      ? order
      : null
  );
}

describe("trackOrder", () => {
  it("finds an order when number and email both match, ignoring case and spaces", async () => {
    const result = await trackOrder({ orderNumber: " ae-7kq2mx ", email: " Buyer@Example.com " }, loader(paid));
    expect(result.ok).toBe(true);
    expect(result.order.orderNumber).toBe("AE-7KQ2MX");
  });

  it("gives the same answer for a wrong email and a wrong number", async () => {
    const wrongEmail = await trackOrder({ orderNumber: "AE-7KQ2MX", email: "someone@else.com" }, loader(paid));
    const wrongNumber = await trackOrder({ orderNumber: "AE-AAAAAA", email: "buyer@example.com" }, loader(paid));
    expect(wrongEmail).toEqual({ ok: false, status: 404, error: NOT_FOUND });
    expect(wrongNumber).toEqual(wrongEmail);
  });

  it("hides orders that were never paid", async () => {
    const load = loader({ ...paid, status: "pending" });
    expect(await trackOrder({ orderNumber: "AE-7KQ2MX", email: "buyer@example.com" }, load)).toMatchObject({ status: 404 });
    expect(load).toHaveBeenCalledWith({ orderNumber: "AE-7KQ2MX", email: "buyer@example.com", status: { $ne: "pending" } });
  });

  it("rejects junk before touching the database", async () => {
    const load = loader(paid);
    for (const body of [null, {}, { orderNumber: { $ne: "" }, email: "buyer@example.com" }, { orderNumber: "AE-7KQ2MX", email: { $gt: "" } }]) {
      const result = await trackOrder(body, load);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
    }
    expect(load).not.toHaveBeenCalled();
  });
});
