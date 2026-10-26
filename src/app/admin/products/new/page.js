import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default function NewProduct() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-mute underline hover:text-bone">
        All products
      </Link>
      <h1 className="mt-4 font-display text-5xl font-bold uppercase tracking-tight">New product</h1>
      <p className="mt-3 text-mute">You&apos;ll set stock for each size on the next screen.</p>
      <div className="mt-10">
        <ProductForm />
      </div>
    </div>
  );
}
