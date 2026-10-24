import { Suspense } from "react";
import { listProducts, toCard } from "@/lib/catalog";
import { COLLECTIONS, SIDE_INFO } from "@/lib/collections";
import ProductCard from "@/components/product/ProductCard";
import Filters from "@/components/product/Filters";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Shop all shoes",
  description: "Running shoes, high-tops, loafers and Chelsea boots from AETHER.",
};

const one = (v) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPage({ searchParams }) {
  const raw = await searchParams;
  const params = Object.fromEntries(["side", "line", "size", "min", "max", "q"].map((k) => [k, one(raw[k])]));
  const products = (await listProducts(params)).map(toCard);

  const collection = COLLECTIONS.find((c) => c.line === params.line);
  const title = collection?.label ?? (params.side === "sport" ? "Sport" : params.side === "atelier" ? "Atelier" : "Shop all");
  const blurb = collection?.blurb ?? SIDE_INFO[params.side]?.blurb ?? "Every AETHER shoe, from the track to the boardroom.";

  return (
    <section className="mx-auto max-w-screen-2xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
      <header className="max-w-2xl">
        <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight md:text-8xl">{title}</h1>
        <p className="mt-4 text-mute md:text-lg">{blurb}</p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Suspense>
            <Filters count={products.length} />
          </Suspense>
        </aside>

        {products.length ? (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-line px-6 py-20 text-center">
            <h2 className="font-display text-3xl uppercase tracking-tight">No shoes match these filters</h2>
            <p className="mx-auto mt-3 max-w-sm text-mute">Try another size or price range, or clear the filters to see everything.</p>
            <div className="mt-8">
              <Button href="/shop" variant="outline">
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
