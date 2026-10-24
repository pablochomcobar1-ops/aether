"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/store/useHydrated";

// Asks the server for live prices and stock. The browser never decides a price.
// Pass a coupon code to see the discount; call refresh() to re-check after stock changes.
export function useCartPricing(enabled = true, couponCode = "") {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const [state, setState] = useState({ data: null, error: "", forKey: null });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const key = JSON.stringify([lines.map(({ productId, size, qty }) => [productId, size, qty]), couponCode, nonce]);

  useEffect(() => {
    if (!enabled || !hydrated) return;
    const controller = new AbortController();
    const payload = lines.map(({ productId, size, qty }) => ({ productId, size, qty }));

    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: payload, couponCode: couponCode || undefined }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setState({ data, error: "", forKey: key });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((s) => ({ ...s, error: error.message || "Prices couldn't load. Try again.", forKey: key }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, hydrated]);

  // Loading whenever the answer we hold is for an older bag, coupon or refresh.
  const loading = state.forKey !== key;
  return { data: state.data, error: state.error, loading, lines, hydrated, refresh };
}
