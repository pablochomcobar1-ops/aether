import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listAdminProducts, LOW_STOCK } from "@/lib/admin";
import { formatINR } from "@/lib/money";
import ProductImage from "@/components/product/ProductImage";
import Button from "@/components/ui/Button";
import ActiveToggle from "@/components/admin/ActiveToggle";
import { toggleActive } from "@/app/admin/products/actions";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const products = await listAdminProducts(query);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-6xl">Products</h1>
        <Button href="/admin/products/new">
          <Plus size={16} aria-hidden="true" /> New product
        </Button>
      </div>

      <form role="search" className="mt-8 flex max-w-md gap-3">
        <label htmlFor="admin-q" className="sr-only">
          Search products
        </label>
        <input
          id="admin-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search name, slug or colourway"
          className="h-12 min-w-0 flex-1 border border-line bg-transparent px-4 text-bone outline-none transition-colors placeholder:text-mute/60 hover:border-mute focus:border-bone"
        />
        <Button type="submit" variant="outline" className="h-12" aria-label="Search">
          <Search size={16} aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-sm text-mute">
        {products.length} {products.length === 1 ? "product" : "products"}
        {query && (
          <>
            {" "}
            matching “{query}” ·{" "}
            <Link href="/admin/products" className="underline hover:text-bone">
              Clear
            </Link>
          </>
        )}
      </p>

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {products.map((p) => {
          const id = String(p._id);
          const total = p.sizes.reduce((n, s) => n + s.stock, 0);
          const low = p.sizes.filter((s) => s.stock <= LOW_STOCK).length;
          return (
            <li key={id} className="grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-3 py-4 md:grid-cols-[64px_1fr_120px_140px_120px_auto] md:px-2">
              <div className="relative size-16 overflow-hidden bg-carbon">
                <ProductImage src={p.images?.[0]} alt="" name="" sizes="64px" />
              </div>
              <div className="min-w-0">
                <Link href={`/admin/products/${id}`} className="font-display uppercase tracking-wide hover:underline">
                  {p.name}
                </Link>
                <p className="truncate text-sm text-mute">
                  {p.colorway || "No colourway"} · <span className="font-mono text-xs">{p.slug}</span>
                </p>
              </div>
              <p className="col-start-2 text-sm text-mute capitalize md:col-start-auto">
                {p.side} · {p.line.replace("-", " ")}
              </p>
              <p className="col-start-2 text-sm md:col-start-auto">
                <span className="tabular-nums">{formatINR(p.price)}</span>
                <span className="block text-mute">
                  {total} pairs
                  {low > 0 && <span className="text-warning"> · {low} low</span>}
                </span>
              </p>
              <div className="col-start-2 md:col-start-auto">
                <ActiveToggle id={id} active={p.active} label={`Show ${p.name} in the store`} action={toggleActive} />
              </div>
              <div className="col-start-2 md:col-start-auto">
                <Button href={`/admin/products/${id}`} variant="link">
                  Edit
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
