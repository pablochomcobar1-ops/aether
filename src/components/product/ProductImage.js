"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductImage({ src, alt, name, sizes, priority = false, className = "" }) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div className={`absolute inset-0 grid place-items-center bg-carbon ${className}`} role="img" aria-label={alt}>
        <span className="px-6 text-center font-display text-2xl font-light uppercase tracking-wide text-line md:text-3xl">
          {name}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
