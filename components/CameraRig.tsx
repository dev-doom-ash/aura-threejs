"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { sample, type Key } from "@/lib/keyframes";
import { scrollState } from "@/store/useStore";

export default function CameraRig({ reduced }: { reduced: boolean }) {
  const target = useRef<Key>({ x: 0, az: 0, el: 0, dist: 8, explode: 0, spin: 0 });
  const cur = useRef({ az: 0, el: 0.1, dist: 8, px: 0, py: 0 });

  useFrame((state, dt) => {
    const t = sample(scrollState.progress, target.current);
    const c = cur.current;
    const smooth = reduced ? 0.05 : 0.45;
    easing.damp(c, "az", t.az, smooth, dt);
    easing.damp(c, "el", t.el, smooth, dt);
    // narrow screens need the camera further back to fit the product
    const aspectBoost = state.size.width / state.size.height < 1 ? 1.7 : 1;
    easing.damp(c, "dist", t.dist * aspectBoost, smooth, dt);
    easing.damp(c, "px", reduced ? 0 : state.pointer.x * 0.35, 0.6, dt);
    easing.damp(c, "py", reduced ? 0 : state.pointer.y * 0.2, 0.6, dt);

    const az = c.az + c.px;
    const el = c.el + c.py;
    state.camera.position.set(
      Math.sin(az) * Math.cos(el) * c.dist,
      Math.sin(el) * c.dist,
      Math.cos(az) * Math.cos(el) * c.dist,
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}
