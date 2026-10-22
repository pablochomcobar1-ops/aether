"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import ShoeStage from "@/components/three/ShoeStage";
import Button from "@/components/ui/Button";
import MagneticButton from "@/components/ui/MagneticButton";
import { CHAPTERS } from "@/lib/collections";

const ease = [0.23, 1, 0.32, 1];

function Chapter({ chapter, index }) {
  const section = useRef(null);
  const reduce = useReducedMotion();
  const sport = chapter.mood === "sport";
  const flip = index % 2 === 1;
  const rise = (delay) => ({
    initial: { opacity: 0, transform: reduce ? "none" : "translateY(32px)" },
    whileInView: { opacity: 1, transform: "translateY(0px)" },
    viewport: { once: false, amount: 0.6 },
    transition: { duration: 0.8, delay, ease },
  });

  return (
    <section ref={section} aria-labelledby={`chapter-${chapter.id}`} className="relative h-[220dvh]">
      <div className="sticky top-0 grid h-dvh overflow-hidden md:grid-cols-2">
        <ShoeStage
          model={chapter.model}
          mood={chapter.mood}
          trigger={section}
          priority={index === 0}
          className={`relative h-[55dvh] md:h-full ${flip ? "md:order-2" : ""}`}
        />

        <div className="relative flex flex-col justify-center px-4 pb-10 md:px-12 md:pb-0">
          <motion.h2
            {...rise(0)}
            id={`chapter-${chapter.id}`}
            className={`font-display text-5xl uppercase leading-[0.9] tracking-tight text-balance md:text-8xl ${
              sport ? "font-bold" : "font-extralight"
            }`}
          >
            {chapter.title}
          </motion.h2>
          <motion.p {...rise(0.1)} className="mt-6 max-w-md text-mute md:text-lg">
            {chapter.blurb}
          </motion.p>
          <motion.div {...rise(0.2)} className="mt-8">
            <MagneticButton>
              <Button href={chapter.href} variant={sport ? "solid" : "outline"} size="lg">
                {chapter.cta}
              </Button>
            </MagneticButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Chapters() {
  return (
    <>
      <h1 className="sr-only">AETHER: Sport, Street and Atelier footwear</h1>
      {CHAPTERS.map((chapter, index) => (
        <Chapter key={chapter.id} chapter={chapter} index={index} />
      ))}
    </>
  );
}
