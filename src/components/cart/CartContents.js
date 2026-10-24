"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_MIN } from "@/lib/constants";
import ProductImage from "@/components/product/ProductImage";
import Button from "@/components/ui/Button";
import { useCartPricing } from "./useCartPricing";

const stepClass =
  "grid size-11 place-items-center border border-line transition-colors hover:border-bone disabled:pointer-events-none disabled:opacity-30";

function Row({ row, onNavigate }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const href = row.slug ? `/product/${row.slug}` : "/shop";

  return (
    <li className="flex gap-4 py-6">
      <Link href={href} onClick={onNavigate} className="relative block size-24 shrink-0 overflow-hidden bg-carbon">
        <ProductImage src={row.image} alt={row.name} name="" sizes="96px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <Link href={href} onClick={onNavigate} className="font-display uppercase tracking-wide hover:underline">
              {row.name}
            </Link>
            <p className="text-sm text-mute">
              {row.colorway ? `${row.colorway} · ` : ""}UK {row.size}
            </p>
          </div>
          <p className="shrink-0 tabular-nums">{row.lineTotal ? formatINR(row.lineTotal) : ""}</p>
        </div>

        {row.error && <p className="mt-2 text-sm text-[#f87171]">{row.error}</p>}

        <div className="mt-auto flex items-center justify-between pt-3">
          {row.maxQty > 0 ? (
            <div className="flex items-center" role="group" aria-label={`Quantity for ${row.name}`}>
              <button
                type="button"
                className={stepClass}
                onClick={() => setQty(row.productId, row.size, row.qty - 1)}
                disabled={row.qty <= 1}
                aria-label="One fewer"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="w-10 text-center tabular-nums" aria-live="polite">
                {Math.min(row.qty, row.maxQty)}
              </span>
              <button
                type="button"
                className={stepClass}
                onClick={() => setQty(row.productId, row.size, Math.min(row.qty, row.maxQty) + 1)}
                disabled={row.qty >= row.maxQty}
                aria-label="One more"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => remove(row.productId, row.size)}
            className="min-h-11 text-sm text-mute underline hover:text-bone"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export default function CartContents({ onNavigate, enabled = true }) {
  const { data, loading, error, lines, hydrated } = useCartPricing(enabled);

  if (hydrated && lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl uppercase tracking-tight">Your bag is empty</p>
        <p className="mt-2 text-mute">Find a pair you like and it will wait for you here.</p>
        <div className="mt-8">
          <Button href="/shop" onClick={onNavigate}>
            Shop all shoes
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 py-6" aria-busy="true" aria-label="Loading your bag">
        {error ? (
          <p className="text-[#f87171]">{error}</p>
        ) : (
          [0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="size-24 animate-pulse bg-carbon" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="h-4 w-2/3 animate-pulse bg-carbon" />
                <div className="h-3 w-1/3 animate-pulse bg-carbon" />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  const toFree = FREE_SHIPPING_MIN - (data.subtotal - data.discount);

  return (
    <div className={loading ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <ul className="divide-y divide-line">
        {data.rows.map((row) => (
          <Row key={`${row.productId}:${row.size}`} row={row} onNavigate={onNavigate} />
        ))}
      </ul>

      <dl className="space-y-3 border-t border-line pt-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-mute">Subtotal</dt>
          <dd className="tabular-nums">{formatINR(data.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mute">Shipping</dt>
          <dd className="tabular-nums">{data.shipping ? formatINR(data.shipping) : "Free"}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatINR(data.total)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-mute">
        {data.subtotal > 0 && toFree > 0
          ? `Add ${formatINR(toFree)} more for free shipping.`
          : data.subtotal > 0
            ? "Your order ships free."
            : ""}{" "}
        Prices include GST. Coupons are applied at checkout.
      </p>

      {data.hasErrors ? (
        <p className="mt-6 text-sm text-[#f87171]">Fix or remove the items marked above to check out.</p>
      ) : (
        <Button href="/checkout" size="lg" className="mt-6 w-full" onClick={onNavigate}>
          Check out
        </Button>
      )}
    </div>
  );
}
