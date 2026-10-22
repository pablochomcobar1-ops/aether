"use client";

import { useRef } from "react";
import ShoeStage from "@/components/three/ShoeStage";
import Button from "@/components/ui/Button";
import { SIDE_INFO, collectionsFor } from "@/lib/collections";

export default function SideLanding({ side }) {
  const section = useRef(null);
  const info = SIDE_INFO[side];
  const sport = side === "sport";
  const weight = sport ? "font-bold" : "font-extralight";

  return (
    <section ref={section} className="grid md:grid-cols-2">
      <div className="h-[55dvh] md:sticky md:top-0 md:h-dvh">
        <ShoeStage model={info.model} mood={side} trigger={section} distance={3.6} priority className="relative h-full" />
      </div>

      <div className="px-4 md:px-12">
        <div className="flex min-h-[60dvh] flex-col justify-center pb-16 pt-8 md:min-h-dvh md:pt-24">
          <h1 className={`font-display text-6xl uppercase leading-[0.9] tracking-tight text-balance md:text-8xl ${weight}`}>
            {info.title}
          </h1>
          <p className="mt-6 max-w-md text-lg text-mute">{info.blurb}</p>
        </div>

        {collectionsFor(side).map((c) => (
          <article
            key={c.line}
            className="flex min-h-[70dvh] flex-col justify-center border-t border-line py-16 md:min-h-[90dvh]"
          >
            <h2 className={`font-display text-5xl uppercase tracking-tight md:text-7xl ${weight}`}>{c.label}</h2>
            <p className="mt-4 max-w-md text-mute">{c.blurb}</p>
            <div className="mt-8">
              <Button href={`/shop?side=${side}&line=${c.line}`} variant={sport ? "solid" : "outline"}>
                Shop {c.label}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
