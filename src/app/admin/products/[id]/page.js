import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/admin";
import ProductForm from "@/components/admin/ProductForm";
import StockGrid from "@/components/admin/StockGrid";
import ActiveToggle from "@/components/admin/ActiveToggle";
import { toggleActive } from "@/app/admin/products/actions";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const productId = String(product._id);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-mute underline hover:text-bone">
        All products
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight">{product.name}</h1>
          <p className="mt-2 text-mute">{product.colorway}</p>
        </div>
        <div className="flex items-center gap-6">
          <ActiveToggle id={productId} active={product.active} label={`Show ${product.name} in the store`} action={toggleActive} />
          {product.active && (
            <Link href={`/product/${product.slug}`} className="min-h-11 content-center text-sm underline hover:text-mute">
              View in store
            </Link>
          )}
        </div>
      </div>

      {created && (
        <p role="status" className="mt-6 border border-success/60 p-4 text-sm">
          Product created and hidden. Set stock below, then switch it live.
        </p>
      )}

      <section aria-labelledby="stock" className="mt-10 border border-line p-6">
        <h2 id="stock" className="mb-6 font-display text-xl uppercase tracking-wide">
          Stock by size
        </h2>
        <StockGrid productId={productId} sizes={product.sizes} />
      </section>

      <section aria-labelledby="details" className="mt-12">
        <h2 id="details" className="mb-6 font-display text-xl uppercase tracking-wide">
          Details
        </h2>
        <ProductForm product={{ ...product, _id: productId, sizes: undefined, updatedAt: undefined, createdAt: undefined }} />
      </section>
    </div>
  );
}
