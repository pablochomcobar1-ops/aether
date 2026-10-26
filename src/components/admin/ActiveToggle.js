"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleActive } from "@/app/admin/products/actions";

export default function ActiveToggle({ productId, active, name }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function flip() {
    setError("");
    startTransition(async () => {
      const result = await toggleActive(productId);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`Show ${name} in the store`}
        onClick={flip}
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-3 disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={`relative block h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${active ? "border-bone bg-bone" : "border-line bg-carbon"}`}
        >
          <span
            className={`absolute left-[3px] top-1/2 size-4 -translate-y-1/2 rounded-full transition-transform duration-200 ease-out ${
              active ? "translate-x-5 bg-ink" : "translate-x-0 bg-mute"
            }`}
          />
        </span>
        <span className="text-sm">{active ? "Live" : "Hidden"}</span>
      </button>
      {error && <span className="text-xs text-[#f87171]">{error}</span>}
    </span>
  );
}
