"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStore, variants } from "@/store/useStore";
import { SECTION_COUNT } from "@/lib/keyframes";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  ["6", "Interlocking shell panels"],
  ["3", "Orbit halos"],
  ["16M", "Colour states"],
];

function Section({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  const cls =
    align === "left"
      ? "items-start text-left md:pr-[50%]"
      : align === "right"
        ? "items-start text-left md:pl-[50%]"
        : "items-center text-center";
  return (
    <section className={`pointer-events-none flex min-h-screen flex-col justify-center px-6 md:px-16 ${cls}`}>
      {children}
    </section>
  );
}

export default function Overlay() {
  const root = useRef<HTMLDivElement>(null);
  const ready = useStore((s) => s.ready);
  const variant = useStore((s) => s.variant);
  const setVariant = useStore((s) => s.setVariant);

  // scroll reveals
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 10%", toggleActions: "play reverse play reverse" },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // hero intro once the scene is ready
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-char]", {
        yPercent: 120,
        opacity: 0,
        rotate: 6,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.07,
        delay: 0.5,
      });
      gsap.from("[data-hero-fade]", { opacity: 0, y: 20, duration: 1, delay: 1.1, stagger: 0.15, ease: "power2.out" });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  // keep UI accent colour in sync with the selected variant
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", variants[variant].accent);
  }, [variant]);

  const goTo = (i: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (i / (SECTION_COUNT - 1)) * max, behavior: "smooth" });
  };

  return (
    <div ref={root} className="relative z-10 text-white">
      {/* top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-16">
        <span className="text-sm font-semibold tracking-[0.4em]">AURA</span>
        <button
          data-cursor
          onClick={() => goTo(SECTION_COUNT - 1)}
          className="pointer-events-auto rounded-full border border-white/25 px-4 py-1.5 text-xs uppercase tracking-widest backdrop-blur transition hover:bg-white hover:text-black"
        >
          Pre-order
        </button>
      </header>

      {/* section dots */}
      <nav className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex md:right-8">
        {Array.from({ length: SECTION_COUNT }, (_, i) => (
          <button
            key={i}
            data-cursor
            aria-label={`Go to section ${i + 1}`}
            onClick={() => goTo(i)}
            className="h-2 w-2 rounded-full bg-white/30 transition hover:scale-150 hover:bg-white"
          />
        ))}
      </nav>

      {/* 1. hero */}
      <Section align="center">
        <h1 className="mt-[-30vh] overflow-hidden text-[clamp(4rem,16vw,14rem)] font-black leading-none tracking-tight">
          {"AURA".split("").map((c, i) => (
            <span key={i} data-hero-char className="inline-block">
              {c}
            </span>
          ))}
          <span data-hero-char className="inline-block pl-[0.1em] font-thin" style={{ color: "var(--accent)" }}>
            ONE
          </span>
        </h1>
        <p data-hero-fade className="mt-6 max-w-md text-sm text-white/60 md:text-base">
          A light-sculpture you can open, spin and tune. Move your cursor. Click the orb.
        </p>
        <div data-hero-fade className="absolute bottom-10 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/50">
          Scroll
          <span className="h-10 w-px animate-pulse bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </Section>

      {/* 2. design */}
      <Section align="left">
        <p data-reveal className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--accent)" }}>
          01 / Design
        </p>
        <h2 data-reveal className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
          Sculpted in segments.
        </h2>
        <p data-reveal className="mt-5 max-w-md text-white/65">
          Six precision-cut panels wrap a single glowing heart. Watch them drift apart as you scroll and settle
          back together with a magnetic click.
        </p>
        <div data-reveal className="mt-8 flex gap-8">
          {stats.map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl font-bold">{n}</div>
              <div className="mt-1 max-w-[7rem] text-[11px] uppercase tracking-wider text-white/50">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. core */}
      <Section align="right">
        <p data-reveal className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--accent)" }}>
          02 / Core
        </p>
        <h2 data-reveal className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
          A living core.
        </h2>
        <p data-reveal className="mt-5 max-w-md text-white/65">
          The light engine breathes, ripples and reacts. Hover the orb and it flares; tap the hotspots to explore
          every layer.
        </p>
      </Section>

      {/* 4. customise */}
      <Section align="left">
        <p data-reveal className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--accent)" }}>
          03 / Customise
        </p>
        <h2 data-reveal className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
          Make it yours.
        </h2>
        <p data-reveal className="mt-5 max-w-md text-white/65">
          Four finishes, tuned from metal to glass. Pick one and watch the whole scene follow.
        </p>
        <div data-reveal className="pointer-events-auto mt-8 flex flex-wrap gap-4">
          {variants.map((v, i) => (
            <button
              key={v.name}
              data-cursor
              onClick={() => setVariant(i)}
              className={`group flex items-center gap-3 rounded-full border px-4 py-2 text-sm backdrop-blur transition ${
                variant === i ? "border-white bg-white/15" : "border-white/20 hover:border-white/60"
              }`}
            >
              <span
                className="h-5 w-5 rounded-full ring-2 ring-white/30"
                style={{ background: `linear-gradient(135deg, ${v.color}, ${v.accent})` }}
              />
              {v.name}
            </button>
          ))}
        </div>
      </Section>

      {/* 5. CTA */}
      <Section align="center">
        <h2 data-reveal className="text-5xl font-black leading-none md:text-8xl">
          Own the <span style={{ color: "var(--accent)" }}>glow.</span>
        </h2>
        <p data-reveal className="mt-6 max-w-md text-white/65">
          Limited first run. Reserve yours today.
        </p>
        <a
          data-reveal
          data-cursor
          href="#"
          className="pointer-events-auto mt-10 rounded-full px-10 py-4 text-sm font-semibold uppercase tracking-widest text-black transition hover:scale-105"
          style={{ background: "var(--accent)" }}
        >
          Reserve now
        </a>
        <p className="absolute bottom-6 text-[10px] uppercase tracking-[0.3em] text-white/30">
          Built with Next.js and React Three Fiber
        </p>
      </Section>
    </div>
  );
}
