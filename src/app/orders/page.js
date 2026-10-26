import Link from "next/link";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { requireUser } from "@/lib/session";
import { toPublicOrder } from "@/lib/orderView";
import Button from "@/components/ui/Button";
import SignOutButton from "@/components/auth/SignOutButton";
import OrderCard from "@/components/orders/OrderCard";

export const metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const session = await requireUser("/orders");
  await connectDB();
  // Only orders placed while signed in. Matching by email alone isn't safe: we don't verify
  // emails, so anyone could register with someone else's address and read their orders.
  const [user, orders] = await Promise.all([
    User.findById(session.userId).select("name email").lean(),
    Order.find({ userId: session.userId, status: { $ne: "pending" } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  return (
    <section className="mx-auto max-w-screen-md px-4 pb-24 pt-28 md:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Your orders</h1>
          <p className="mt-3 text-mute">
            Signed in as {user?.name} ({user?.email})
          </p>
        </div>
        <SignOutButton />
      </div>

      {orders.length === 0 ? (
        <div className="py-24 text-center">
          <h2 className="font-display text-3xl uppercase tracking-tight">Find your first pair</h2>
          <p className="mx-auto mt-3 max-w-sm text-mute">
            Orders you place while signed in show up here, with their delivery status.
          </p>
          <div className="mt-8">
            <Button href="/shop">Shop all shoes</Button>
          </div>
        </div>
      ) : (
        <ul className="mt-10 space-y-8">
          {orders.map((order) => (
            <li key={order.orderNumber}>
              <OrderCard order={toPublicOrder(order)} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-12 text-sm text-mute">
        Checked out as a guest?{" "}
        <Link href="/orders/track" className="text-bone underline">
          Track that order here
        </Link>
        .
      </p>
    </section>
  );
}
