"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import CameraRig from "./CameraRig";
import Product from "./Product";
import Particles from "./Particles";
import Effects from "./Effects";
import { scrollState, useStore } from "@/store/useStore";

function ReadySignal() {
  const setReady = useStore((s) => s.setReady);
  let frames = 0;
  useFrame(() => {
    if (frames < 3 && ++frames === 3) setReady(true);
  });
  return null;
}

function ScrollTracker() {
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      scrollState.progress = max > 0 ? y / max : 0;
      scrollState.velocity += (y - last) / Math.max(window.innerHeight, 1);
      last = y;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useFrame((_, dt) => {
    // decay velocity so effects relax when scrolling stops
    scrollState.velocity *= Math.exp(-dt * 6);
  });
  return null;
}

export default function Scene() {
  const lowPerf = useStore((s) => s.lowPerf);
  const setLowPerf = useStore((s) => s.setLowPerf);
  const [dpr, setDpr] = useState(1.5);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={dpr}
        camera={{ fov: 38, position: [0, 0, 8], near: 0.1, far: 80 }}
        gl={{ antialias: !lowPerf, powerPreference: "high-performance", alpha: true }}
        style={{ touchAction: "pan-y" }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setLowPerf(true);
          }}
          onIncline={() => setDpr(1.5)}
        />
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={4} position={[0, 5, -5]} scale={[12, 3, 1]} />
            <Lightformer form="rect" intensity={2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
            <Lightformer form="rect" intensity={2.5} position={[6, 0, 3]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
            <Lightformer form="ring" intensity={3} color="#ffffff" position={[0, 0, 6]} scale={5} />
          </Environment>
          <Product reduced={reduced} />
        </Suspense>
        <Particles reduced={reduced} />
        <CameraRig reduced={reduced} />
        <ScrollTracker />
        <ReadySignal />
        <Effects reduced={reduced} />
      </Canvas>
    </div>
  );
}
