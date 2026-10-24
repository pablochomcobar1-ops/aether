import CartContents from "@/components/cart/CartContents";

export const metadata = { title: "Your bag" };

export default function CartPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-24 pt-28 md:pt-36">
      <h1 className="font-display text-6xl font-bold uppercase tracking-tight md:text-7xl">Your bag</h1>
      <div className="mt-8">
        <CartContents />
      </div>
    </section>
  );
}
