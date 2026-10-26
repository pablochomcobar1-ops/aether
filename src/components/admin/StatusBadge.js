import { STATUS_LABELS } from "@/lib/orderView";

const TONE = {
  pending: "border-line text-mute",
  paid: "border-bone text-bone",
  packed: "border-bone text-bone",
  shipped: "border-bone text-bone",
  delivered: "border-success text-success",
  cancelled: "border-danger text-[#f87171]",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${TONE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
