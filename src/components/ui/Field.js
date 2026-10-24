"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Field({ label, error, hint, type = "text", className = "", ...props }) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-display text-xs uppercase tracking-[0.18em] text-mute">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block h-12 w-full border bg-transparent px-4 text-base text-bone outline-none transition-colors duration-200 placeholder:text-mute/60 focus:border-bone focus-visible:outline-none ${
            error ? "border-danger" : "border-line hover:border-mute"
          } ${isPassword ? "pr-12" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            aria-pressed={reveal}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-mute transition-colors hover:text-bone"
          >
            {reveal ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#f87171]">
          {error}
        </p>
      )}
    </div>
  );
}
