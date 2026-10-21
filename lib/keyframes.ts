export type Key = {
  /** product horizontal offset (desktop) */
  x: number;
  /** camera azimuth / elevation / distance */
  az: number;
  el: number;
  dist: number;
  /** shell explosion amount */
  explode: number;
  /** product spin around Y */
  spin: number;
};

export const KEYS: Key[] = [
  { x: 0, az: 0, el: 0.1, dist: 8, explode: 0, spin: 0 },
  { x: 2, az: -0.5, el: 0.25, dist: 6.5, explode: 0.9, spin: 1.3 },
  { x: -2, az: 0.55, el: -0.1, dist: 5, explode: 1.8, spin: 2.6 },
  { x: 2, az: 0, el: 0.15, dist: 6.5, explode: 0.1, spin: 3.9 },
  { x: 0, az: 0, el: 0.35, dist: 9, explode: 0, spin: Math.PI * 2 },
];

export const SECTION_COUNT = KEYS.length;

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function sample(progress: number, out: Key): Key {
  const n = KEYS.length;
  const t = Math.min(Math.max(progress, 0), 1) * (n - 1);
  const i = Math.min(Math.floor(t), n - 2);
  const f = smooth(t - i);
  const a = KEYS[i];
  const b = KEYS[i + 1];
  out.x = lerp(a.x, b.x, f);
  out.az = lerp(a.az, b.az, f);
  out.el = lerp(a.el, b.el, f);
  out.dist = lerp(a.dist, b.dist, f);
  out.explode = lerp(a.explode, b.explode, f);
  out.spin = lerp(a.spin, b.spin, f);
  return out;
}
