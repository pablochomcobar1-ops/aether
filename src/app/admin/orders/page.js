import Link from "next/link";
import { Search } from "lucide-react";
import { ADMIN_ORDER_FILTERS, listAdminOrders } from "@/lib/admin";
import { formatINR } from "@/lib/money";
import { formatOrderDate } from "@/lib/orderView";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/admin/StatusBadge";

export const metadata = { title: "Orders" };

const LABEL = {
  active: "To do",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund: "Refund needed",
  pending: "Unpaid",
};

export default async function AdminOrders({ searchParams }) {
  const params = await searchParams;
  const filter = ADMIN_ORDER_FILTERS.includes(params.status) ? params.status : "active";
  const q = typeof params.q === "string" ? params.q : "";
  const { orders, counts } = await listAdminOrders({ filter, q });
  const count = (f) =>
    f === "active" ? (counts.paid ?? 0) + (counts.packed ?? 0) + (counts.shipped ?? 0) : f === "refund" ? null : (counts[f] ?? 0);
  const href = (f) => `/admin/orders?status=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-6xl">Orders</h1>

      <nav aria-label="Filter orders" className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {ADMIN_ORDER_FILTERS.map((f) => (
          <Link
            key={f}
            href={href(f)}
            aria-current={f === filter ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 border px-4 text-sm transition-colors ${
              f === filter ? "border-bone bg-bone text-ink" : f === "refund" ? "border-danger/60 text-[#f87171] hover:border-danger" : "border-line text-mute hover:border-mute hover:text-bone"
            }`}
          >
            {LABEL[f]}
            {count(f) !== null && <span className="font-mono text-xs opacity-70">{count(f)}</span>}
          </Link>
        ))}
      </nav>

      <form role="search" className="mt-6 flex max-w-md gap-3">
        <input type="hidden" name="status" value={filter} />
        <label htmlFor="orders-q" className="sr-only">
          Search orders
        </label>
        <input
          id="orders-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Order number, email or name"
          className="h-12 min-w-0 flex-1 border border-line bg-transparent px-4 text-bone outline-none transition-colors placeholder:text-mute/60 hover:border-mute focus:border-bone"
        />
        <Button type="submit" variant="outline" className="h-12" aria-label="Search">
          <Search size={16} aria-hidden="true" />
        </Button>
      </form>

      {orders.length === 0 ? (
        <p className="mt-10 border border-line p-8 text-center text-mute">
          {filter === "active" && !q ? "Nothing to pack or ship right now." : "No orders match."}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={String(o._id)}>
              <Link
                href={`/admin/orders/${o._id}`}
                className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 transition-colors hover:bg-carbon md:grid-cols-[130px_110px_1fr_90px_110px_130px] md:items-center md:px-3"
              >
                <span className="font-mono text-sm">{o.orderNumber}</span>
                <span className="text-right text-sm text-mute md:order-none md:text-left">{formatOrderDate(o.createdAt)}</span>
                <span className="min-w-0 truncate text-sm">
                  {o.address?.name} <span className="text-mute">· {o.email}</span>
                </span>
                <span className="text-right text-sm text-mute md:text-left">
                  {o.items.reduce((n, i) => n + i.qty, 0)} {o.items.reduce((n, i) => n + i.qty, 0) === 1 ? "pair" : "pairs"}
                </span>
                <span className="text-sm tabular-nums">{formatINR(o.total)}</span>
                <span className="flex flex-wrap justify-end gap-2 md:justify-start">
                  <StatusBadge status={o.status} />
                  {o.stockIssue && o.status !== "cancelled" && (
                    <span className="border border-danger px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#f87171]">Refund</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {orders.length === 100 && <p className="mt-4 text-sm text-mute">Showing the newest 100. Search to find older orders.</p>}
    </>
  );
}
