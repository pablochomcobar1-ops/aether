import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/session";
import Button from "@/components/ui/Button";
import SignOutButton from "@/components/auth/SignOutButton";

export const metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const session = await requireUser("/orders");
  await connectDB();
  const user = await User.findById(session.userId).select("name email").lean();

  return (
    <section className="mx-auto max-w-screen-lg px-4 pb-24 pt-32 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Your orders</h1>
          <p className="mt-3 text-mute">
            Signed in as {user?.name} ({user?.email})
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="py-24 text-center">
        <h2 className="font-display text-3xl uppercase tracking-tight">Find your first pair</h2>
        <p className="mx-auto mt-3 max-w-sm text-mute">Orders you place while signed in show up here, with their delivery status.</p>
        <div className="mt-8">
          <Button href="/shop">Shop all shoes</Button>
        </div>
      </div>
    </section>
  );
}
