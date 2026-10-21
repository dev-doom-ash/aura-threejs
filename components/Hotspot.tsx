"use client";

import { useState } from "react";

export default function Hotspot({ visible, title, text }: { visible: boolean; title: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: `scale(${visible ? 1 : 0.4})` }}
    >
      <button
        data-cursor
        aria-label={title}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="relative grid h-6 w-6 place-items-center rounded-full border border-white/70 bg-white/10 backdrop-blur"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </button>
      <div
        className="pointer-events-none absolute left-8 top-1/2 w-52 -translate-y-1/2 rounded-xl border border-white/15 bg-black/60 p-3 text-left backdrop-blur-md transition-all duration-300"
        style={{ opacity: open ? 1 : 0, transform: `translate(${open ? 0 : -8}px,-50%)` }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white">{title}</p>
        <p className="mt-1 text-xs leading-snug text-white/70">{text}</p>
      </div>
    </div>
  );
}
