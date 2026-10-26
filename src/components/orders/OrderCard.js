import Link from "next/link";
import { Check, X } from "lucide-react";
import { formatINR } from "@/lib/money";
import { STATUS_LABELS, formatOrderDate } from "@/lib/orderView";
import ProductImage from "@/components/product/ProductImage";

function Timeline({ steps }) {
  return (
    <ol
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label="Delivery progress"
    >
      {steps.map((step, i) => {
        const reached = step.state !== "upcoming";
        const cancelled = step.state === "cancelled";
        return (
          <li key={step.status} className="relative" aria-current={step.state === "current" ? "step" : undefined}>
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-3 h-px w-full -translate-y-1/2 ${reached ? "bg-bone" : "bg-line"}`}
              />
            )}
            <div className="relative flex flex-col items-center text-center">
              <span
                className={`grid size-6 place-items-center rounded-full border ${
                  cancelled
                    ? "border-danger bg-danger text-bone"
                    : reached
                      ? "border-bone bg-bone text-ink"
                      : "border-line bg-ink"
                }`}
              >
                {cancelled ? (
                  <X size={14} strokeWidth={2.5} aria-hidden="true" />
                ) : reached ? (
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                ) : null}
              </span>
              <span className={`mt-3 font-display text-xs uppercase tracking-[0.14em] ${reached ? "text-bone" : "text-mute"}`}>
                {step.label}
              </span>
              <span className="mt-1 text-xs tabular-nums text-mute">{step.at ? formatOrderDate(step.at) : " "}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Used by /orders (server) and /orders/track (client). Takes the output of toPublicOrder.
export default function OrderCard({ order, headingLevel: H = "h2" }) {
  return (
    <article className="border border-line">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line p-5 md:p-6">
        <div>
          <H className="font-mono text-sm">{order.orderNumber}</H>
          <p className="mt-1 text-sm text-mute">
            Placed {formatOrderDate(order.placedAt)} · {order.items.reduce((n, i) => n + i.qty, 0)}{" "}
            {order.items.reduce((n, i) => n + i.qty, 0) === 1 ? "pair" : "pairs"} · {formatINR(order.total)}
          </p>
        </div>
        <p className={`font-display text-sm uppercase tracking-[0.14em] ${order.status === "cancelled" ? "text-[#f87171]" : ""}`}>
          {STATUS_LABELS[order.status]}
        </p>
      </header>

      <div className="p-5 md:p-6">
        <Timeline steps={order.timeline} />
        {order.stockIssue && order.status !== "cancelled" && (
          <p className="mt-6 border border-warning/60 p-4 text-sm">
            One of your sizes sold out at the moment you paid. We&apos;ll refund that pair in full.
          </p>
        )}
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {order.items.map((item) => (
          <li key={`${item.slug}:${item.size}`} className="flex items-center gap-4 px-5 py-4 md:px-6">
            <Link href={`/product/${item.slug}`} className="relative block size-16 shrink-0 overflow-hidden bg-carbon">
              <ProductImage src={item.image} alt={item.name} name="" sizes="64px" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="font-display uppercase tracking-wide hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-mute">
                UK {item.size} · Qty {item.qty}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">{formatINR(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap justify-between gap-4 border-t border-line p-5 text-sm text-mute md:p-6">
        <span>
          Delivering to {order.city}, {order.state}
        </span>
        <span>
          {order.discount > 0 && `${order.couponCode} −${formatINR(order.discount)} · `}
          Shipping {order.shipping ? formatINR(order.shipping) : "free"}
        </span>
      </footer>
    </article>
  );
}
