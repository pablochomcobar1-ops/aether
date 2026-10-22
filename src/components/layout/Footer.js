import Link from "next/link";
import { MODELS } from "@/components/three/models";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/sport", label: "Sport" },
      { href: "/atelier", label: "Atelier" },
      { href: "/shop", label: "All shoes" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/size-guide", label: "Size guide" },
      { href: "/orders/track", label: "Track an order" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-16 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-8">
        <div className="max-w-sm">
          <p className="font-display text-3xl font-bold uppercase tracking-tight">Aether</p>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            Built for the track and the boardroom. This is a demo store: payments run in test mode and no orders
            are shipped.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="font-display text-sm uppercase tracking-[0.18em] text-mute">{column.title}</h2>
            <ul className="mt-4 space-y-1">
              {column.links.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-11 items-center hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 border-t border-line px-4 py-6 text-xs text-mute md:flex-row md:justify-between md:px-8">
        <p>© {new Date().getFullYear()} AETHER. Designed and built by Jainam Gondaliya.</p>
        <p>
          3D models:{" "}
          {Object.values(MODELS).map(({ credit }, i) => (
            <span key={credit.title}>
              {i > 0 && " · "}
              <a href={credit.url} className="underline hover:text-bone" target="_blank" rel="noreferrer">
                {credit.title}
              </a>{" "}
              by {credit.author} ({credit.license})
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
