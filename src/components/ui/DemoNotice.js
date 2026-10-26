import { Info } from "lucide-react";

export default function DemoNotice({ className = "" }) {
  return (
    <div role="note" className={`flex gap-3 border border-line p-4 text-sm leading-relaxed text-mute ${className}`}>
      <Info size={18} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-bone" />
      <p>
        <span className="text-bone">Demo store. No real money is charged.</span> Pay by UPI with{" "}
        <span className="whitespace-nowrap font-mono text-bone">success@razorpay</span>, or use test card{" "}
        <span className="whitespace-nowrap font-mono text-bone">4100 2800 0000 1007</span> with any future date and any CVV.
      </p>
    </div>
  );
}
