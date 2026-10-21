"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { scrollState, useStore } from "@/store/useStore";

export default function Effects({ reduced }: { reduced: boolean }) {
  const lowPerf = useStore((s) => s.lowPerf);
  const offset = useMemo(() => new Vector2(0, 0), []);
  const ref = useRef<{ offset: Vector2 } | null>(null);

  useFrame(() => {
    // chromatic aberration kicks in with scroll speed
    const v = reduced ? 0 : Math.min(Math.abs(scrollState.velocity) * 0.004, 0.006);
    offset.set(v, v);
  });

  if (lowPerf) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.7} luminanceSmoothing={0.2} />
      <ChromaticAberration
        ref={ref as never}
        offset={offset}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
      <Vignette eskil={false} offset={0.2} darkness={0.8} />
    </EffectComposer>
  );
}
