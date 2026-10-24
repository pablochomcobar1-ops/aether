"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";

// Native <select> styled like Field: keeps the phone's own picker and keyboard support.
export default function Select({ label, error, options, placeholder = "Choose…", className = "", ...props }) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-display text-xs uppercase tracking-[0.18em] text-mute">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`block h-12 w-full appearance-none border bg-ink px-4 pr-12 text-base text-bone outline-none transition-colors duration-200 focus:border-bone ${
            error ? "border-danger" : "border-line hover:border-mute"
          } ${props.value ? "" : "text-mute"}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="text-bone">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#f87171]">
          {error}
        </p>
      )}
    </div>
  );
}
