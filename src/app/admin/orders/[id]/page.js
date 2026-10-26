import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getAdminOrder } from "@/lib/admin";
import { nextStatuses } from "@/lib/orders";
import { formatINR } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderView";
import ProductImage from "@/components/product/ProductImage";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const metadata = { title: "Order" };

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const when = { format: (value) => (value && !Number.isNaN(new Date(value).getTime()) ? dateTime.format(new Date(value)) : "—") };

function Block({ title, children }) {
  return (
    <section className="border border-line p-6">
      <h2 className="font-display text-xs uppercase tracking-[0.18em] text-mute">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AdminOrder({ params }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const a = order.address;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-mute underline hover:text-bone">
        All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-mono text-3xl md:text-4xl">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-mute">Placed {when.format(order.createdAt)}</p>

      {order.stockIssue && order.status !== "cancelled" && (
        <p role="alert" className="mt-8 border border-danger p-4 text-sm">
          <span className="font-display uppercase tracking-wide text-[#f87171]">Refund needed.</span> A size in this order
          sold out at the moment of payment. Refund the customer in Razorpay, then cancel the order.
        </p>
      )}

      <div className="mt-8">
        <OrderStatusSelect orderId={String(order._id)} next={nextStatuses(order.status)} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Block title="Customer">
          <p>{a.name}</p>
          <p>
            <a href={`mailto:${order.email}`} className="underline hover:text-mute">
              {order.email}
            </a>
          </p>
          <p>
            <a href={`tel:+91${a.phone}`} className="underline hover:text-mute">
              +91 {a.phone}
            </a>
          </p>
          <p className="mt-2 text-sm text-mute">{order.userId ? "Has an account" : "Guest checkout"}</p>
        </Block>
        <Block title="Ship to">
          <address className="not-italic leading-relaxed">
            {a.name}
            <br />
            {a.line1}
            {a.line2 && (
              <>
                <br />
                {a.line2}
              </>
            )}
            <br />
            {a.city}, {a.state} {a.pincode}
          </address>
        </Block>
      </div>

      <section className="mt-4 border border-line">
        <h2 className="border-b border-line p-6 font-display text-xs uppercase tracking-[0.18em] text-mute">Items</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={`${item.slug}:${item.size}`} className="flex items-center gap-4 px-6 py-4">
              <div className="relative size-14 shrink-0 overflow-hidden bg-carbon">
                <ProductImage src={item.image} alt="" name="" sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display uppercase tracking-wide">{item.name}</p>
                <p className="text-sm text-mute">
                  UK {item.size} · Qty {item.qty} · {formatINR(item.unitPrice)} each
                  {item.stockTaken === false && <span className="text-[#f87171]"> · not in stock when paid</span>}
                </p>
              </div>
              <p className="shrink-0 tabular-nums">{formatINR(item.unitPrice * item.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line p-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-mute">Subtotal</dt>
            <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-mute">Coupon {order.couponCode}</dt>
              <dd className="tabular-nums">−{formatINR(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-mute">Shipping</dt>
            <dd className="tabular-nums">{order.shipping ? formatINR(order.shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt>Total paid</dt>
            <dd className="tabular-nums">{formatINR(order.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Block title="Payment">
          {order.razorpayPaymentId ? (
            <>
              <p className="break-all font-mono text-sm">{order.razorpayPaymentId}</p>
              <a
                href={`https://dashboard.razorpay.com/app/payments/${encodeURIComponent(order.razorpayPaymentId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm underline hover:text-mute"
              >
                Open in Razorpay <ExternalLink size={14} aria-hidden="true" />
              </a>
            </>
          ) : (
            <p className="text-mute">Not paid yet.</p>
          )}
          <p className="mt-3 text-sm text-mute">Refunds are issued from the Razorpay dashboard.</p>
        </Block>
        <Block title="History">
          <ol className="space-y-2 text-sm">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>{STATUS_LABELS[h.status]}</span>
                <span className="text-mute tabular-nums">{when.format(h.at)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-mute">
            Email confirmation: {order.emailSent ? "sent" : "not sent"}
          </p>
        </Block>
      </div>
    </div>
  );
}
