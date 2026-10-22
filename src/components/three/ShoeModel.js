"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { MathUtils } from "three";
import { MODELS } from "./models";

export default function ShoeModel({ model, mood, progress, pointer, onReady }) {
  const config = MODELS[model];
  const { scene } = useGLTF(config.url);
  const group = useRef(null);

  useEffect(() => onReady?.(), [onReady]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const [baseX, baseY] = config.rotation;
    const spin =
      mood === "sport" ? progress.current * Math.PI * 1.25 : state.clock.elapsedTime * 0.12;
    const tilt = mood === "sport" ? 0.3 : 0.15;

    g.rotation.y = MathUtils.damp(g.rotation.y, baseY + spin + pointer.current.x * tilt, 4, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, baseX - pointer.current.y * tilt * 0.4, 4, delta);
    g.position.y = Math.sin(state.clock.elapsedTime * (mood === "sport" ? 1.2 : 0.6)) * 0.03;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} scale={config.scale} />
      </Center>
    </group>
  );
}
