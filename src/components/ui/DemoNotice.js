import { Info } from "lucide-react";

export default function DemoNotice({ className = "" }) {
  return (
    <div role="note" className={`flex gap-3 border border-line p-4 text-sm leading-relaxed text-mute ${className}`}>
      <Info size={18} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-bone" />
      <p>
        <span className="text-bone">Demo store. No real money is charged.</span> Use Razorpay test card{" "}
        <span className="whitespace-nowrap font-mono text-bone">4111 1111 1111 1111</span>, any future date, any CVV.
      </p>
    </div>
  );
}
