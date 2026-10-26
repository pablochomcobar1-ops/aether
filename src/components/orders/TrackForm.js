"use client";

import { useState } from "react";
import { trackSchema } from "@/lib/validators";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import OrderCard from "./OrderCard";

function check(name, value) {
  const result = trackSchema.shape[name].safeParse(value);
  return result.success ? "" : result.error.issues[0].message;
}

export default function TrackForm({ initialNumber = "" }) {
  const [values, setValues] = useState({ orderNumber: initialNumber, email: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(event) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: check(name, value) }));
    setFormError("");
  }

  function blur(event) {
    const { name, value } = event.target;
    if (value) setErrors((e) => ({ ...e, [name]: check(name, value) }));
  }

  async function submit(event) {
    event.preventDefault();
    const found = Object.fromEntries(["orderNumber", "email"].map((f) => [f, check(f, values[f])]).filter(([, m]) => m));
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setFormError("");
    setOrder(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setOrder(body.order);
      else {
        setErrors(body.fields ?? {});
        setFormError(body.fields ? "" : (body.error ?? "Something went wrong. Try again."));
      }
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[1fr_1.4fr_auto] md:items-start">
        <Field
          label="Order number"
          name="orderNumber"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="AE-7KQ2MX"
          value={values.orderNumber}
          onChange={update}
          onBlur={blur}
          error={errors.orderNumber}
        />
        <Field
          label="Email used at checkout"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={update}
          onBlur={blur}
          error={errors.email}
        />
        <Button type="submit" size="lg" disabled={busy} className="md:mt-6 md:h-12 md:min-h-12">
          {busy ? "Finding…" : "Track"}
        </Button>
      </form>

      <div aria-live="polite" className="mt-10">
        {formError && <p className="border border-danger/60 p-4 text-sm text-[#f87171]">{formError}</p>}
        {order && <OrderCard order={order} />}
      </div>
    </>
  );
}
