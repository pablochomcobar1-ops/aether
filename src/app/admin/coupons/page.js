import { listCoupons } from "@/lib/admin";
import { formatINR } from "@/lib/money";
import { formatOrderDate } from "@/lib/orderView";
import Button from "@/components/ui/Button";
import ActiveToggle from "@/components/admin/ActiveToggle";
import CouponForm from "@/components/admin/CouponForm";
import { toggleCoupon } from "./actions";

export const metadata = { title: "Coupons" };

function status(c, now) {
  if (c.expiresAt && new Date(c.expiresAt) <= now) return "Expired";
  if (c.maxUses != null && c.uses >= c.maxUses) return "Used up";
  return null;
}

export default async function AdminCoupons({ searchParams }) {
  const { edit } = await searchParams;
  const coupons = await listCoupons();
  const editing = coupons.find((c) => String(c._id) === edit);
  const now = new Date();

  return (
    <>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-6xl">Coupons</h1>

      <section aria-labelledby="coupon-form" className="mt-10 max-w-3xl border border-line p-6">
        <h2 id="coupon-form" className="mb-6 font-display text-xl uppercase tracking-wide">
          {editing ? `Edit ${editing.code}` : "New coupon"}
        </h2>
        <CouponForm
          key={editing ? String(editing._id) : "new"}
          coupon={editing ? { ...editing, _id: String(editing._id), createdAt: undefined, updatedAt: undefined } : null}
        />
      </section>

      <ul className="mt-12 divide-y divide-line border-y border-line">
        {coupons.map((c) => {
          const id = String(c._id);
          const flag = status(c, now);
          return (
            <li key={id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-4 md:grid-cols-[150px_150px_1fr_110px_150px_auto] md:px-2">
              <p className="font-mono">{c.code}</p>
              <div className="md:order-none">
                <ActiveToggle id={id} active={c.active} label={`Coupon ${c.code} active`} action={toggleCoupon} on="Active" off="Off" />
              </div>
              <p className="text-sm">
                {c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                <span className="text-mute">{c.minSubtotal ? ` orders over ${formatINR(c.minSubtotal)}` : " any order"}</span>
              </p>
              <p className="text-sm text-mute tabular-nums">
                {c.uses} {c.maxUses ? `of ${c.maxUses}` : ""} used
              </p>
              <p className="text-sm text-mute">
                {flag ? (
                  <span className="text-warning">{flag}</span>
                ) : c.expiresAt ? (
                  `Until ${formatOrderDate(new Date(new Date(c.expiresAt).getTime() - 1))}`
                ) : (
                  "No end date"
                )}
              </p>
              <Button href={`/admin/coupons?edit=${id}`} variant="link" className="justify-self-end">
                Edit
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
