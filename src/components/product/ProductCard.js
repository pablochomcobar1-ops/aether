import Link from "next/link";
import { formatINR } from "@/lib/money";
import ProductImage from "./ProductImage";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product, priority = false }) {
  const [first, second] = product.images;

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-carbon">
          <ProductImage
            src={first}
            alt={`${product.name} in ${product.colorway}`}
            name={product.name}
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {second && (
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out [@media(hover:hover)]:group-hover:opacity-100">
              <ProductImage src={second} alt="" name={product.name} sizes="(min-width: 1024px) 33vw, 50vw" />
            </div>
          )}
          {product.soldOut && (
            <span className="absolute left-3 top-3 bg-bone px-2 py-1 font-display text-xs uppercase tracking-[0.12em] text-ink">
              Sold out
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4 pr-12">
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide">{product.name}</h3>
            <p className="mt-1 text-sm text-mute">{product.colorway}</p>
          </div>
          <p className="shrink-0 tabular-nums">{formatINR(product.price)}</p>
        </div>
      </Link>
      <WishlistButton productId={product.id} name={product.name} className="absolute bottom-0 right-0 text-bone" />
    </article>
  );
}
