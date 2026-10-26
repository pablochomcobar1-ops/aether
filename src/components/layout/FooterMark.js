"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

const TAPS = 5;
const WINDOW_MS = 2000;

// The footer wordmark. Five quick taps open the admin panel.
// This only hides the door; /admin still needs an admin login, checked on the server.
export default function FooterMark() {
  const router = useRouter();
  const taps = useRef([]);

  function tap() {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < WINDOW_MS), now];
    if (taps.current.length >= TAPS) {
      taps.current = [];
      router.push("/admin");
    }
  }

  return (
    <p onClick={tap} className="select-none font-display text-3xl font-bold uppercase tracking-tight">
      Aether
    </p>
  );
}
