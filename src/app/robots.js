import { SITE_URL as site } from "@/lib/site";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/orders", "/api", "/login", "/register", "/cart", "/wishlist"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
