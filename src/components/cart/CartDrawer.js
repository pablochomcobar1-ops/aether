"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useCart } from "@/store/cart";
import CartContents from "./CartContents";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function CartDrawer() {
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const panel = useRef(null);
  const returnTo = useRef(null);
  const hidden = pathname === "/cart" || pathname.startsWith("/checkout");

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => panel.current?.querySelector("button")?.focus());

    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      returnTo.current?.focus?.();
    };
  }, [open, setOpen]);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && !hidden && (
        <div className="fixed inset-0 z-[120]">
          <motion.div
            className="absolute inset-0 bg-ink/70"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            aria-hidden="true"
          />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            data-lenis-prevent
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-ink"
            initial={{ transform: reduce ? "translateX(0%)" : "translateX(100%)", opacity: reduce ? 0 : 1 }}
            animate={{ transform: "translateX(0%)", opacity: 1 }}
            exit={{ transform: reduce ? "translateX(0%)" : "translateX(100%)", opacity: reduce ? 0 : 1, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 md:h-20 md:px-6">
              <h2 id="cart-title" className="font-display text-xl uppercase tracking-[0.12em]">
                Your bag
              </h2>
              <button type="button" onClick={close} aria-label="Close bag" className="grid size-11 place-items-center hover:opacity-60">
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-6">
              <CartContents onNavigate={close} />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
