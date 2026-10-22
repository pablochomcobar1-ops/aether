"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

const links = [
  { href: "/sport", label: "Sport" },
  { href: "/atelier", label: "Atelier" },
  { href: "/shop", label: "Shop all" },
];

const icons = [
  { href: "/shop", label: "Search", Icon: Search },
  { href: "/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/orders", label: "Account", Icon: User },
  { href: "/cart", label: "Bag", Icon: ShoppingBag },
];

const iconClass = "grid size-11 place-items-center transition-opacity duration-200 hover:opacity-60";

export default function Navbar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setSolid(current > 80);
    setHidden(current > 160 && current > previous);
  });

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const show = !hidden || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[transform,background-color,border-color] duration-300 ease-out ${
        solid || menuOpen ? "border-line bg-ink" : "border-transparent bg-transparent"
      }`}
      style={{ transform: show ? "translateY(0)" : "translateY(-100%)" }}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link href="/" className="font-display text-2xl font-bold uppercase tracking-tight">
          Aether
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className="relative py-2 font-display text-sm uppercase tracking-[0.18em] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-bone after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 aria-[current=page]:after:scale-x-100"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center">
          {icons.map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={`${iconClass} ${label === "Bag" ? "" : "max-md:hidden"}`}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          ))}
          <button
            ref={menuButton}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className={`${iconClass} md:hidden`}
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto bg-ink px-4 pt-10 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <ul className="flex flex-col gap-2">
              {[...links, ...icons.slice(1, 3)].map(({ href, label }, index) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, transform: reduce ? "none" : "translateY(16px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  transition={{ duration: 0.4, delay: 0.05 * index, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 font-display text-5xl font-bold uppercase tracking-tight"
                    autoFocus={index === 0}
                  >
                    {label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
