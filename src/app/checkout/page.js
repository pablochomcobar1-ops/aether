import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await getSession();
  let initial = {};
  if (session) {
    await connectDB();
    const user = await User.findById(session.userId).select("name email").lean();
    if (user) initial = { email: user.email, name: user.name };
  }

  return (
    <section className="mx-auto max-w-screen-xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
      <h1 className="font-display text-6xl font-bold uppercase tracking-tight md:text-7xl">Checkout</h1>
      <p className="mt-3 text-mute">
        {session ? "Signed in. This order will appear in your account." : "Checking out as a guest. No account needed."}
      </p>
      <div className="mt-12">
        <CheckoutForm initial={initial} />
      </div>
    </section>
  );
}
