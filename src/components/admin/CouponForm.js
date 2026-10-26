"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCoupon } from "@/app/admin/coupons/actions";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const TYPES = [
  { value: "percent", label: "Percent off" },
  { value: "flat", label: "Rupees off" },
];

// Show the stored "ends at midnight" moment as the last day it works, in India time.
const lastDay = (date) =>
  date ? new Date(new Date(date).getTime() - 1).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "";

const fromCoupon = (c) => ({
  code: c?.code ?? "",
  type: c?.type ?? "percent",
  value: c ? String(c.type === "flat" ? c.value / 100 : c.value) : "",
  minSubtotal: c?.minSubtotal ? String(c.minSubtotal / 100) : "",
  maxUses: c?.maxUses ? String(c.maxUses) : "",
  expiresAt: lastDay(c?.expiresAt),
  active: c?.active ?? true,
});

export default function CouponForm({ coupon }) {
  const router = useRouter();
  const [values, setValues] = useState(() => fromCoupon(coupon));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();

  const field = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    disabled: pending,
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
      setMessage(null);
    },
  });

  function submit(event) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveCoupon(coupon?._id ?? null, values);
      if (!result.ok) {
        setErrors(result.fields ?? {});
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setErrors({});
      if (coupon) {
        router.push("/admin/coupons");
      } else {
        setValues(fromCoupon(null));
        setMessage({ tone: "ok", text: `${result.code} is ready to use.` });
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Code" autoCapitalize="characters" spellCheck={false} placeholder="DIWALI15" {...field("code")} />
        <Select label="Type" options={TYPES} {...field("type")} />
        <Field
          label={values.type === "percent" ? "Percent off" : "Rupees off"}
          inputMode="numeric"
          placeholder={values.type === "percent" ? "15" : "500"}
          hint={values.type === "percent" ? "1 to 90" : "Whole rupees"}
          {...field("value")}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Minimum order (₹, optional)" inputMode="numeric" placeholder="3000" {...field("minSubtotal")} />
        <Field label="Max uses (optional)" inputMode="numeric" placeholder="No limit" {...field("maxUses")} />
        <Field label="Last day (optional)" type="date" hint="Works until midnight, India time" {...field("expiresAt")} />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-[#fafafa]"
          checked={values.active}
          disabled={pending}
          onChange={(e) => setValues((v) => ({ ...v, active: e.target.checked }))}
        />
        Active
      </label>
      <div className="flex flex-wrap items-center gap-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : coupon ? "Save coupon" : "Create coupon"}
        </Button>
        {coupon && (
          <Button href="/admin/coupons" variant="link">
            Cancel
          </Button>
        )}
        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-[#f87171]" : "text-success"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
