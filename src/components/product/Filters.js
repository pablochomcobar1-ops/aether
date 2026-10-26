"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { SIZES } from "@/lib/constants";
import { collectionsFor } from "@/lib/collections";

const PRICES = [
  { id: "", label: "Any price" },
  { id: "0-6000", label: "Under ₹6,000" },
  { id: "6000-12000", label: "₹6,000 to ₹12,000" },
  { id: "12000-", label: "Over ₹12,000" },
];

function Chip({ active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`min-h-11 border px-4 font-display text-sm uppercase tracking-[0.12em] transition-colors duration-150 ${
        active ? "border-bone bg-bone text-ink" : "border-line text-bone hover:border-mute"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="font-display text-xs uppercase tracking-[0.18em] text-mute">{title}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export default function Filters({ count }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const first = useRef(true);

  const side = params.get("side") ?? "";
  const line = params.get("line") ?? "";
  const size = params.get("size") ?? "";
  const price = [params.get("min") ?? "", params.get("max") ?? ""].join("-").replace(/^-$/, "");

  function apply(changes) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      const q = query.trim();
      if (q !== (new URLSearchParams(window.location.search).get("q") ?? "")) apply({ q });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = [side, line, size, price, params.get("q")].filter(Boolean).length;
  const lines = side ? collectionsFor(side) : [...collectionsFor("sport"), ...collectionsFor("atelier")];

  return (
    <div>
      <div className="flex items-center gap-3">
        <label htmlFor="shop-search" className="sr-only">
          Search shoes
        </label>
        <input
          id="shop-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or colour"
          className="h-12 w-full border border-line bg-transparent px-4 outline-none transition-colors placeholder:text-mute focus:border-bone focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="inline-flex h-12 shrink-0 items-center gap-2 border border-line px-4 font-display text-sm uppercase tracking-[0.12em] lg:hidden"
        >
          <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
          Filters{active ? ` (${active})` : ""}
        </button>
      </div>

      <div id="filter-panel" className={`mt-6 space-y-5 ${open ? "block" : "hidden"} lg:block`}>
        <Group title="Side">
          {[
            ["", "All"],
            ["sport", "Sport"],
            ["atelier", "Atelier"],
          ].map(([id, label]) => (
            <Chip key={label} active={side === id} onClick={() => apply({ side: id, line: "" })}>
              {label}
            </Chip>
          ))}
        </Group>
        <Group title="Collection">
          {lines.map((c) => (
            <Chip
              key={c.line}
              active={line === c.line}
              onClick={() => apply(line === c.line ? { line: "" } : { line: c.line, side: c.side })}
            >
              {c.label}
            </Chip>
          ))}
        </Group>
        <Group title="Size (UK), in stock">
          {SIZES.map((s) => (
            <Chip key={s} active={size === String(s)} onClick={() => apply({ size: size === String(s) ? "" : String(s) })}>
              {s}
            </Chip>
          ))}
        </Group>
        <Group title="Price">
          {PRICES.map((p) => (
            <Chip
              key={p.label}
              active={price === p.id}
              onClick={() => {
                const [min = "", max = ""] = p.id.split("-");
                apply({ min, max });
              }}
            >
              {p.label}
            </Chip>
          ))}
        </Group>
        <div className="flex items-center justify-between border-t border-line pt-5 text-sm text-mute">
          <span aria-live="polite">
            {count} {count === 1 ? "shoe" : "shoes"}
          </span>
          {active > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                startTransition(() => router.replace(pathname, { scroll: false }));
              }}
              className="inline-flex min-h-11 items-center gap-1 text-bone underline"
            >
              <X size={14} aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
