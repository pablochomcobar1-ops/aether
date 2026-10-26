# AETHER: Security Review

**Date:** 26 Oct 2026 · **Scope:** `src/` of the AETHER store (Next.js 16, MongoDB, Razorpay) · **Method:** Trail of Bits differential-review, run as a full review: the workspace has no git history, so the whole security-relevant surface was treated as one change.

## Executive summary

| Severity | Found | Fixed now | Accepted |
|---|---|---|---|
| High | 0 | – | – |
| Medium | 2 | 2 | 0 |
| Low | 4 | 1 | 3 |
| Info | 4 | – | 4 |

**Verdict: safe to keep live as a test-mode demo.** The core design is sound:
- prices are always re-calculated on the server
- payment and webhook signatures are checked with HMAC-SHA256 and constant-time comparison
- the move from pending to paid is a single atomic update, so it happens once
- stock comes off only if enough is left, in the same update
- every admin page and admin action re-reads the role from the database
- every input is validated with zod, so there is no way into database operators

The two medium findings were both fixed and tested.

**Confidence:** high for the files read (all 42 files under `src/lib`, `src/app/api`, `src/app/admin`, `src/proxy.js`, the models). Medium for UI components, which were checked only for unsafe HTML (none use `dangerouslySetInnerHTML`). Not covered: Vercel and Atlas account settings beyond what is noted under Info.

## Attack surface

| Entry point | Who can reach it | Protection |
|---|---|---|
| `POST /api/auth/login`, `/register`, `/logout` | Anyone | same-origin check, rate limits, bcrypt cost 12, constant-time dummy hash |
| `POST /api/cart/price`, `GET /api/products` | Anyone (read only) | zod validation, coupon tries 20 per 10 min |
| `POST /api/checkout` | Anyone | same-origin, 10/min/IP, server re-prices, Razorpay amount must match |
| `POST /api/payment/verify` | Anyone | same-origin, 20/min/IP, HMAC signature from Razorpay |
| `POST /api/webhooks/razorpay` | Razorpay (public URL) | HMAC over the raw body, idempotent fulfilment |
| `POST /api/orders/track` | Anyone | same-origin, 10 per 15 min/IP, number + email, one message for every miss |
| Admin server actions (6) | Anyone can call them directly | `requireAdmin()` reads the role from the DB first, plus Next.js action origin check |
| `/checkout/success` | Anyone with a link | shows details only to the placing browser (httpOnly cookie) or the owning account |

## Findings

### 🟠 MEDIUM 1: Password guessing spread across many IPs was not limited (fixed)
- **File:** `src/app/api/auth/login/route.js:20-26` (before the fix)
- **Attacker:** unauthenticated, controlling many IP addresses (a botnet or rotating proxies).
- **Issue:** the limits were 5 per (IP + email) and 30 per IP, both per 15 minutes. Nothing counted guesses **per account** across IPs, so 1,000 IPs could make 5,000 guesses at one account every 15 minutes, with the admin account as the obvious target.
- **Fix:** failed sign-ins are now counted per account from all IPs. 20 failures in an hour returns 429 for that account (`isLimited` in `src/lib/rateLimit.js`). Only failures count, so a successful sign-in uses none of the budget.
- **Verified:** 21 wrong guesses from 21 different IPs gave 20 × 401 then 429, and the right password was then blocked until the window ended. Unit test: `tests/lib/rateLimit.test.js`.
- **Trade-off (accepted):** someone who knows an account's email can lock it for up to an hour with 20 bad tries. The admin email is not published anywhere on the site, so this is the better side of the trade.

### 🟠 MEDIUM 2: A payment error message promised something the system doesn't do (fixed)
- **File:** `src/app/api/payment/verify/route.js:21`
- **Issue:** when the signature check fails, customers were told "it will be refunded automatically". With Razorpay's default auto-capture, a captured payment is **not** refunded automatically. A customer who believed the message could pay twice, or wait for a refund that never comes.
- **Fix:** the message now reads: "We couldn't confirm this payment yet. Please don't pay again. If money left your account, we'll match it to your order or refund it." The webhook still confirms a genuine payment in the background.

### 🟡 LOW 1: The webhook didn't cross-check the paid amount (fixed, defence in depth)
- **File:** `src/app/api/webhooks/razorpay/route.js`, `src/lib/orders.js`
- **Issue:** the order was marked paid on any signed `payment.captured` or `order.paid` event, without comparing amounts. Razorpay orders already fix the amount, so this isn't exploitable today. But it would turn into a real bug if partial payments were ever switched on for orders.
- **Fix:** the webhook passes Razorpay's `amount`. If it differs from the stored total, the order stays pending and the mismatch is logged. Test: "refuses a webhook whose amount doesn't match" in `tests/lib/orders.test.js`.

### 🟡 LOW 2: A coupon's max-uses limit can be exceeded under a race (accepted)
- **File:** `src/lib/orders.js` (coupon `$inc` after payment)
- **Issue:** two customers who check out at the same moment with the last use of a limited coupon both pass the check at checkout, and both get the discount. The `uses` counter then goes one past `maxUses`.
- **Why accepted:** both customers paid the price they were shown, so nobody is charged wrongly. A fix would need to reserve coupon uses at checkout and release them on abandonment, which is too much for a demo.

### 🟡 LOW 3: Sessions can't be revoked before they expire (accepted)
- **File:** `src/lib/token.js`
- **Issue:** sessions are signed tokens that last 7 days. Signing out deletes the cookie, but a stolen token stays valid until it expires.
- **Mitigation already present:** the cookie is httpOnly, Secure and SameSite=Lax, so scripts can't read it. Admin power is re-read from the database on every admin page and action, so removing someone's admin role takes effect immediately.

### 🟡 LOW 4: Registration shows whether an email already has an account (accepted)
- **File:** `src/app/api/auth/register/route.js:25`
- **Why accepted:** saying so helps real users ("Sign in instead") and is rate limited to 5 per hour per IP. Order tracking and success pages do **not** leak whether an order exists.

### ℹ️ Info
1. **CSP allows `'unsafe-inline'` scripts.** This is the documented Next.js trade-off. Nonces would make every page render per request. Everything else in the policy is locked to the site and `*.razorpay.com`. No CSP violations were seen on any live page.
2. **Atlas allows connections from anywhere (`0.0.0.0/0`).** This is needed for Vercel. Security then rests on the database password: use a long, random one, and give the `aether_user` database user `readWrite` on `aether-live` only, not on every database.
3. **Client IPs come from `x-forwarded-for`.** That's safe on Vercel, which overwrites the header. If the app ever moves to a host that doesn't, rate limits could be dodged by faking the header.
4. **Paid means authorized or captured.** Keep Razorpay's automatic capture turned on (the default), so a "paid" order always has captured money.

## Test coverage of the security paths

| Area | Tests |
|---|---|
| Pricing, tampered carts, quantity and stock limits | `pricing.test.js`, `checkout.test.js` |
| Signature checks (right, wrong, wrong length) | `razorpay.test.js` |
| Paid exactly once, last-pair race, coupon count, amount mismatch | `orders.test.js` |
| Status rules, restocking once, short orders | `orderStatus.test.js` |
| Login timing guard, admin role from DB | `auth.test.js` |
| Open-redirect guard, all validators | `validators.test.js` |
| Order page access, tracking | `orderAccess.test.js`, `tracking.test.js` |
| Rate limits, including the new failure limit | `rateLimit.test.js` |
| Admin data rules | `admin.test.js`, `adminCoupons.test.js` |

**166 tests pass** against a real MongoDB. The route handlers themselves are thin and were tested live on the deployed site and locally:
- a cross-site checkout request got 403
- a forged webhook got 400
- a forged payment signature got 400
- a customer replaying admin actions was refused
- a stranger opening someone's order page saw "Order not found"
