import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { LAST_ORDER_COOKIE, ORDER_NUMBER, canViewOrder } from "@/lib/orderAccess";
import ProductImage from "@/components/product/ProductImage";
import Button from "@/components/ui/Button";
import AfterPayment from "@/components/checkout/AfterPayment";

export const metadata = { title: "Your order", robots: { index: false } };

function Shell({ children }) {
  return <section className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:pt-36">{children}</section>;
}

export default async function SuccessPage({ searchParams }) {
  const { order: number } = await searchParams;
  const [session, store] = await Promise.all([getSession(), cookies()]);

  let order = null;
  if (typeof number === "string" && ORDER_NUMBER.test(number)) {
    await connectDB();
    order = await Order.findOne({ orderNumber: number }).lean();
  }

  // Same answer for "doesn't exist" and "not yours", so the page can't be used to probe numbers.
  if (!canViewOrder(order, { session, lastOrder: store.get(LAST_ORDER_COOKIE)?.value })) {
    return (
      <Shell>
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-6xl">Order not found</h1>
        <p className="mt-4 max-w-md text-mute">
          We can only show an order on the device it was placed from, or in the account it belongs to. Your
          confirmation email has the details.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href={session ? "/orders" : "/login?next=/orders"}>{session ? "Your orders" : "Sign in"}</Button>
          <Button href="/shop" variant="outline">
            Keep shopping
          </Button>
        </div>
      </Shell>
    );
  }

  if (order.status === "pending") {
    return (
      <Shell>
        <AfterPayment paid={false} />
        <p className="font-mono text-sm text-mute">{order.orderNumber}</p>
        <h1 className="mt-3 font-display text-5xl font-bold uppercase tracking-tight md:text-6xl">
          Confirming your payment
        </h1>
        <p className="mt-4 max-w-md text-mute" role="status">
          This usually takes a few seconds and the page updates on its own. If the payment didn&apos;t finish, no money
          was taken and your order won&apos;t be shipped.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <AfterPayment paid />
      <p className="font-mono text-sm text-mute">{order.orderNumber}</p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-7xl">
        {order.status === "cancelled" ? "Order cancelled" : "Order confirmed"}
      </h1>
      <p className="mt-4 text-mute">
        {order.status === "cancelled" ? (
          "This order was cancelled and refunded in full."
        ) : (
          <>
            A confirmation is on its way to <span className="text-bone">{order.email}</span>.
          </>
        )}
      </p>

      {order.stockIssue && (
        <p role="alert" className="mt-8 border border-warning/60 p-4 text-sm">
          One of your sizes sold out at the same moment you paid. We&apos;ll email you and refund that pair
          in full.
        </p>
      )}

      <ul className="mt-12 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={`${item.slug}:${item.size}`} className="flex gap-4 py-5">
            <div className="relative size-20 shrink-0 overflow-hidden bg-carbon">
              <ProductImage src={item.image} alt={item.name} name="" sizes="80px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display uppercase tracking-wide">{item.name}</p>
              <p className="text-sm text-mute">
                UK {item.size} · Qty {item.qty}
              </p>
            </div>
            <p className="shrink-0 tabular-nums">{formatINR(item.unitPrice * item.qty)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-xs uppercase tracking-[0.18em] text-mute">Delivering to</h2>
          <address className="mt-3 not-italic leading-relaxed">
            {order.address.name}
            <br />
            {order.address.line1}
            {order.address.line2 && (
              <>
                <br />
                {order.address.line2}
              </>
            )}
            <br />
            {order.address.city}, {order.address.state} {order.address.pincode}
          </address>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-mute">Subtotal</dt>
            <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-mute">Discount ({order.couponCode})</dt>
              <dd className="tabular-nums">−{formatINR(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-mute">Shipping</dt>
            <dd className="tabular-nums">{order.shipping ? formatINR(order.shipping) : "Free"}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-display uppercase tracking-wide">Paid</dt>
            <dd className="font-display text-2xl tabular-nums">{formatINR(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Button href={order.userId ? "/orders" : `/orders/track?order=${order.orderNumber}`}>Track your order</Button>
        <Button href="/shop" variant="outline">
          Keep shopping
        </Button>
      </div>
    </Shell>
  );
}
