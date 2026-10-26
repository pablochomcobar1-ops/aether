const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/orders", "/api", "/login", "/register", "/cart", "/wishlist"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
