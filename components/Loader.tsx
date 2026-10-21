"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useStore } from "@/store/useStore";

export default function Loader() {
  const ready = useStore((s) => s.ready);
  const [count, setCount] = useState(0);
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);
  const curtain = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = { v: 0 };
    const tw = gsap.to(o, {
      v: 100,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: () => setCount(Math.round(o.v)),
      onComplete: () => setMinDone(true),
    });
    return () => {
      tw.kill();
    };
  }, []);

  useEffect(() => {
    if (!ready || !minDone || !curtain.current) return;
    const tw = gsap.to(curtain.current, {
      yPercent: -100,
      duration: 1,
      ease: "expo.inOut",
      onComplete: () => setGone(true),
    });
    return () => {
      tw.kill();
    };
  }, [ready, minDone]);

  if (gone) return null;
  return (
    <div ref={curtain} className="fixed inset-0 z-50 flex items-end justify-between bg-[#05060a] p-8 text-white md:p-16">
      <span className="text-sm tracking-[0.4em]">AURA</span>
      <span className="text-7xl font-black tabular-nums md:text-9xl">{count}</span>
    </div>
  );
}
