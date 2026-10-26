const isDev = process.env.NODE_ENV !== "production";
// HTTPS-only rules go out on Vercel only. Sent from localhost, HSTS would make your
// browser insist on https://localhost for two years.
const onVercel = process.env.VERCEL === "1";

// Content Security Policy: the browser refuses anything not on this list.
// - Razorpay needs its script, its iframe and its API (all on *.razorpay.com).
// - 'wasm-unsafe-eval' lets the 3D models' meshopt decoder (WebAssembly) run.
// - 'unsafe-inline' for scripts: Next.js adds small inline scripts. The strict
//   alternative (nonces) would force every page to render on each request.
// - 'unsafe-eval' only in development, where React needs it for fast refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://*.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.razorpay.com",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https://*.razorpay.com",
  "frame-src https://*.razorpay.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(onVercel ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  ...(onVercel ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
