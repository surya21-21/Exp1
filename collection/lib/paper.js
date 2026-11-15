// Paper Studio: the locked background and the materials everything else is made of.
// Light comes from the top-left, so every shadow falls down and to the right.
import { rng } from './ease.js';

export const P = {
  bg: '#efeae0', floor: '#e6dfd1', ink: '#1b1a17', muted: '#7c766a',
  card: '#fffdf8', card2: '#f2ede3', line: '#e2dacb', track: '#d9d2c3',
  kraft: '#d8c4a0', note: '#f6dc7c', graphite: '#4a463f',
  shadowSoft: 'rgba(70,52,25,.22)', shadowDeep: 'rgba(70,52,25,.42)',
};
export const W = 1080, H = 1920;
// Instagram covers the top and bottom of a reel; keep anything that matters inside this box.
export const SAFE = { x0: 60, x1: 960, y0: 230, y1: 1490 };

export function h(tag, css = '', html = '') {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (html) e.innerHTML = html;
  return e;
}
export const abs = (x, y, w, hh, extra = '') =>
  `position:absolute;left:${x}px;top:${y}px;${w != null ? `width:${w}px;` : ''}${hh != null ? `height:${hh}px;` : ''}${extra}`;

export const cardCss = (radius = 36) =>
  `border-radius:${radius}px;background:linear-gradient(160deg,${P.card},${P.card2} 70%);` +
  `box-shadow:inset 2px 2px 0 #fff,inset -2px -2px 0 rgba(0,0,0,.06),4px 6px 12px ${P.shadowSoft},18px 44px 80px -24px ${P.shadowDeep};`;

export function card(x, y, w, hh, extra = '') {
  return h('div', abs(x, y, w, hh, cardCss() + extra));
}

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence baseFrequency=%22.9%22 numOctaves=%222%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%22.05%22/></svg>\")";

// Builds the background under `under` and the grain and vignette in `over`.
// Returns the desk lamp (N04): lamp.update(x, y, strength) moves a warm pool of light.
export function background(under, over) {
  under.append(
    h('div', 'position:absolute;inset:0;background:radial-gradient(70% 45% at 28% 22%,#fbf8f1,transparent 70%),linear-gradient(#efeae0 0 66%,#e6dfd1 66%)'),
    h('div', 'position:absolute;left:0;right:0;top:66%;height:4px;background:rgba(0,0,0,.05)'),
  );
  const pool = h('div', 'position:absolute;inset:0');
  under.append(pool);
  over.append(
    h('div', `position:absolute;inset:0;background:${GRAIN};mix-blend-mode:multiply`),
    h('div', 'position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 45%,transparent 60%,rgba(90,70,40,.18))'),
  );
  return {
    update(x, y, k = 1, radius = 620) {
      pool.style.background = k <= 0 ? 'none'
        : `radial-gradient(circle ${radius}px at ${x}px ${y}px,rgba(255,250,232,${0.75 * k}),rgba(255,250,232,0) 72%),` +
          `radial-gradient(circle ${radius * 2.4}px at ${x}px ${y}px,rgba(84,62,28,0),rgba(84,62,28,${0.09 * k}) 100%)`;
    },
  };
}

// A rough torn line from (x0,y0) to (x1,y1) as "x,y x,y ..." points.
export function tornLine(x0, y0, x1, y1, seed, amp = 12, step = 26) {
  const r = rng(seed), len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / step));
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len, pts = [];
  for (let i = 0; i <= n; i++) {
    const p = i / n, j = (r() - 0.5) * 2 * amp * (i === 0 || i === n ? 0 : 1);
    pts.push([x0 + (x1 - x0) * p + nx * j, y0 + (y1 - y0) * p + ny * j]);
  }
  return pts;
}
export const pts = a => a.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// A hand-drawn pencil line of the given length, as an SVG path "d".
export function pencilPath(len, seed, wobble = 3) {
  const r = rng(seed), n = Math.max(3, Math.round(len / 40));
  let d = `M0,${(r() - 0.5) * wobble}`;
  for (let i = 1; i <= n; i++) {
    const x = (len * i) / n, y = (r() - 0.5) * 2 * wobble;
    d += ` Q${(x - len / n / 2).toFixed(1)},${((r() - 0.5) * 2 * wobble).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

// Mix a colour with white (k = share of the colour), for tape and tints.
export function tint(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const m = c.map(v => Math.round(v * k + 255 * (1 - k)));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
// Contrast ratio between two hex colours (WCAG).
export function contrast(a, b) {
  const lum = hex => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
