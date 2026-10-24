"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_QTY } from "@/lib/constants";

const sameLine = (a, b) => a.productId === b.productId && a.size === b.size;
const clampQty = (qty) => Math.max(1, Math.min(MAX_QTY, Math.floor(qty) || 1));

export const useCart = create(
  persist(
    (set) => ({
      lines: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: ({ productId, slug, size }) =>
        set((state) => {
          const existing = state.lines.find((l) => sameLine(l, { productId, size }));
          const lines = existing
            ? state.lines.map((l) => (l === existing ? { ...l, qty: clampQty(l.qty + 1) } : l))
            : [...state.lines, { productId, slug, size, qty: 1 }];
          return { lines, open: true };
        }),
      setQty: (productId, size, qty) =>
        set((state) => ({
          lines: state.lines.map((l) => (sameLine(l, { productId, size }) ? { ...l, qty: clampQty(qty) } : l)),
        })),
      remove: (productId, size) =>
        set((state) => ({ lines: state.lines.filter((l) => !sameLine(l, { productId, size })) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "aether-cart",
      version: 1,
      partialize: (state) => ({
        lines: state.lines.map(({ productId, slug, size, qty }) => ({ productId, slug, size, qty })),
      }),
    }
  )
);

export const cartCount = (lines) => lines.reduce((sum, l) => sum + l.qty, 0);
