// Timing helpers. Every function is pure: same input, same output, so any
// frame of a reel can be drawn on its own.
export const FPS = 30;
export const fr = n => n / FPS;                       // frames -> seconds
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, start, dur) => clamp((t - start) / Math.max(1e-6, dur));
export const inCubic = p => p * p * p;
export const outCubic = p => 1 - Math.pow(1 - p, 3);
export const inOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const outExpo = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const outBack = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
// Damped spring from 0 to 1 with a small overshoot.
export const spring = (p, bounces = 1.25, damp = 5.5) =>
  p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-damp * p) * Math.cos(bounces * 2 * Math.PI * p);
// 0 -> 1 over `up`, back to 0 over `down`.
export const pulse = (t, start, up, down) =>
  t < start ? 0 : t < start + up ? (t - start) / up : clamp(1 - (t - start - up) / down);
// Hold time on a lower frame rate (animating "on twos" = 15).
export const stepped = (t, fps = 15) => Math.floor(t * fps + 1e-6) / fps;
// Seeded random numbers (mulberry32). Never use Math.random on the render path.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
