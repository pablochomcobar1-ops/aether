import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelated, toCard, toDetail } from "@/lib/catalog";
import { COLLECTIONS } from "@/lib/collections";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_MIN } from "@/lib/constants";
import ProductGallery from "@/components/product/ProductGallery";
import AddToBag from "@/components/product/AddToBag";
import ProductCard from "@/components/product/ProductCard";

export async function generateMetadata({ params }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Shoe not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: product.images?.[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }) {
  const doc = await getProductBySlug((await params).slug);
  if (!doc) notFound();

  const product = toDetail(doc);
  const related = (await getRelated(doc)).map(toCard);
  const collection = COLLECTIONS.find((c) => c.line === product.line);
  const atelier = product.side === "atelier";

  return (
    <>
      <section className="mx-auto grid max-w-screen-2xl gap-10 px-4 pb-20 pt-24 md:px-8 md:pt-32 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Breadcrumb" className="text-sm text-mute">
            <Link href={`/shop?side=${product.side}`} className="hover:text-bone">
              {atelier ? "Atelier" : "Sport"}
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/shop?side=${product.side}&line=${product.line}`} className="hover:text-bone">
              {collection?.label}
            </Link>
          </nav>
          <h1
            className={`mt-4 font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-6xl ${
              atelier ? "font-extralight" : "font-bold"
            }`}
          >
            {product.name}
          </h1>
          <p className="mt-2 text-mute">{product.colorway}</p>
          <p className="mt-6 text-2xl tabular-nums">{formatINR(product.price)}</p>
          <p className="mt-1 text-sm text-mute">Inclusive of all taxes</p>

          <div className="mt-8">
            <AddToBag product={product} />
          </div>

          <p className="mt-6 text-sm text-mute">Free shipping on orders of {formatINR(FREE_SHIPPING_MIN)} or more.</p>

          <div className="mt-10 border-t border-line pt-8">
            <p className="leading-relaxed">{product.description}</p>
            {product.details.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm text-mute">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-mute" />
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-screen-2xl border-t border-line px-4 py-20 md:px-8">
          <h2 className="font-display text-3xl uppercase tracking-tight md:text-4xl">More from {collection?.label}</h2>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
