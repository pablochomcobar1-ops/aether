// The site's public address, used for share links, the sitemap and email links.
// Works even if NEXT_PUBLIC_SITE_URL is missing, empty, or typed without https://.
// On Vercel it falls back to the project's own production address.
function resolveSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  let value = fromEnv || (vercel ? `https://${vercel}` : "") || "http://localhost:3000";
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const SITE_URL = resolveSiteUrl();
