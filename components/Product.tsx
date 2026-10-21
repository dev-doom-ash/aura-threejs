/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Float, Html, MeshDistortMaterial } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { sample, type Key } from "@/lib/keyframes";
import { scrollState, useStore, variants } from "@/store/useStore";
import Hotspot from "./Hotspot";

const BANDS = 6;
const SHELL_R = 1.45;
const TAU = Math.PI * 2;

const rippleVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const rippleFragment = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float wave = sin(d * 38.0 - uTime * 2.2) * 0.5 + 0.5;
    wave = pow(wave, 6.0);
    float fade = (1.0 - smoothstep(0.15, 1.0, d)) * smoothstep(0.08, 0.25, d);
    gl_FragColor = vec4(uColor, wave * fade * uStrength);
  }
`;

export default function Product({ reduced }: { reduced: boolean }) {
  const outer = useRef<THREE.Group>(null);
  const spinGroup = useRef<THREE.Group>(null);
  const bands = useRef<(THREE.Mesh | null)[]>([]);
  const capTop = useRef<THREE.Mesh>(null);
  const capBottom = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<ComponentRef<typeof MeshDistortMaterial>>(null);
  const shellMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#5b4bd6",
        metalness: 0.85,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        envMapIntensity: 1.4,
      }),
    [],
  );
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const rippleMat = useRef<THREE.ShaderMaterial>(null);

  const target = useRef<Key>({ x: 0, az: 0, el: 0, dist: 0, explode: 0, spin: 0 });
  const cur = useRef({ x: 0, explode: 0, spin: 0, kick: 0, tiltX: 0, tiltY: 0, glow: 0, distort: 0.3 });
  const kickTarget = useRef(0);
  const hoverRef = useRef(false);
  const hotspotsShown = useRef(false);

  const colors = useMemo(
    () => variants.map((v) => ({ main: new THREE.Color(v.color), accent: new THREE.Color(v.accent) })),
    [],
  );

  const bandData = useMemo(() => {
    const seg = TAU / BANDS;
    return Array.from({ length: BANDS }, (_, i) => {
      const len = seg * 0.92;
      const start = i * seg + (seg - len) / 2;
      const mid = start + len / 2;
      return {
        geo: new THREE.SphereGeometry(SHELL_R, 32, 24, start, len, Math.PI * 0.27, Math.PI * 0.46),
        dir: new THREE.Vector3(-Math.cos(mid), 0, Math.sin(mid)),
      };
    });
  }, []);
  const topGeo = useMemo(() => new THREE.SphereGeometry(SHELL_R, 48, 16, 0, TAU, 0, Math.PI * 0.22), []);
  const bottomGeo = useMemo(
    () => new THREE.SphereGeometry(SHELL_R, 48, 16, 0, TAU, Math.PI * 0.78, Math.PI * 0.22),
    [],
  );
  const rippleUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uStrength: { value: 0.3 }, uColor: { value: new THREE.Color("#9b8cff") } }),
    [],
  );

  useEffect(
    () => () => {
      bandData.forEach((b) => b.geo.dispose());
      topGeo.dispose();
      bottomGeo.dispose();
    },
    [bandData, topGeo, bottomGeo],
  );

  useFrame((state, dt) => {
    const t = sample(scrollState.progress, target.current);
    const c = cur.current;
    const { variant, setHotspots } = useStore.getState();
    const col = colors[variant];
    const v = variants[variant];
    const smooth = reduced ? 0.05 : 0.4;

    // ---- choreography ----
    const wide = state.size.width / state.size.height > 1.1;
    easing.damp(c, "x", wide ? t.x : 0, smooth, dt);
    easing.damp(c, "explode", t.explode, smooth, dt);
    easing.damp(c, "spin", t.spin, smooth, dt);
    easing.damp(c, "kick", kickTarget.current, 0.7, dt);
    easing.damp(c, "tiltY", reduced ? 0 : state.pointer.x * 0.5, 0.35, dt);
    easing.damp(c, "tiltX", reduced ? 0 : -state.pointer.y * 0.3, 0.35, dt);
    easing.damp(c, "glow", hoverRef.current ? 1 : 0, 0.25, dt);
    easing.damp(c, "distort", hoverRef.current ? 0.6 : 0.3, 0.3, dt);

    if (outer.current) outer.current.position.x = c.x;
    if (spinGroup.current) {
      spinGroup.current.rotation.y = c.spin + c.kick + c.tiltY;
      spinGroup.current.rotation.x = c.tiltX;
      const s = wide ? 1 : 0.8;
      spinGroup.current.scale.setScalar(s * (1 + c.glow * 0.04));
    }

    // exploding shell segments
    bands.current.forEach((m, i) => {
      if (!m) return;
      const d = bandData[i].dir;
      const k = c.explode * 0.9;
      m.position.set(d.x * k, Math.sin(i * 1.7) * c.explode * 0.12, d.z * k);
      m.rotation.y = d.x * c.explode * 0.05;
    });
    if (capTop.current) capTop.current.position.y = c.explode * 1.1;
    if (capBottom.current) capBottom.current.position.y = -c.explode * 1.1;

    // orbiting rings
    rings.current.forEach((r, i) => {
      if (!r) return;
      r.rotation.x = Math.PI / 2 + i * 0.9 + state.clock.elapsedTime * (0.25 + i * 0.12);
      r.rotation.y = i * 0.6 + state.clock.elapsedTime * 0.15 * (i % 2 ? -1 : 1);
      r.scale.setScalar(1 + c.explode * 0.12 * (i + 1) + c.glow * 0.05);
    });

    // core pulse
    if (core.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.04 + c.explode * 0.12;
      core.current.scale.setScalar(pulse);
    }
    if (coreMat.current) {
      coreMat.current.distort = c.distort;
      coreMat.current.color.lerp(col.accent, 0.08);
      coreMat.current.emissive.lerp(col.accent, 0.08);
      coreMat.current.emissiveIntensity = 1.6 + c.glow * 1.4 + c.explode * 0.5;
    }

    // materials follow selected variant
    {
      shellMaterial.color.lerp(col.main, 0.08);
      shellMaterial.metalness += (v.metalness - shellMaterial.metalness) * 0.08;
      shellMaterial.roughness += (v.roughness - shellMaterial.roughness) * 0.08;
    }
    if (ringMat.current) {
      ringMat.current.color.lerp(col.accent, 0.08);
      ringMat.current.emissive.lerp(col.accent, 0.08);
      ringMat.current.emissiveIntensity = 2.2 + c.glow * 2;
    }

    // ground ripple, strongest in the final CTA
    if (rippleMat.current) {
      const u = rippleMat.current.uniforms;
      u.uTime.value = state.clock.elapsedTime;
      const cta = THREE.MathUtils.smoothstep(scrollState.progress, 0.75, 1);
      u.uStrength.value = 0.25 + cta * 0.75 + c.glow * 0.3;
      (u.uColor.value as THREE.Color).lerp(col.accent, 0.08);
    }

    // hotspots only while exploring the middle sections
    const show = scrollState.progress > 0.2 && scrollState.progress < 0.85;
    if (show !== hotspotsShown.current) {
      hotspotsShown.current = show;
      setHotspots(show);
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverRef.current = true;
    useStore.getState().setHovered(true);
  };
  const onOut = () => {
    hoverRef.current = false;
    useStore.getState().setHovered(false);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    kickTarget.current += TAU;
    useStore.getState().fireBurst(e.point.x, e.point.y, e.point.z);
  };

  return (
    <group ref={outer}>
      <Float
        speed={reduced ? 0 : 1.6}
        rotationIntensity={reduced ? 0 : 0.25}
        floatIntensity={reduced ? 0 : 0.7}
        floatingRange={[-0.1, 0.1]}
      >
        <group ref={spinGroup} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <mesh ref={core}>
            <icosahedronGeometry args={[0.85, 5]} />
            <MeshDistortMaterial
              ref={coreMat}
              color="#9b8cff"
              emissive="#9b8cff"
              emissiveIntensity={1.6}
              speed={2.2}
              distort={0.3}
              roughness={0.15}
              metalness={0.2}
              toneMapped={false}
            />
          </mesh>

          {bandData.map((b, i) => (
            <mesh key={i} geometry={b.geo} material={shellMaterial}
              ref={(m) => {
                bands.current[i] = m;
              }}
             />
          ))}
          <mesh ref={capTop} geometry={topGeo} material={shellMaterial} />
          <mesh ref={capBottom} geometry={bottomGeo} material={shellMaterial} />

          {[2.2, 2.55, 2.9].map((r, i) => (
            <mesh
              key={r}
              ref={(m) => {
                rings.current[i] = m;
              }}
            >
              <torusGeometry args={[r, 0.015 + i * 0.004, 12, 160]} />
              <meshStandardMaterial
                ref={i === 0 ? ringMat : undefined}
                color="#9b8cff"
                emissive="#9b8cff"
                emissiveIntensity={2.2}
                toneMapped={false}
              />
            </mesh>
          ))}

          <HotspotLayer />
        </group>
      </Float>

      <ContactShadows position={[0, -2.45, 0]} opacity={0.5} scale={14} blur={2.6} far={5} resolution={512} frames={1} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.4, 0]}>
        <planeGeometry args={[16, 16]} />
        <shaderMaterial
          ref={rippleMat}
          vertexShader={rippleVertex}
          fragmentShader={rippleFragment}
          uniforms={rippleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function HotspotLayer() {
  const show = useStore((s) => s.hotspots);
  return (
    <>
      <Html position={[1.35, 0.5, 0.6]} center zIndexRange={[20, 0]} style={{ pointerEvents: show ? "auto" : "none" }}>
        <Hotspot visible={show} title="Segmented shell" text="Six interlocking panels with a clear-coat finish." />
      </Html>
      <Html position={[0, 0, 0.95]} center zIndexRange={[20, 0]} style={{ pointerEvents: show ? "auto" : "none" }}>
        <Hotspot visible={show} title="Living core" text="A reactive light engine that pulses with your touch." />
      </Html>
      <Html position={[2.2, 0, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: show ? "auto" : "none" }}>
        <Hotspot visible={show} title="Orbit rings" text="Three emissive halos that fan out as the shell opens." />
      </Html>
    </>
  );
}
