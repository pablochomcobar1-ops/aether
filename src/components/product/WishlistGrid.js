"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/store/useHydrated";
import ProductCard from "./ProductCard";
import Button from "@/components/ui/Button";

export default function WishlistGrid() {
  const hydrated = useHydrated();
  const ids = useWishlist((s) => s.ids);
  const [products, setProducts] = useState(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!hydrated || !key) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${key}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [hydrated, key]);

  if (!hydrated) return null;

  if (!ids.length) {
    return (
      <div className="border border-line px-6 py-20 text-center">
        <h2 className="font-display text-3xl uppercase tracking-tight">Save shoes for later</h2>
        <p className="mx-auto mt-3 max-w-sm text-mute">Tap the heart on any shoe and it shows up here, on this device.</p>
        <div className="mt-8">
          <Button href="/shop">Shop all shoes</Button>
        </div>
      </div>
    );
  }

  const visible = (products ?? []).filter((p) => ids.includes(p.id));

  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3" aria-busy={products === null}>
      {visible.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
