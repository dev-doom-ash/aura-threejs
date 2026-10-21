import { create } from "zustand";

export type Variant = {
  name: string;
  color: string;
  accent: string;
  metalness: number;
  roughness: number;
};

export const variants: Variant[] = [
  { name: "Nebula", color: "#5b4bd6", accent: "#9b8cff", metalness: 0.85, roughness: 0.22 },
  { name: "Solar", color: "#e8512a", accent: "#ffb347", metalness: 0.75, roughness: 0.28 },
  { name: "Glacier", color: "#d6ecff", accent: "#4de1ff", metalness: 0.5, roughness: 0.12 },
  { name: "Onyx", color: "#16171d", accent: "#ff3d81", metalness: 1, roughness: 0.3 },
];

/** Mutable scroll values, read every frame without triggering React renders. */
export const scrollState = { progress: 0, velocity: 0 };

type Burst = { id: number; x: number; y: number; z: number };

type State = {
  ready: boolean;
  variant: number;
  hovered: boolean;
  hotspots: boolean;
  lowPerf: boolean;
  burst: Burst;
  setReady: (v: boolean) => void;
  setVariant: (i: number) => void;
  setHovered: (v: boolean) => void;
  setHotspots: (v: boolean) => void;
  setLowPerf: (v: boolean) => void;
  fireBurst: (x: number, y: number, z: number) => void;
};

export const useStore = create<State>((set) => ({
  ready: false,
  variant: 0,
  hovered: false,
  hotspots: false,
  lowPerf: false,
  burst: { id: 0, x: 0, y: 0, z: 0 },
  setReady: (ready) => set({ ready }),
  setVariant: (variant) => set({ variant }),
  setHovered: (hovered) => set({ hovered }),
  setHotspots: (hotspots) => set({ hotspots }),
  setLowPerf: (lowPerf) => set({ lowPerf }),
  fireBurst: (x, y, z) => set((s) => ({ burst: { id: s.burst.id + 1, x, y, z } })),
}));
