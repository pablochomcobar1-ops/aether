"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False during the server render and the first client render, true afterwards.
// Lets saved cart and wishlist data appear without hydration mismatches.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
