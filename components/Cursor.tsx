"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useStore } from "@/store/useStore";

export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const hovered = useStore((s) => s.hovered);
  const overUi = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = ring.current!;
    const d = dot.current!;
    gsap.set([r, d], { xPercent: -50, yPercent: -50 });
    const rx = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3" });
    const dx = gsap.quickTo(d, "x", { duration: 0.05 });
    const dy = gsap.quickTo(d, "y", { duration: 0.05 });

    const move = (e: PointerEvent) => {
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
      overUi.current = !!(e.target as HTMLElement).closest?.("a,button,[data-cursor]");
      r.dataset.ui = overUi.current ? "1" : "0";
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] hidden [@media(pointer:fine)]:block">
      <div
        ref={ring}
        className="absolute left-0 top-0 h-10 w-10 rounded-full border border-white/70 transition-[width,height,background-color,border-color] duration-300 data-[ui='1']:h-16 data-[ui='1']:w-16 data-[ui='1']:bg-white/10"
        style={hovered ? { width: 72, height: 72, backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent)", borderColor: "var(--accent)" } : undefined}
      />
      <div ref={dot} className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white" />
    </div>
  );
}
