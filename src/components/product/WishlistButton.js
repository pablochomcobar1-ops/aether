"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/store/useHydrated";

export default function WishlistButton({ productId, name, className = "", withLabel = false }) {
  const hydrated = useHydrated();
  const saved = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const on = hydrated && saved;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        toggle(productId);
      }}
      aria-pressed={on}
      aria-label={withLabel ? undefined : on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 transition-transform duration-150 ease-out active:scale-90 ${className}`}
    >
      <Heart size={20} strokeWidth={1.5} fill={on ? "currentColor" : "none"} aria-hidden="true" />
      {withLabel && <span className="font-display text-sm uppercase tracking-[0.12em]">{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
