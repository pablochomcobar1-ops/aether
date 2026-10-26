"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeOrderStatus } from "@/app/admin/orders/actions";
import Button from "@/components/ui/Button";

const ACTION = { packed: "Mark packed", shipped: "Mark shipped", delivered: "Mark delivered" };

export default function OrderStatusSelect({ orderId, next }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  function move(status) {
    setError("");
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, status);
      setConfirming(false);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  if (next.length === 0) return <p className="text-sm text-mute">This order is finished. Its status can&apos;t change.</p>;

  const forward = next.filter((s) => s !== "cancelled");
  const canCancel = next.includes("cancelled");

  return (
    <div>
      {confirming ? (
        <div role="group" aria-label="Confirm cancellation" className="border border-danger p-4">
          <p className="text-sm">
            Cancel this order and put its pairs back in stock? This can&apos;t be undone. Refund the payment in Razorpay
            as well.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => move("cancelled")}
              disabled={pending}
              className="min-h-11 bg-danger px-5 font-display text-sm uppercase tracking-[0.12em] text-bone transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Cancelling…" : "Yes, cancel order"}
            </button>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
              Keep order
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {forward.map((status) => (
            <Button key={status} onClick={() => move(status)} disabled={pending}>
              {pending ? "Saving…" : ACTION[status]}
            </Button>
          ))}
          {canCancel && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={pending}
              className="min-h-11 border border-danger/70 px-5 font-display text-sm uppercase tracking-[0.12em] text-[#f87171] transition-colors hover:bg-danger hover:text-bone disabled:opacity-50"
            >
              Cancel order
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#f87171]">
          {error}
        </p>
      )}
    </div>
  );
}
