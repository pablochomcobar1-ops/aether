"use client";

import { useCallback, useEffect, useState } from "react";
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
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWebgl(supportsWebGL()));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!MODELS[model]) return null;
  const live = webgl && !reduce;

  return (
    <div className={className}>
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{ opacity: live && ready ? 0 : 1 }}
      >
        <StaticShoe model={model} priority={priority} />
      </div>
      {live && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <ShoeCanvas model={model} mood={mood} trigger={trigger} distance={distance} onReady={onReady} />
        </div>
      )}
    </div>
  );
}
