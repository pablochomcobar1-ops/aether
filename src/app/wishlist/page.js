import WishlistGrid from "@/components/product/WishlistGrid";

export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
      <h1 className="font-display text-6xl font-bold uppercase tracking-tight md:text-8xl">Wishlist</h1>
      <div className="mt-12">
        <WishlistGrid />
      </div>
    </section>
  );
}
