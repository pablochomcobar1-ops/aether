"use client";

import { useState } from "react";
import { SIZES } from "@/lib/constants";
import { setStock } from "@/app/admin/products/actions";

const NOTE = { saving: "Saving…", saved: "Saved" };

export default function StockGrid({ productId, sizes }) {
  const initial = Object.fromEntries(SIZES.map((uk) => [uk, sizes.find((s) => s.uk === uk)?.stock ?? 0]));
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(() => Object.fromEntries(SIZES.map((uk) => [uk, String(initial[uk])])));
  const [status, setStatus] = useState({});

  async function commit(uk) {
    const raw = draft[uk].trim();
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < 0 || value > 999) {
      setStatus((s) => ({ ...s, [uk]: { tone: "error", text: "0 to 999" } }));
      return;
    }
    if (value === saved[uk]) {
      setDraft((d) => ({ ...d, [uk]: String(value) }));
      return;
    }
    setStatus((s) => ({ ...s, [uk]: { tone: "mute", text: NOTE.saving } }));
    try {
      const result = await setStock(productId, uk, value);
      if (!result.ok) throw new Error(result.error);
      setSaved((s) => ({ ...s, [uk]: value }));
      setStatus((s) => ({ ...s, [uk]: { tone: "ok", text: NOTE.saved } }));
    } catch (error) {
      setStatus((s) => ({ ...s, [uk]: { tone: "error", text: error.message || "Not saved" } }));
    }
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {SIZES.map((uk) => {
          const value = saved[uk];
          const tone = value === 0 ? "border-danger" : value <= 2 ? "border-warning" : "border-line";
          const note = status[uk];
          return (
            <div key={uk}>
              <label htmlFor={`stock-${uk}`} className="block text-center font-display text-xs uppercase tracking-[0.18em] text-mute">
                UK {uk}
              </label>
              <input
                id={`stock-${uk}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                step={1}
                value={draft[uk]}
                onChange={(e) => setDraft((d) => ({ ...d, [uk]: e.target.value }))}
                onBlur={() => commit(uk)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                aria-describedby={`stock-${uk}-note`}
                aria-invalid={note?.tone === "error" ? true : undefined}
                className={`mt-2 block h-12 w-full border bg-transparent text-center text-lg tabular-nums text-bone outline-none transition-colors focus:border-bone ${tone}`}
              />
              <p
                id={`stock-${uk}-note`}
                aria-live="polite"
                className={`mt-1 h-4 text-center text-xs ${
                  note?.tone === "error" ? "text-[#f87171]" : note?.tone === "ok" ? "text-success" : "text-mute"
                }`}
              >
                {note?.text ?? ""}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-mute">Changes save when you leave a box or press Enter. Red is sold out, amber is 2 or fewer.</p>
    </div>
  );
}
