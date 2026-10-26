import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const revalidate = 3600;

export default async function sitemap() {
  const pages = ["", "/sport", "/atelier", "/shop", "/size-guide"].map((path) => ({
    url: `${site}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  let products = [];
  try {
    await connectDB();
    products = await Product.find({ active: true }).select("slug updatedAt").lean();
  } catch (error) {
    console.error("[sitemap] couldn't load products:", error.message);
  }

  return [
    ...pages,
    ...products.map((p) => ({ url: `${site}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.7 })),
  ];
}
