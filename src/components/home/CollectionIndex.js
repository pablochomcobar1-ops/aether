import Link from "next/link";
import { collectionsFor } from "@/lib/collections";

export default function CollectionIndex() {
  return (
    <section className="border-t border-line px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-screen-2xl gap-16 md:grid-cols-2 md:gap-12">
        {["sport", "atelier"].map((side) => (
          <div key={side}>
            <h2 className="font-display text-sm uppercase tracking-[0.18em] text-mute">
              {side === "sport" ? "Sport" : "Atelier"}
            </h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {collectionsFor(side).map((c) => (
                <li key={c.line}>
                  <Link
                    href={`/shop?side=${side}&line=${c.line}`}
                    className="group flex items-end justify-between gap-6 py-6"
                  >
                    <span
                      className={`font-display text-4xl uppercase tracking-tight transition-transform duration-300 ease-out group-hover:translate-x-2 md:text-6xl ${
                        side === "sport" ? "font-bold" : "font-extralight"
                      }`}
                    >
                      {c.label}
                    </span>
                    <span className="max-w-56 pb-1 text-right text-sm text-mute">{c.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
