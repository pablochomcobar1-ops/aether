"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/store/useHydrated";

// Asks the server for live prices and stock. The browser never decides a price.
export function useCartPricing(enabled = true) {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const key = JSON.stringify(lines.map(({ productId, size, qty }) => [productId, size, qty]));

  useEffect(() => {
    if (!enabled || !hydrated) return;
    const controller = new AbortController();
    const payload = lines.map(({ productId, size, qty }) => ({ productId, size, qty }));

    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: payload }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((s) => ({ ...s, loading: false, error: error.message || "Prices couldn't load. Try again." }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, hydrated]);

  return { ...state, lines, hydrated };
}
