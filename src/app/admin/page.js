import Link from "next/link";
import { getDashboard } from "@/lib/admin";
import { formatINR } from "@/lib/money";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, note }) {
  return (
    <div className="border border-line p-6">
      <p className="font-display text-xs uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums md:text-5xl">{value}</p>
      {note && <p className="mt-2 text-sm text-mute">{note}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const d = await getDashboard();

  return (
    <>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-6xl">Dashboard</h1>

      {d.refunds.length > 0 && (
        <section aria-labelledby="refunds" className="mt-10 border border-danger p-6">
          <h2 id="refunds" className="font-display text-xl uppercase tracking-wide text-[#f87171]">
            Refund needed ({d.refunds.length})
          </h2>
          <p className="mt-2 text-sm text-mute">
            These customers paid for a size that sold out at the same moment. Refund them from the Razorpay dashboard,
            then cancel the order.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {d.refunds.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span className="font-mono">{r.orderNumber}</span>
                <span className="text-mute">{r.email}</span>
                <span className="tabular-nums">{formatINR(r.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Paid orders today" value={d.paidToday} />
        <Stat label="Revenue this month" value={formatINR(d.revenueThisMonth)} note="Test mode. No real money." />
        <Stat label="Orders this month" value={d.ordersThisMonth} />
      </div>

      <section aria-labelledby="low-stock" className="mt-12">
        <h2 id="low-stock" className="font-display text-2xl uppercase tracking-wide">
          Low stock
        </h2>
        <p className="mt-1 text-sm text-mute">Live shoes with 2 or fewer pairs left in a size.</p>
        {d.lowStock.length === 0 ? (
          <p className="mt-6 border border-line p-6 text-mute">Every size has more than 2 pairs.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {d.lowStock.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-carbon md:px-4"
                >
                  <span>
                    <span className="font-display uppercase tracking-wide">{p.name}</span>
                    {p.colorway && <span className="text-sm text-mute"> · {p.colorway}</span>}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {p.sizes.map((s) => (
                      <span
                        key={s.uk}
                        className={`border px-2 py-1 font-mono text-xs ${s.stock === 0 ? "border-danger text-[#f87171]" : "border-warning text-warning"}`}
                      >
                        UK {s.uk}: {s.stock}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
