# AETHER Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build AETHER, a premium footwear demo store (Sport + Atelier) with 3D product heroes, real Razorpay test-mode checkout, accounts, and an admin panel, deployed on Vercel as a portfolio piece.

**Architecture:** One Next.js 16 App Router app (JavaScript, `src/`). Pages render on the server and read MongoDB through Mongoose. Money logic (pricing, coupons, payment verification, order fulfilment) lives in small pure modules under `src/lib`, unit-tested with Vitest; the client never decides a price. 3D runs client-side with React Three Fiber, loaded lazily so the store works without it.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, MongoDB Atlas + Mongoose, Razorpay (test mode), Resend, zod, bcryptjs, jose, zustand, three / @react-three/fiber / @react-three/drei, gsap + @gsap/react, lenis, motion, Vitest, mongodb-memory-server.

**Spec:** The "Brief" section directly below (locked with Jainam on 2026-10-22). Design style: `power` from the design-style library.

---

## Brief (the spec)

- **Brand:** AETHER, an invented premium footwear house. English only. Portfolio demo store.
- **Two sides:**
  - **Sport**: collections Run, Court, Street. ₹3,000 – ₹12,000. Energetic. 3D sneaker hero.
  - **Atelier**: collections Old Money, Classic, Formal. ₹6,000 – ₹20,000. Slow, elegant. 3D loafer.
- **Catalogue:** 12 products at launch, 2 per collection. Sizes UK 6–12, stock tracked per size. AI-generated studio photos in one consistent style.
- **3D:** two free, properly licensed models (sneaker + loafer), recoloured to brand, credited in the footer.
- **Shopping:** search + filters (side, collection, size, price), size guide, wishlist, coupon codes. No reviews.
- **Checkout:** guest checkout or optional account. Razorpay test mode with a visible "demo store" note and test card details.
- **Pricing rules:** prices include GST. Free shipping when the order (after discount) is ₹5,000 or more, otherwise ₹149.
- **After payment:** confirmation email via Resend. Order status Paid → Packed → Shipped → Delivered, or Cancelled, changed by admin. Refunds done by hand in the Razorpay dashboard.
- **Admin:** manage products, stock per size, orders, coupons.
- **Hosting:** Vercel, new MongoDB Atlas database, new GitHub repo, free `.vercel.app` URL.
- **Pace:** ~10–12 h/week, live in 3–4 weeks.

---

## Global Constraints

- JavaScript only (no TypeScript). Code under `src/`. Import alias `@/*` → `src/*`.
- Next.js 16: request interception lives in `src/proxy.js` (not `middleware.js`).
- All money is stored and computed as **integer paise**. `₹149` = `14900`. Display with `formatINR`.
- `FREE_SHIPPING_MIN = 500000`, `SHIPPING_FEE = 14900`. Comparison is `>=` on (subtotal − discount).
- Sizes are exactly `[6, 7, 8, 9, 10, 11, 12]` (UK). Max quantity per cart line: `5`.
- Sides: `"sport" | "atelier"`. Collections: `"run" | "court" | "street"` (sport), `"old-money" | "classic" | "formal"` (atelier).
- Order statuses: `"pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled"`.
- Price ranges: sport products 300000–1200000 paise; atelier products 600000–2000000 paise. Product validation enforces these.
- Razorpay **test keys only** (`rzp_test_…`). Checkout shows: "Demo store. No real money is charged. Use Razorpay test card 4111 1111 1111 1111, any future date, any CVV."
- Server never trusts a price, total, or stock number sent by the browser.
- Secrets only in `.env.local` / Vercel env: `MONGODB_URI`, `SESSION_SECRET` (32+ chars), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`.
- **Design (power style):** surface `#000000`, text `#FFFFFF`, primary `#FAFAFA`, line `#262626`, mute `#A3A3A3`, success `#16A34A`, warning `#D97706`, danger `#DC2626`. Display font Oswald (Sport weights 600–700, Atelier weights 200–300); body Inter for legibility; mono JetBrains Mono. 8pt spacing grid. Monochrome: no other accent colours.
- Accessibility: visible focus rings, 44px+ touch targets, semantic HTML, every input has a visible label, `prefers-reduced-motion` disables smooth scroll, cursor follower and 3D auto-rotation (shows a still image instead of the canvas).
- Custom cursor only on `(pointer: fine)` devices.
- 3D model licences must be CC0 or CC-BY; CC-BY authors credited in the footer.
- No customer reviews, no fake testimonials anywhere.

## Review Focus

1. **Tampered checkout request** (browser sends edited price, quantity 999, or a size with 0 stock): server re-prices from the database, rejects qty > 5 and out-of-stock sizes with a clear message. → tests in Task 4 and Task 9.
2. **Same payment confirmed twice** (verify route and webhook both arrive, or user refreshes success page): order becomes `paid` once, stock drops once, one email. → test in Task 10.
3. **Last pair bought by two people at once:** only one stock decrement succeeds; the other paid order is flagged `stockIssue: true` and shows "Refund needed" in admin. → test in Task 10.
4. **Customer closes or fails the Razorpay popup:** order stays `pending`, cart is kept, message "Payment didn't go through. Your cart is saved, try again." → step in Task 11.
5. **Non-admin calls an admin page or server action directly** (skipping the UI): redirected or refused even though `proxy.js` was bypassed, because every admin action calls `requireAdmin()` itself. → test in Task 7, used in Tasks 13–14.

---

## File Structure

```
aether/
├── public/
│   ├── models/            sneaker.glb, loafer.glb (Draco-compressed)
│   └── images/products/   <slug>-1.webp … <slug>-4.webp
│       images/fallback/   sneaker-still.webp, loafer-still.webp
├── scripts/seed.mjs       12 products + 2 coupons + 1 admin
├── src/
│   ├── proxy.js           redirects non-admins away from /admin, guests away from /orders
│   ├── app/
│   │   ├── layout.js, globals.css, not-found.js
│   │   ├── page.js                    home: split Sport / Atelier hero
│   │   ├── sport/page.js, atelier/page.js
│   │   ├── shop/page.js               search + filters (searchParams)
│   │   ├── product/[slug]/page.js
│   │   ├── cart/page.js, wishlist/page.js, size-guide/page.js
│   │   ├── checkout/page.js, checkout/success/page.js
│   │   ├── orders/page.js, orders/track/page.js
│   │   ├── login/page.js, register/page.js
│   │   ├── admin/ layout.js, page.js, products/…, orders/…, coupons/page.js
│   │   └── api/
│   │       ├── auth/register/route.js, auth/login/route.js, auth/logout/route.js
│   │       ├── cart/price/route.js          live cart totals from the database
│   │       ├── checkout/route.js            price cart, create pending Order + Razorpay order
│   │       ├── payment/verify/route.js
│   │       └── webhooks/razorpay/route.js
│   ├── components/
│   │   ├── layout/   Navbar, Footer (with 3D credits), SmoothScroll, PageTransition
│   │   ├── ui/       Cursor, MagneticButton, Button, Input, Select, Price, DemoNotice
│   │   ├── three/    ShoeCanvas, ShoeModel, StaticShoe
│   │   ├── product/  ProductCard, ProductGallery, SizePicker, Filters
│   │   ├── cart/     CartDrawer, CartLine
│   │   └── admin/    ProductForm, StockGrid, OrderStatusSelect, CouponForm
│   ├── lib/          db, money, catalog, pricing, coupons, validators, auth, rateLimit,
│   │                 razorpay, orders, email
│   ├── models/       Product, User, Order, Coupon, RateLimit
│   └── store/        cart.js, wishlist.js
├── tests/lib/        one test file per lib module
├── next.config.mjs   security headers
├── vitest.config.mjs
└── .env.local        (never committed)
```

---

## Phase A — Foundation

### Task 1: Power design system, git, test runner

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.js`, `src/app/page.js`
- Create: `vitest.config.mjs`, `.env.example`, `src/lib/money.js`, `tests/lib/money.test.js`

**Interfaces:**
- Produces: `formatINR(paise: number) -> string` (e.g. `formatINR(1249900) === "₹12,499"`, `formatINR(14900) === "₹149"`). Tailwind theme tokens: `ink, carbon, line, bone, mute, success, warning, danger`; font utilities `font-display` (Oswald), `font-body` (Inter), `font-mono`.

- [ ] **Step 1:** `git init`, add `.env.local` to `.gitignore` (create-next-app adds `.env*`; confirm), first commit of the generated app.
- [ ] **Step 2:** `npm i -D vitest mongodb-memory-server` and `npm i mongoose zod bcryptjs jose razorpay resend`. Add `"test": "vitest run"` to `package.json`. `vitest.config.mjs` sets the `@` alias to `./src` and `environment: "node"`.
- [ ] **Step 3: Write the failing test** `tests/lib/money.test.js`: `formatINR(1249900)` → `"₹12,499"`, `formatINR(14900)` → `"₹149"`, `formatINR(0)` → `"₹0"`, `formatINR(1000050)` → `"₹10,000.50"`.
- [ ] **Step 4:** `npm test` → FAIL (module missing).
- [ ] **Step 5:** Implement `formatINR` with `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 })`.
- [ ] **Step 6:** `npm test` → PASS.
- [ ] **Step 7:** Replace `globals.css` tokens with the Power palette from Global Constraints; load Oswald (200–700), Inter, JetBrains Mono via `next/font/google` in `layout.js`; add a global `:focus-visible` ring (2px `#FAFAFA`, 2px offset). Home placeholder shows "AETHER" in Oswald 700.
- [ ] **Step 8:** `npm run dev` → black page, white Oswald "AETHER", Tab key shows a visible focus ring on a test link.
- [ ] **Step 9:** Commit `feat: power design tokens, money formatting, vitest`.

### Task 2: Database connection and models

**Files:**
- Create: `src/lib/db.js`, `src/models/Product.js`, `src/models/User.js`, `src/models/Order.js`, `src/models/Coupon.js`, `src/models/RateLimit.js`, `tests/lib/models.test.js`

**Interfaces:**
- Produces: `connectDB() -> Promise<mongoose>` (cached on `globalThis` so hot reload and serverless reuse one connection).
- `Product { slug (unique), name, side, collection, price, description, details: [string], colorway, images: [string], sizes: [{ uk: number, stock: number }], featured: bool, active: bool }`
- `User { name, email (unique, lowercased), passwordHash, role: "customer"|"admin" }`
- `Order { orderNumber (unique, "AE-" + 6 uppercase alnum), userId?, email, address { name, phone, line1, line2, city, state, pincode }, items [{ productId, slug, name, image, size, unitPrice, qty }], subtotal, discount, couponCode, shipping, total, razorpayOrderId (unique), razorpayPaymentId, status, stockIssue: bool, emailSent: bool, statusHistory [{ status, at }] }` with timestamps.
- `Coupon { code (unique, uppercased), type: "percent"|"flat", value, minSubtotal, maxUses, uses, expiresAt, active }`
- `RateLimit { key (unique), count, expiresAt }` with TTL index on `expiresAt`.

- [ ] **Step 1: Write the failing test** using `MongoMemoryServer`: creating a Product with `price: 250000` and `side: "sport"` fails validation (below 300000); a Product with `collection: "old-money"` and `side: "sport"` fails (collection must match side); a Product with a size `uk: 13` fails; User email `"A@B.com"` is saved as `"a@b.com"`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement models with Mongoose validators enforcing Global Constraints (price range per side, collection-to-side match, sizes 6–12, stock ≥ 0 integer, status enum). Export with `mongoose.models.X || mongoose.model(...)`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Create Atlas database `aether`, put `MONGODB_URI` in `.env.local`, add a temporary server component that calls `connectDB()` and prints "connected". Remove it after it works.
- [ ] **Step 6:** Commit `feat: mongo connection and data models`.

### Task 3: Catalogue seed and read queries

**Files:**
- Create: `scripts/seed.mjs`, `src/lib/catalog.js`, `tests/lib/catalog.test.js`, `public/images/products/*`

**Interfaces:**
- Consumes: models from Task 2.
- Produces: `listProducts({ side?, collection?, size?, min?, max?, q? }) -> Promise<Product[]>` (active only; `size` means that size has stock > 0; `q` matches name/colorway case-insensitively, regex-escaped); `getProductBySlug(slug) -> Promise<Product|null>`; `getFeatured(side) -> Promise<Product[]>`.

- [ ] **Step 1:** Generate product photos: 4 per product, same studio setup (black seamless background, soft top light, 3/4 view, side, top, detail), exported as 1600×1600 WebP into `public/images/products/<slug>-1..4.webp`.
- [ ] **Step 2:** Write `scripts/seed.mjs`: 12 products (2 per collection), names and copy invented for AETHER, prices inside each side's range, stock 0–8 per size with at least one size at 0 and one product with exactly 1 left; coupons `WELCOME10` (percent 10, minSubtotal 300000) and `FLAT500` (flat 50000, minSubtotal 600000); one admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. Run with `node --env-file=.env.local scripts/seed.mjs`.
- [ ] **Step 3: Write the failing test** (seed a small fixture into memory server): `listProducts({ side: "atelier" })` returns only atelier; `listProducts({ size: 9 })` excludes a product whose UK 9 stock is 0; `listProducts({ q: "(" })` does not throw; inactive products never appear; `min`/`max` filter by paise.
- [ ] **Step 4:** `npm test` → FAIL. **Step 5:** implement. **Step 6:** `npm test` → PASS.
- [ ] **Step 7:** Run seed against Atlas; confirm 12 products in the Atlas UI.
- [ ] **Step 8:** Commit `feat: catalogue seed and queries`.

### Task 4: Pricing and coupons (the money core)

**Files:**
- Create: `src/lib/coupons.js`, `src/lib/pricing.js`, `tests/lib/coupons.test.js`, `tests/lib/pricing.test.js`

**Interfaces:**
- Produces: `evaluateCoupon(coupon|null, subtotal, now: Date) -> { ok: bool, discount: number, reason?: string }`
- Produces: `priceCart({ lines: [{ productId, size, qty }], products: Product[], coupon: Coupon|null, now: Date }) -> { items, subtotal, discount, shipping, total, errors: [{ productId, size, message }] }`. Pure function: no database calls. `items` carry `unitPrice` from `products`, never from `lines`.

- [ ] **Step 1: Write failing coupon tests:** percent 10 on 500000 → discount 50000; flat 50000 on subtotal 400000 with minSubtotal 600000 → `ok: false`, reason "Add ₹2,000 more to use this code"; expired → reason "This code has expired"; `uses >= maxUses` → "This code has been fully used"; inactive → "This code isn't valid"; discount never exceeds subtotal.
- [ ] **Step 2: Write failing pricing tests:**
  - one line qty 2 of a 450000 product → subtotal 900000, shipping 0, total 900000
  - subtotal 450000 → shipping 14900, total 464900
  - subtotal 520000 with WELCOME10 → discount 52000, after-discount 468000 < 500000 → shipping 14900, total 482900
  - exactly 500000 after discount → shipping 0
  - qty 6 → error "You can buy up to 5 of each size"
  - size with stock 1 and qty 2 → error "Only 1 left in UK 9"
  - unknown productId or inactive product → error "This item is no longer available"
  - a `lines` entry that includes a `price` field is ignored (total unchanged)
- [ ] **Step 3:** `npm test` → FAIL. **Step 4:** implement. **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: server-side pricing and coupons`.

---

## Phase B — The expensive feel

### Task 5: Layout shell, smooth scroll, cursor, navbar, footer

**Files:**
- Create: `src/components/layout/{SmoothScroll,Navbar,Footer,PageTransition}.js`, `src/components/ui/{Cursor,MagneticButton,Button}.js`
- Modify: `src/app/layout.js`

**Interfaces:**
- Produces: `<Button variant="solid"|"outline"|"link" size="md"|"lg">`, `<MagneticButton strength={0.3}>`. Navbar links: Sport, Atelier, Shop, search icon, wishlist icon, cart icon with count (reads `store/cart` from Task 8, shows 0 until then), account icon.

- [ ] **Step 1:** `SmoothScroll` (client) starts Lenis and wires it to GSAP ScrollTrigger's ticker; does nothing when `prefers-reduced-motion: reduce`.
- [ ] **Step 2:** `Cursor` (client): dot + ring following the pointer with eased lag; grows over `a, button, [data-cursor]`; renders `null` unless `matchMedia("(pointer: fine)")` and motion allowed.
- [ ] **Step 3:** Navbar: transparent over hero, solid black with 1px `line` border after 80px scroll; hides on scroll down, shows on scroll up; on < 768px a full-screen menu opens with staggered links. All icon buttons have `aria-label` and 44px hit area.
- [ ] **Step 4:** Footer: collections, size guide, track order, demo-store line, and a **3D model credits** line (filled in Task 6).
- [ ] **Step 5:** `PageTransition`: `motion` fade + 12px rise on route change (opacity only under reduced motion).
- [ ] **Step 6: Verify:** desktop shows smooth scroll and cursor; a phone-width window shows no cursor and a working menu; turning on "reduce motion" in OS settings disables both.
- [ ] **Step 7:** Commit `feat: layout shell with motion`.

### Task 6: 3D shoe heroes and home page

**Files:**
- Create: `src/components/three/{ShoeCanvas,ShoeModel,StaticShoe}.js`, `public/models/{sneaker,loafer}.glb`, `public/images/fallback/*`
- Modify: `src/app/page.js`; Create: `src/app/sport/page.js`, `src/app/atelier/page.js`

**Interfaces:**
- Produces: `<ShoeCanvas model="sneaker"|"loafer" mood="sport"|"atelier" />`. `mood="sport"`: faster scroll-linked rotation, hard rim light. `mood="atelier"`: slow idle turn, soft warm key light. Falls back to `<StaticShoe>` (WebP still) when reduced motion is on, WebGL is unavailable, or while the model loads.

- [ ] **Step 1:** Pick a CC0 or CC-BY sneaker and loafer (Sketchfab / Poly Pizza). Record title, author, licence, URL in the footer credits. Recolour in Blender (Sport: white/black; Atelier: dark cognac leather — the one warm tone allowed, on the model only, not the UI). Export GLB with Draco; each file under 3 MB.
- [ ] **Step 2:** `ShoeCanvas` loaded via `next/dynamic` with `ssr: false`; `dpr={[1, 1.5]}` on mobile, `[1, 2]` on desktop; drei `useGLTF` + `Environment` preset; GSAP ScrollTrigger drives rotation.
- [ ] **Step 3:** Home: full-screen split hero. Left half Sport (heavy Oswald "BUILT FOR SPEED", sneaker), right half Atelier (light Oswald "QUIET AUTHORITY", loafer). Hovering a half widens it to 60%. On mobile the halves stack. Below: featured products from each side (`getFeatured`).
- [ ] **Step 4:** `/sport` and `/atelier` landing pages: their 3D model pinned while three collection panels scroll past.
- [ ] **Step 5: Verify:** Lighthouse performance ≥ 80 on mobile for `/`; reduced motion shows stills, no canvas; no console errors.
- [ ] **Step 6:** Commit `feat: 3d heroes and home`.

---

## Phase C — Shopping

### Task 7: Accounts (sessions, register, login, guards)

**Files:**
- Create: `src/lib/auth.js`, `src/lib/validators.js`, `src/lib/rateLimit.js`, `src/app/api/auth/{register,login,logout}/route.js`, `src/app/login/page.js`, `src/app/register/page.js`, `src/proxy.js`, `tests/lib/auth.test.js`, `tests/lib/rateLimit.test.js`

**Interfaces:**
- Produces: `hashPassword(pw) -> Promise<string>` (bcrypt cost 12); `verifyPassword(pw, hash) -> Promise<bool>`; `signSession({ userId, role }) -> Promise<string>` and `readSession(token) -> Promise<{ userId, role }|null>` (jose HS256, 7-day expiry, `SESSION_SECRET`); `getSession() -> Promise<{userId, role}|null>` (reads cookie `aether_session`); `setSessionCookie(token)` (httpOnly, secure in production, sameSite lax, path /); `requireAdmin() -> Promise<{userId}>` (throws/redirects to `/login` if not admin, re-reading the role from the database).
- Produces zod schemas in `validators.js`: `registerSchema` (name 2–60, email, password 8–72), `loginSchema`, `addressSchema` (phone `/^[6-9]\d{9}$/`, pincode `/^[1-9]\d{5}$/`, required name/line1/city/state), `cartLinesSchema` (1–20 lines, size in 6–12, qty 1–5).
- Produces: `rateLimit(key, { limit, windowSec }) -> Promise<{ ok, retryAfter }>` backed by `RateLimit` collection.

- [ ] **Step 1: Write failing tests:** a tampered token (one character changed) → `readSession` returns null; an expired token → null; `verifyPassword` false for wrong password; `requireAdmin` with a customer session throws; `rateLimit` allows 5 then blocks the 6th within the window and allows again after expiry (fake `now`).
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implement. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Routes: login rate-limited 5 per 15 min per IP+email; same error for unknown email and wrong password ("Email or password is incorrect"); register rejects duplicate email with "An account with this email already exists. Log in instead."
- [ ] **Step 6:** `proxy.js`: `/admin/*` without an admin session → `/login?next=…`; `/orders` without any session → `/login`. (Defence in depth only; pages and actions still call `getSession`/`requireAdmin`.)
- [ ] **Step 7: Verify:** register, log out, log in; visiting `/admin` as a customer redirects.
- [ ] **Step 8:** Commit `feat: accounts and route guards`.

### Task 8: Shop, product page, cart, wishlist, size guide

**Files:**
- Create: `src/store/cart.js`, `src/store/wishlist.js`, `src/components/product/{ProductCard,ProductGallery,SizePicker,Filters}.js`, `src/components/cart/{CartDrawer,CartLine}.js`, `src/app/shop/page.js`, `src/app/product/[slug]/page.js`, `src/app/cart/page.js`, `src/app/wishlist/page.js`, `src/app/size-guide/page.js`, `src/app/api/cart/price/route.js`

**Interfaces:**
- Consumes: `listProducts`, `getProductBySlug` (Task 3); `priceCart` (Task 4); `cartLinesSchema` (Task 7).
- Produces: `useCart()` → `{ lines: [{ productId, slug, size, qty }], add(line), setQty(productId, size, qty), remove(productId, size), clear(), open, setOpen }`, persisted to localStorage key `aether-cart` (lines only, no prices). `useWishlist()` → `{ ids, toggle(productId), has(productId) }` persisted to `aether-wishlist`.
- Produces: `POST /api/cart/price` body `{ lines, couponCode? }` → `priceCart` result with product names/images, used by drawer, cart page and checkout.

- [ ] **Step 1:** Shop page reads filters from `searchParams` (shareable URLs); `Filters` updates the URL. Empty result shows "No shoes match these filters" with a "Clear filters" button.
- [ ] **Step 2:** Product page: gallery (4 photos, zoom on hover, swipe on mobile), price, size picker (sold-out sizes shown struck through and not selectable), "Add to bag" disabled until a size is picked with helper text "Pick a size", wishlist heart, link to size guide. `generateMetadata` for SEO; unknown slug → `notFound()`.
- [ ] **Step 3:** Cart drawer slides from the right, focus is trapped inside, Esc closes and returns focus. Prices always come from `/api/cart/price`.
- [ ] **Step 4:** Size guide: UK / EU / US / foot length (cm) table for UK 6–12 and a "how to measure" note.
- [ ] **Step 5: Verify:** add two sizes of one shoe, change quantity to 5 (6 is blocked), refresh — cart persists; manually edit localStorage to add `"price": 1` — shown totals are unchanged.
- [ ] **Step 6:** Commit `feat: shop, product, cart, wishlist`.

---

## Phase D — Payments

### Task 9: Checkout API (create order)

**Files:**
- Create: `src/lib/razorpay.js`, `src/app/api/checkout/route.js`, `tests/lib/razorpay.test.js`, `tests/api/checkout.test.js`

**Interfaces:**
- Produces: `createRazorpayOrder({ amount, receipt }) -> Promise<{ id, amount, currency }>`; `verifyPaymentSignature({ orderId, paymentId, signature }, secret) -> bool` (HMAC-SHA256 of `orderId + "|" + paymentId`, compared with `crypto.timingSafeEqual`, false on length mismatch); `verifyWebhookSignature(rawBody: string, signature, secret) -> bool`.
- Produces: `POST /api/checkout` body `{ lines, couponCode?, email, address }` → `{ orderNumber, razorpayOrderId, amount, keyId }` or `400 { errors }`. Creates `Order` with status `pending` using `priceCart` output only. Rate limit 10/min per IP.

- [ ] **Step 1: Write failing tests:** a signature computed with the right secret verifies; one with a changed paymentId fails; a different-length signature returns false (no throw); checkout handler (Razorpay client mocked) with `lines` containing qty 6 → 400; with a valid cart → Order saved with `total` equal to `priceCart` total, regardless of any `total` field in the body.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Commit `feat: checkout order creation`.

### Task 10: Payment verification, webhook, fulfilment, email

**Files:**
- Create: `src/lib/orders.js`, `src/lib/email.js`, `src/app/api/payment/verify/route.js`, `src/app/api/webhooks/razorpay/route.js`, `tests/lib/orders.test.js`

**Interfaces:**
- Produces: `fulfilPaidOrder({ razorpayOrderId, razorpayPaymentId }) -> Promise<{ order, alreadyPaid: bool }>`. Steps: atomic `findOneAndUpdate({ razorpayOrderId, status: "pending" }, { status: "paid", … })`; if no match, return the existing order with `alreadyPaid: true` and do nothing else. For each item, conditional decrement `updateOne({ _id, sizes: { $elemMatch: { uk: size, stock: { $gte: qty } } } }, { $inc: { "sizes.$.stock": -qty } })`; any miss sets `stockIssue: true`. Increments coupon `uses`. Sends email once, guarded by atomic `emailSent` flip.
- Produces: `sendOrderConfirmation(order) -> Promise<void>` (Resend; failure is logged and never fails the payment).
- `POST /api/payment/verify` `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` → verifies signature, then `fulfilPaidOrder`, returns `{ orderNumber }`. Bad signature → 400.
- `POST /api/webhooks/razorpay` reads raw text body, verifies `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET`, handles `payment.captured` and `order.paid` via `fulfilPaidOrder`, always 200 for valid but unhandled events.

- [ ] **Step 1: Write failing tests** (memory server, email mocked):
  - calling `fulfilPaidOrder` twice in parallel → one `paid` transition, stock reduced once, email mock called once
  - two pending orders for the last pair (stock 1) fulfilled in parallel → stock ends at 0 (never −1), exactly one order has `stockIssue: true`
  - coupon `uses` goes from 0 to 1
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** In Razorpay dashboard (test mode) add webhook to `https://<deploy-url>/api/webhooks/razorpay` for `payment.captured`, `order.paid` (done for real in Task 15; locally test with the dashboard's "test webhook" + a tunnel, or skip until deploy).
- [ ] **Step 4:** Commit `feat: payment verification and idempotent fulfilment`.

### Task 11: Checkout page and success page

**Files:**
- Create: `src/app/checkout/page.js`, `src/app/checkout/success/page.js`, `src/components/ui/DemoNotice.js`, `src/components/ui/{Input,Select}.js`

**Interfaces:**
- Consumes: `/api/cart/price`, `/api/checkout`, `/api/payment/verify`, `addressSchema`.

- [ ] **Step 1:** Form: email (prefilled when logged in), address fields with visible labels, validation on blur, errors clear as you type; Indian states as a select; coupon field with "Apply"; order summary on the right (bottom on mobile); `DemoNotice` above the pay button with the exact text from Global Constraints.
- [ ] **Step 2:** Pay button loads `https://checkout.razorpay.com/v1/checkout.js` via `next/script`, opens Razorpay with the returned order id, theme colour `#000000`. Handler posts to `/api/payment/verify`, clears cart, routes to `/checkout/success?order=AE-XXXXXX`.
- [ ] **Step 3:** `modal.ondismiss` and `payment.failed`: keep cart, show "Payment didn't go through. Your cart is saved, try again." Button re-enables.
- [ ] **Step 4:** Success page reads the order server-side by order number and shows items, total, and "A confirmation is on its way to <email>".
- [ ] **Step 5: Verify (test mode):** pay with 4111 1111 1111 1111 → success page, order `paid` in Atlas, stock reduced, email received. Close the popup → message shown, order stays `pending`. Use Razorpay's failure test card → same message.
- [ ] **Step 6:** Commit `feat: checkout flow`.

---

## Phase E — After the sale

### Task 12: Order history and guest tracking

**Files:**
- Create: `src/app/orders/page.js`, `src/app/orders/track/page.js`

**Interfaces:**
- Consumes: `getSession`, `Order`, `rateLimit`.

- [ ] **Step 1:** `/orders` (logged in): orders where `userId` matches or `email` equals the account email, newest first, with a status timeline Paid → Packed → Shipped → Delivered.
- [ ] **Step 2:** `/orders/track`: order number + email form; both must match or the reply is "We couldn't find that order. Check the number and email." (same message either way); rate-limited 10 per 15 min per IP.
- [ ] **Step 3: Verify:** guest order is trackable; wrong email shows the generic message.
- [ ] **Step 4:** Commit `feat: order history and tracking`.

### Task 13: Admin — products and stock

**Files:**
- Create: `src/app/admin/layout.js`, `src/app/admin/page.js`, `src/app/admin/products/page.js`, `src/app/admin/products/new/page.js`, `src/app/admin/products/[id]/page.js`, `src/app/admin/products/actions.js`, `src/components/admin/{ProductForm,StockGrid}.js`

**Interfaces:**
- Consumes: `requireAdmin` (first line of every page and every server action), `productSchema` (add to `validators.js`: same rules as the Product model).
- Produces server actions: `saveProduct(formData)`, `setStock(productId, uk, stock)`, `toggleActive(productId)`.

- [ ] **Step 1:** Dashboard: today's paid orders, revenue this month (sum of `total` for paid+ statuses), low-stock list (any size ≤ 2), and a red "Refund needed" list for `stockIssue: true`.
- [ ] **Step 2:** Product list with search; product form (images are paths under `/images/products/` for v1); stock grid UK 6–12 with inline number inputs saving on blur.
- [ ] **Step 3: Verify:** as admin, edit a price and stock, see it on the product page; as a customer, POST to the action directly (browser devtools replay) → refused.
- [ ] **Step 4:** Commit `feat: admin products`.

### Task 14: Admin — orders and coupons

**Files:**
- Create: `src/app/admin/orders/page.js`, `src/app/admin/orders/[id]/page.js`, `src/app/admin/orders/actions.js`, `src/app/admin/coupons/page.js`, `src/app/admin/coupons/actions.js`, `src/components/admin/{OrderStatusSelect,CouponForm}.js`, `tests/lib/orderStatus.test.js`

**Interfaces:**
- Produces: `nextStatuses(current) -> string[]` in `src/lib/orders.js`: `paid → [packed, cancelled]`, `packed → [shipped, cancelled]`, `shipped → [delivered]`, `delivered → []`, `cancelled → []`, `pending → []`. Server action `setOrderStatus(orderId, status)` rejects anything not in `nextStatuses`, appends to `statusHistory`. Cancelling a paid order restocks its items once.
- Server actions `saveCoupon(formData)`, `toggleCoupon(id)`.

- [ ] **Step 1: Write failing test** for `nextStatuses` (all six rows) and that cancelling restores stock exactly once when called twice.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Orders list filtered by status; order detail shows customer, address, items, Razorpay payment id with a link to the Razorpay dashboard and the note "Refunds are issued from the Razorpay dashboard."
- [ ] **Step 4:** Commit `feat: admin orders and coupons`.

---

## Phase F — Hardening and launch

### Task 15: Security headers, SEO, deploy

**Files:**
- Modify: `next.config.mjs`; Create: `src/app/robots.js`, `src/app/sitemap.js`, `src/app/not-found.js`, `README.md`

- [ ] **Step 1:** Headers on all routes: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`, and a CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com; img-src 'self' data: blob: https://*.razorpay.com; style-src 'self' 'unsafe-inline'; font-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'`. (`'unsafe-inline'` scripts is a known trade-off to avoid nonce-forced dynamic rendering; noted in README.)
- [ ] **Step 2: Verify:** full test payment still works with the CSP on; browser console shows no CSP violations; securityheaders.com grade A on the deployed URL.
- [ ] **Step 3:** `robots.js` disallows `/admin`, `/checkout`, `/orders`, `/api`; `sitemap.js` lists home, sport, atelier, shop and every product; Open Graph image for home and product pages.
- [ ] **Step 4:** Create GitHub repo `aether`, push; import into Vercel; set all env vars; set Razorpay webhook to the live URL; run seed against production DB once.
- [ ] **Step 5: Verify on the live URL:** full purchase in test mode (verify route + webhook both fire; one email; order `paid` once).
- [ ] **Step 6:** README: what it is, stack, screenshots, demo test card, "how payments are verified" section, model credits.
- [ ] **Step 7:** Commit `chore: security headers, seo, deploy`.

---

## After this plan (later stages, not tasks here)

Stage 5 playwright-cli browser testing (desktop + mobile) · Stage 6 differential-review + supply-chain-risk-auditor · Stage 7 humanizer pass on all copy · Stage 8 verification-before-completion · Stage 9 brag launch video.
