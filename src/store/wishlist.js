"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWishlist = create(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((state) => ({ ids: state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [id, ...state.ids].slice(0, 50) })),
    }),
    { name: "aether-wishlist", version: 1 }
  )
);
