"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { MathUtils } from "three";
import { MODELS } from "./models";
import { createAetherSneakerModel } from "./vapor/createAetherSneakerModel";

const FACTORIES = {
  vapor: () => createAetherSneakerModel().root,
};

function GltfShoe({ config }) {
  const { scene } = useGLTF(config.url);
  return <primitive object={scene} scale={config.scale} />;
}

function FactoryShoe({ config }) {
  const root = useMemo(() => FACTORIES[config.factory](), [config]);
  useEffect(
    () => () =>
      root.traverse((o) => {
        o.geometry?.dispose();
        o.material?.map?.dispose();
        o.material?.dispose?.();
      }),
    [root]
  );
  return <primitive object={root} scale={config.scale} />;
}

export default function ShoeModel({ model, mood, progress, pointer, onReady }) {
  const config = MODELS[model];
  const group = useRef(null);

  useEffect(() => onReady?.(), [onReady]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const [baseX, baseY] = config.rotation;
    const sport = mood === "sport";
    const spin = progress.current * Math.PI * (sport ? 1.5 : 0.9) + state.clock.elapsedTime * (sport ? 0 : 0.05);
    const tilt = sport ? 0.3 : 0.15;

    g.rotation.y = MathUtils.damp(g.rotation.y, baseY + spin + pointer.current.x * tilt, sport ? 5 : 3, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, baseX - pointer.current.y * tilt * 0.4, 4, delta);
    g.position.y = Math.sin(state.clock.elapsedTime * (sport ? 1.2 : 0.6)) * 0.03;
  });

  return (
    <group ref={group}>
      <Center>{config.factory ? <FactoryShoe config={config} /> : <GltfShoe config={config} />}</Center>
    </group>
  );
}
