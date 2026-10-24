"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";

// Paid: empty the bag (covers the case where the browser lost its connection after paying).
// Pending: Razorpay's webhook is still on its way, so re-check every 3 seconds for a minute.
export default function AfterPayment({ paid }) {
  const router = useRouter();

  useEffect(() => {
    if (paid) {
      useCart.getState().clear();
      return;
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 20) clearInterval(timer);
      else router.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [paid, router]);

  return null;
}
