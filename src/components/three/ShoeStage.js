"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import StaticShoe from "./StaticShoe";
import { MODELS } from "./models";

const ShoeCanvas = dynamic(() => import("./ShoeCanvas"), { ssr: false });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function ShoeStage({ model, mood, trigger, distance, priority = false, className = "relative" }) {
  const reduce = useReducedMotion();
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const box = useRef(null);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const nearby = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    const onScreen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    nearby.observe(el);
    onScreen.observe(el);
    return () => {
      nearby.disconnect();
      onScreen.disconnect();
    };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWebgl(supportsWebGL()));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!MODELS[model]) return null;
  const live = webgl && !reduce;

  return (
    <div ref={box} className={className}>
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{ opacity: live && ready ? 0 : 1 }}
      >
        <StaticShoe model={model} priority={priority} />
      </div>
      {live && near && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <ShoeCanvas model={model} mood={mood} trigger={trigger} distance={distance} active={visible} onReady={onReady} />
        </div>
      )}
    </div>
  );
}
