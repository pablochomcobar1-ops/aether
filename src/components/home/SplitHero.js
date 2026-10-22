"use client";

import { useRef } from "react";
import ShoeStage from "@/components/three/ShoeStage";
import Button from "@/components/ui/Button";
import MagneticButton from "@/components/ui/MagneticButton";
import { SIDE_INFO } from "@/lib/collections";

function Half({ side, trigger }) {
  const info = SIDE_INFO[side];
  const sport = side === "sport";

  return (
    <div className="relative flex flex-col justify-end overflow-hidden px-4 pb-10 pt-24 transition-opacity duration-500 ease-out md:px-8 md:pb-16 md:group-hover/hero:opacity-40 md:hover:!opacity-100">
      <ShoeStage
        model={info.model}
        mood={side}
        trigger={trigger}
        priority
        className="absolute inset-x-0 top-[10%] bottom-[34%] md:top-[14%]"
      />
      <div className="relative">
        <h2
          className={`font-display text-5xl uppercase leading-[0.92] tracking-tight text-balance md:text-7xl ${
            sport ? "font-bold" : "font-extralight"
          }`}
        >
          {info.title}
        </h2>
        <p className="mt-4 max-w-sm text-mute">{info.blurb}</p>
        <MagneticButton className="mt-8">
          <Button href={`/${side}`} variant={sport ? "solid" : "outline"} size="lg">
            Shop {sport ? "Sport" : "Atelier"}
          </Button>
        </MagneticButton>
      </div>
    </div>
  );
}

export default function SplitHero() {
  const section = useRef(null);

  return (
    <section
      ref={section}
      className="group/hero grid min-h-[200dvh] md:min-h-dvh md:grid-cols-2 md:divide-x md:divide-line"
    >
      <h1 className="sr-only">AETHER: Sport and Atelier footwear</h1>
      <Half side="sport" trigger={section} />
      <Half side="atelier" trigger={section} />
    </section>
  );
}
