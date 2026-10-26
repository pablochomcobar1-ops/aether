"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex items-center gap-1 overflow-x-auto border-b border-line">
      <span className="mr-4 font-mono text-xs uppercase tracking-[0.2em] text-mute">Admin</span>
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex min-h-11 items-center border-b-2 px-4 font-display text-sm uppercase tracking-[0.14em] transition-colors ${
              active ? "border-bone text-bone" : "border-transparent text-mute hover:text-bone"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
