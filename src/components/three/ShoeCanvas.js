"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShoeModel from "./ShoeModel";

gsap.registerPlugin(ScrollTrigger);

function CameraFit({ distance }) {
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const { camera } = get();
    camera.position.z = distance * Math.max(1, 1.2 / (size.width / size.height));
    camera.updateProjectionMatrix();
  }, [get, size, distance]);

  return null;
}

function Lights({ mood }) {
  if (mood === "sport") {
    return (
      <Environment resolution={256}>
        <Lightformer intensity={4} position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={3} position={[0, 2, -4]} scale={[12, 2, 1]} />
        <Lightformer intensity={3} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[10, 1, 1]} />
        <Lightformer intensity={2} position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[10, 0.5, 1]} />
      </Environment>
    );
  }
  return (
    <Environment resolution={256}>
      <Lightformer intensity={1.6} color="#ffe6cc" position={[2, 3, 3]} scale={[6, 6, 1]} form="circle" />
      <Lightformer intensity={0.6} position={[-4, 1, -2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
    </Environment>
  );
}

export default function ShoeCanvas({ model, mood, trigger, onReady, active = true, distance = 3.2 }) {
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", onMove);

    const scroll = trigger?.current
      ? ScrollTrigger.create({
          trigger: trigger.current,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => (progress.current = self.progress),
        })
      : null;

    return () => {
      window.removeEventListener("pointermove", onMove);
      scroll?.kill();
    };
  }, [trigger]);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.35, 3.2], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <CameraFit distance={distance} />
      <Suspense fallback={null}>
        <ShoeModel model={model} mood={mood} progress={progress} pointer={pointer} onReady={onReady} />
        <ContactShadows position={[0, -0.55, 0]} opacity={0.6} scale={4} blur={2.4} far={1.2} />
        <Lights mood={mood} />
      </Suspense>
    </Canvas>
  );
}
