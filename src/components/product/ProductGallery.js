"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";

const VIEWS = ["Front three-quarter view", "Side view", "Back view", "Top view"];

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const shots = images.length ? images : [null];

  return (
    <div>
      <div className="flex snap-x snap-mandatory overflow-x-auto md:hidden" aria-label={`${name} photos`}>
        {shots.map((src, i) => (
          <div key={i} className="relative aspect-square w-full shrink-0 snap-center bg-carbon">
            <ProductImage src={src} alt={`${name}, ${VIEWS[i] ?? "photo"}`} name={name} sizes="100vw" priority={i === 0} />
          </div>
        ))}
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-[5rem_1fr]">
        <ul className="space-y-3">
          {shots.map((src, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${VIEWS[i] ?? "photo"}`}
                aria-current={active === i}
                className={`relative block aspect-square w-full overflow-hidden border transition-colors ${
                  active === i ? "border-bone" : "border-line hover:border-mute"
                }`}
              >
                <ProductImage src={src} alt="" name="" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
        <div className="group relative aspect-square overflow-hidden bg-carbon">
          <ProductImage
            src={shots[active]}
            alt={`${name}, ${VIEWS[active] ?? "photo"}`}
            name={name}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
      </div>
    </div>
  );
}
