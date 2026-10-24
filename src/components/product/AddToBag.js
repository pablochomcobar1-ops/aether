"use client";

import { useState } from "react";
import Link from "next/link";
import { SIZES } from "@/lib/constants";
import { useCart } from "@/store/cart";
import Button from "@/components/ui/Button";
import WishlistButton from "./WishlistButton";

export default function AddToBag({ product }) {
  const add = useCart((s) => s.add);
  const [size, setSize] = useState(null);
  const [error, setError] = useState("");
  const stock = Object.fromEntries(product.sizes.map((s) => [s.uk, s.stock]));
  const left = size ? stock[size] : null;

  function addToBag() {
    if (!size) {
      setError("Pick a size first");
      return;
    }
    add({ productId: product.id, slug: product.slug, size });
  }

  return (
    <div>
      <fieldset>
        <div className="flex items-baseline justify-between">
          <legend className="font-display text-xs uppercase tracking-[0.18em] text-mute">Size (UK)</legend>
          <Link href="/size-guide" className="text-sm underline">
            Size guide
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Size (UK)">
          {SIZES.map((uk) => {
            const out = !stock[uk];
            const chosen = size === uk;
            return (
              <button
                key={uk}
                type="button"
                role="radio"
                aria-checked={chosen}
                aria-disabled={out}
                aria-label={out ? `UK ${uk}, sold out` : `UK ${uk}`}
                onClick={() => {
                  if (out) return;
                  setSize(uk);
                  setError("");
                }}
                className={`h-12 border font-display tabular-nums transition-colors duration-150 ${
                  chosen
                    ? "border-bone bg-bone text-ink"
                    : out
                      ? "cursor-not-allowed border-line text-line line-through"
                      : "border-line hover:border-bone"
                }`}
              >
                {uk}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-3 min-h-6 text-sm" aria-live="polite">
        {error ? (
          <span className="text-[#f87171]">{error}</span>
        ) : left !== null && left <= 2 ? (
          <span className="text-mute">Only {left} left in UK {size}</span>
        ) : null}
      </p>

      <div className="mt-2 flex gap-3">
        <Button size="lg" className="flex-1" onClick={addToBag} disabled={product.soldOut}>
          {product.soldOut ? "Sold out" : "Add to bag"}
        </Button>
        <WishlistButton productId={product.id} name={product.name} className="h-14 w-14 border border-line hover:border-bone" />
      </div>
    </div>
  );
}
