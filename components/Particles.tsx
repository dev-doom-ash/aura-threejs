/* eslint-disable react-hooks/purity, react-hooks/immutability */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore, variants } from "@/store/useStore";

const BURST_COUNT = 260;

function makeSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export default function Particles({ reduced }: { reduced: boolean }) {
  const count = reduced ? 600 : 1800;
  const sprite = useMemo(() => makeSprite(), []);
  useEffect(() => () => sprite.dispose(), [sprite]);

  const ambient = useMemo(() => {
    const base = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // distribute in a shell around the product
      const r = 3.5 + Math.random() * 10;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      base[i * 3] = r * Math.sin(ph) * Math.cos(th);
      base[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      base[i * 3 + 2] = r * Math.cos(ph);
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
    return { base, phase, offset: new Float32Array(count * 3), geo };
  }, [count]);

  const burst = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BURST_COUNT * 3), 3));
    return { geo, vel: new Float32Array(BURST_COUNT * 3), life: new Float32Array(BURST_COUNT) };
  }, []);

  useEffect(
    () => () => {
      ambient.geo.dispose();
      burst.geo.dispose();
    },
    [ambient, burst],
  );

  const ambientMat = useRef<THREE.PointsMaterial>(null);
  const burstMat = useRef<THREE.PointsMaterial>(null);
  const lastBurst = useRef(0);
  const ray = useRef(new THREE.Raycaster());
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const { variant, burst: b } = useStore.getState();
    const accent = new THREE.Color(variants[variant].accent);

    // pointer ray in world space (independent of the moving camera)
    ray.current.setFromCamera(state.pointer, state.camera);
    const o = ray.current.ray.origin;
    const d = ray.current.ray.direction;

    const pos = ambient.geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const { base, phase, offset } = ambient;
    const speed = reduced ? 0.15 : 0.4;
    const repel = reduced ? 0 : 1;
    const spring = Math.min(1, dt * 3);

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const p = phase[i];
      const x = base[ix] + Math.sin(t * speed + p) * 0.25 + offset[ix];
      const y = base[ix + 1] + Math.cos(t * speed * 0.8 + p) * 0.25 + offset[ix + 1];
      const z = base[ix + 2] + Math.sin(t * speed * 0.6 + p * 2) * 0.25 + offset[ix + 2];

      // distance from particle to the pointer ray
      const vx = x - o.x;
      const vy = y - o.y;
      const vz = z - o.z;
      const proj = vx * d.x + vy * d.y + vz * d.z;
      const cx = vx - d.x * proj;
      const cy = vy - d.y * proj;
      const cz = vz - d.z * proj;
      const dist2 = cx * cx + cy * cy + cz * cz;
      if (repel && proj > 0 && dist2 < 2.2) {
        const dist = Math.sqrt(dist2) + 0.001;
        const f = ((1.5 - dist) / 1.5) * 0.35;
        if (f > 0) {
          offset[ix] += (cx / dist) * f;
          offset[ix + 1] += (cy / dist) * f;
          offset[ix + 2] += (cz / dist) * f;
        }
      }
      // relax back to rest position
      offset[ix] -= offset[ix] * spring;
      offset[ix + 1] -= offset[ix + 1] * spring;
      offset[ix + 2] -= offset[ix + 2] * spring;

      arr[ix] = x;
      arr[ix + 1] = y;
      arr[ix + 2] = z;
    }
    pos.needsUpdate = true;
    if (ambientMat.current) ambientMat.current.color.lerp(accent, 0.05);
    if (burstMat.current) burstMat.current.color.lerp(accent, 0.2);

    // spawn burst on click
    const bp = burst.geo.attributes.position as THREE.BufferAttribute;
    const barr = bp.array as Float32Array;
    if (b.id !== lastBurst.current) {
      lastBurst.current = b.id;
      for (let i = 0; i < BURST_COUNT; i++) {
        tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const s = 1.5 + Math.random() * 3.5;
        burst.vel[i * 3] = tmp.x * s;
        burst.vel[i * 3 + 1] = tmp.y * s;
        burst.vel[i * 3 + 2] = tmp.z * s;
        barr[i * 3] = b.x;
        barr[i * 3 + 1] = b.y;
        barr[i * 3 + 2] = b.z;
        burst.life[i] = 0.6 + Math.random() * 0.9;
      }
    }
    let alive = 0;
    for (let i = 0; i < BURST_COUNT; i++) {
      if (burst.life[i] > 0) {
        burst.life[i] -= dt;
        const drag = Math.exp(-dt * 2.5);
        burst.vel[i * 3] *= drag;
        burst.vel[i * 3 + 1] *= drag;
        burst.vel[i * 3 + 2] *= drag;
        barr[i * 3] += burst.vel[i * 3] * dt;
        barr[i * 3 + 1] += burst.vel[i * 3 + 1] * dt;
        barr[i * 3 + 2] += burst.vel[i * 3 + 2] * dt;
        alive++;
      } else {
        barr[i * 3 + 1] = -999; // park dead particles off-screen
      }
    }
    bp.needsUpdate = true;
    if (burstMat.current) burstMat.current.opacity = alive > 0 ? 1 : 0;
  });

  return (
    <>
      <points geometry={ambient.geo} frustumCulled={false}>
        <pointsMaterial
          ref={ambientMat}
          map={sprite}
          size={0.09}
          sizeAttenuation
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#9b8cff"
        />
      </points>
      <points geometry={burst.geo} frustumCulled={false}>
        <pointsMaterial
          ref={burstMat}
          map={sprite}
          size={0.18}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#9b8cff"
          toneMapped={false}
        />
      </points>
    </>
  );
}
