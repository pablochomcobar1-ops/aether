"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { addressSchema, checkoutSchema } from "@/lib/validators";
import { INDIAN_STATES } from "@/lib/constants";
import { formatINR } from "@/lib/money";
import { useCart } from "@/store/cart";
import { useCartPricing } from "@/components/cart/useCartPricing";
import ProductImage from "@/components/product/ProductImage";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DemoNotice from "@/components/ui/DemoNotice";

const FIELDS = ["email", "name", "phone", "line1", "line2", "city", "state", "pincode"];
const PAYMENT_FAILED = "Payment didn't go through. Your cart is saved, try again.";
const OFFLINE = "Couldn't reach the server. Check your connection and try again.";

// Same rules the server uses, so a message shown here is the message the server would send.
function check(name, value) {
  const schema = name === "email" ? checkoutSchema.shape.email : addressSchema.shape[name];
  const result = schema.safeParse(value);
  return result.success ? "" : result.error.issues[0].message;
}

function Summary({ data }) {
  return (
    <>
      <ul className="divide-y divide-line">
        {data.rows.map((row) => (
          <li key={`${row.productId}:${row.size}`} className="flex gap-4 py-4">
            <div className="relative size-16 shrink-0 overflow-hidden bg-carbon">
              <ProductImage src={row.image} alt={row.name} name="" sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display uppercase tracking-wide">{row.name}</p>
              <p className="text-sm text-mute">
                UK {row.size} · Qty {row.qty}
              </p>
              {row.error && <p className="mt-1 text-sm text-[#f87171]">{row.error}</p>}
            </div>
            <p className="shrink-0 text-sm tabular-nums">{row.lineTotal ? formatINR(row.lineTotal) : ""}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-3 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-mute">Subtotal</dt>
          <dd className="tabular-nums">{formatINR(data.subtotal)}</dd>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-mute">Discount ({data.couponCode})</dt>
            <dd className="tabular-nums">−{formatINR(data.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-mute">Shipping</dt>
          <dd className="tabular-nums">{data.shipping ? formatINR(data.shipping) : "Free"}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="font-display uppercase tracking-wide">Total</dt>
          <dd className="font-display text-2xl tabular-nums">{formatINR(data.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-mute">Prices include GST.</p>
    </>
  );
}

export default function CheckoutForm({ initial }) {
  const router = useRouter();
  const formRef = useRef(null);
  const clearCart = useCart((s) => s.clear);

  const [values, setValues] = useState({ ...Object.fromEntries(FIELDS.map((f) => [f, ""])), ...initial });
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [stage, setStage] = useState("idle"); // idle | creating | paying | verifying | done
  const [payError, setPayError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  const { data, loading, error, lines, hydrated, refresh } = useCartPricing(stage !== "done", coupon);
  const couponError = coupon && data?.couponError;
  const busy = stage !== "idle";

  function update(event) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: check(name, value) }));
  }

  function blur(event) {
    const { name, value } = event.target;
    if (value) setErrors((e) => ({ ...e, [name]: check(name, value) }));
  }

  function applyCoupon(event) {
    event.preventDefault();
    setCoupon(couponInput.trim().toUpperCase());
  }

  function removeCoupon() {
    setCoupon("");
    setCouponInput("");
  }

  function focusFirstError() {
    requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
  }

  async function confirm(order, response) {
    setStage("verifying");
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayError(body.error ?? PAYMENT_FAILED);
        setStage("idle");
        return;
      }
    } catch {
      // Money has left the customer's account. The Razorpay webhook will still confirm the
      // order, and the success page waits for it, so carry on rather than show a scary error.
    }
    setStage("done");
    clearCart();
    router.replace(`/checkout/success?order=${order.orderNumber}`);
  }

  function openRazorpay(order) {
    setStage("paying");
    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: "AETHER",
      image: `${window.location.origin}/apple-icon.png`,
      description: `Order ${order.orderNumber}`,
      prefill: order.prefill,
      notes: { orderNumber: order.orderNumber },
      theme: { color: "#000000" },
      handler: (response) => confirm(order, response),
      modal: {
        ondismiss: () => {
          setPayError(PAYMENT_FAILED);
          setStage("idle");
        },
      },
    });
    // Razorpay keeps its window open so the customer can try another card; we just explain.
    razorpay.on("payment.failed", () => setPayError(PAYMENT_FAILED));
    razorpay.open();
  }

  async function pay(event) {
    event.preventDefault();
    if (busy || !data || data.hasErrors) return;

    const found = Object.fromEntries(FIELDS.map((f) => [f, check(f, values[f])]).filter(([, m]) => m));
    setErrors(found);
    if (Object.keys(found).length) {
      setPayError("");
      focusFirstError();
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      setPayError("The payment window is still loading. Try again in a moment.");
      return;
    }

    setStage("creating");
    setPayError("");
    const { email, ...address } = values;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map(({ productId, size, qty }) => ({ productId, size, qty })),
          couponCode: data.couponCode ?? undefined,
          email,
          address,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.fields) {
          setErrors(body.fields);
          focusFirstError();
        }
        if (res.status === 409) refresh();
        setPayError(body.error ?? "Something went wrong. Try again.");
        setStage("idle");
        return;
      }
      openRazorpay(body);
    } catch {
      setPayError(OFFLINE);
      setStage("idle");
    }
  }

  if (stage === "done") {
    return (
      <p className="py-24 text-center font-display text-2xl uppercase tracking-tight" role="status">
        Payment received. Opening your order…
      </p>
    );
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-3xl uppercase tracking-tight">Your bag is empty</p>
        <p className="mt-3 text-mute">Add a pair to your bag to check out.</p>
        <div className="mt-8">
          <Button href="/shop">Shop all shoes</Button>
        </div>
      </div>
    );
  }

  const field = (name) => ({
    name,
    value: values[name],
    onChange: update,
    onBlur: blur,
    error: errors[name],
    disabled: busy,
  });

  const payLabel = {
    idle: data ? `Pay ${formatINR(data.total)}` : "Pay",
    creating: "Preparing payment…",
    paying: "Waiting for payment…",
    verifying: "Confirming payment…",
  }[stage];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} />

      <form id="checkout-form" ref={formRef} onSubmit={pay} noValidate className="space-y-12">
        <fieldset className="space-y-6">
          <legend className="mb-6 font-display text-xl uppercase tracking-wide">Contact</legend>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            hint="Your order confirmation goes here."
            {...field("email")}
          />
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="mb-6 font-display text-xl uppercase tracking-wide">Delivery address</legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Full name" autoComplete="name" {...field("name")} />
            <Field
              label="Mobile number"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              hint="For the delivery partner only."
              {...field("phone")}
            />
          </div>
          <Field label="House number and street" autoComplete="address-line1" {...field("line1")} />
          <Field label="Area or landmark (optional)" autoComplete="address-line2" {...field("line2")} />
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="City" autoComplete="address-level2" {...field("city")} />
            <Select
              label="State"
              autoComplete="address-level1"
              options={INDIAN_STATES}
              placeholder="Choose your state"
              {...field("state")}
            />
            <Field label="PIN code" autoComplete="postal-code" inputMode="numeric" maxLength={6} {...field("pincode")} />
          </div>
        </fieldset>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start" aria-labelledby="summary-title">
        <div className="border border-line p-6">
          <h2 id="summary-title" className="font-display text-xl uppercase tracking-wide">
            Order summary
          </h2>

          {!data ? (
            <div className="space-y-4 py-6" aria-busy="true">
              {error ? (
                <p className="text-[#f87171]">{error}</p>
              ) : (
                [0, 1].map((i) => <div key={i} className="h-16 animate-pulse bg-carbon" />)
              )}
            </div>
          ) : (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <Summary data={data} />
            </div>
          )}

          {data?.couponCode ? (
            <div className="mt-6 flex items-center justify-between border border-line px-4 py-3 text-sm">
              <span>
                <span className="font-mono">{data.couponCode}</span> <span className="text-mute">applied</span>
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                disabled={busy}
                className="min-h-11 text-mute underline hover:text-bone"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={applyCoupon} className="mt-6 flex items-start gap-3" noValidate>
              <Field
                label="Coupon code"
                name="coupon"
                autoComplete="off"
                autoCapitalize="characters"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                error={couponError || undefined}
                disabled={busy}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={busy || !couponInput.trim()}
                className="mt-6 h-12 shrink-0"
              >
                Apply
              </Button>
            </form>
          )}

          <DemoNotice className="mt-6" />

          {payError && (
            <p role="alert" className="mt-6 border border-danger/60 p-4 text-sm text-[#f87171]">
              {payError}
            </p>
          )}
          {data?.hasErrors && (
            <p className="mt-6 text-sm text-[#f87171]">
              Some items changed.{" "}
              <Link href="/cart" className="underline hover:text-bone">
                Fix them in your bag
              </Link>{" "}
              to continue.
            </p>
          )}

          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            disabled={busy || !data || data.hasErrors || loading}
            aria-busy={busy || undefined}
            className="mt-6 w-full"
          >
            <Lock size={16} strokeWidth={1.75} aria-hidden="true" />
            {payLabel}
          </Button>
          <p className="mt-3 text-center text-xs text-mute">Secure payment by Razorpay. We never see your card.</p>
        </div>
      </aside>
    </div>
  );
}
