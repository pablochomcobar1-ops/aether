import { ORDER_NUMBER } from "@/lib/orderAccess";
import TrackForm from "@/components/orders/TrackForm";

export const metadata = { title: "Track an order", robots: { index: false } };

export default async function TrackPage({ searchParams }) {
  const { order } = await searchParams;
  const initialNumber = typeof order === "string" && ORDER_NUMBER.test(order) ? order : "";

  return (
    <section className="mx-auto max-w-screen-md px-4 pb-24 pt-28 md:pt-36">
      <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-7xl">
        Track an order
      </h1>
      <p className="mt-4 max-w-md text-mute">
        Enter the order number from your confirmation email and the email address you checked out with.
      </p>
      <div className="mt-12">
        <TrackForm initialNumber={initialNumber} />
      </div>
    </section>
  );
}
