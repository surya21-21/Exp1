// Motion-graphics kit: the small pieces every scene and transition of the motion pack is
// built from. Kinetic type (slam, tracking settle, mask reveal, push-up, swap in place),
// rolling numbers, a per-element motion blur, lift shadows, a boiling pencil line and the
// word clock. Every function is pure: same time in, same styles out.
import { FPS, fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack, stepped } from '../../../collection/lib/ease.js';
import { P, h, abs, cardCss, pencilPath } from '../../../collection/lib/paper.js';
import { DISPLAY, SANS, SERIF } from '../../../collection/lib/elements.js';

export { DISPLAY, SANS, SERIF };
export const ACCENT = 'var(--accent)';

// ---------------------------------------------------------------- word clock
// The wordClock layer puts every spoken word (absolute seconds) in ctx.shared.words, so a
// scene can land a move on any word, not only on the *keywords* (which stay its beats).
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9']/g, '');
export function sceneWords(ctx) {
  const all = (ctx.shared && ctx.shared.words) || [];
  return all.filter(w => w.s >= ctx.start - 0.05 && w.s < ctx.end - 0.01).map(w => ({ ...w, s: w.s - ctx.start, e: w.e - ctx.start }));
}
// Local start (seconds into the scene) of the n-th spoken `text` in this scene, or `fb`.
export function wordAt(ctx, text, n = 0, fb = 0) {
  const hit = sceneWords(ctx).filter(w => norm(w.w) === norm(text))[n];
  return hit ? hit.s : fb;
}
export function wordEnd(ctx, text, n = 0, fb = 0) {
  const hit = sceneWords(ctx).filter(w => norm(w.w) === norm(text))[n];
  return hit ? hit.e : fb;
}
// Absolute time of the n-th `text` anywhere in the reel (for things that run across scenes).
export function reelWord(ctx, text, n = 0, fb = null) {
  const hit = ((ctx.shared && ctx.shared.words) || []).filter(w => norm(w.w) === norm(text))[n];
  return hit ? hit.s : fb;
}
export const beat = (ctx, i, d) => (ctx.beats && ctx.beats[i] != null ? ctx.beats[i] : d);

// ------------------------------------------------------------- motion blur
// One SVG filter per element that needs it, so a scene can blur as many things as it likes
// in one frame (the engine's own pool has eight, shared by everything on screen).
let nBlur = 0;
export function blurrer() {
  const defs = document.getElementById('defs');
  const id = `mgb${nBlur++}`;
  defs.insertAdjacentHTML('beforeend', `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="0 0"/></filter>`);
  const g = defs.lastElementChild.firstElementChild;
  return (el, sx, sy) => {
    if (sx < 0.5 && sy < 0.5) { el.style.filter = ''; return; }
    g.setAttribute('stdDeviation', `${Math.min(30, sx).toFixed(1)} ${Math.min(30, sy).toFixed(1)}`);
    el.style.filter = `url(#${id})`;
  };
}

// ------------------------------------------------------------------ light
// Two shadows per object (Material): a tight dark one under it and a wide soft one. As the
// object lifts (L 0..1) the tight one fades and the soft one grows. Always down and right.
export const lift = (L = 0) => {
  const l = clamp(L);
  return `${(3 + 7 * l).toFixed(1)}px ${(5 + 15 * l).toFixed(1)}px ${(10 + 24 * l).toFixed(1)}px rgba(70,52,25,${(0.24 - 0.1 * l).toFixed(3)}),` +
    `${(16 + 26 * l).toFixed(1)}px ${(40 + 50 * l).toFixed(1)}px ${(70 + 60 * l).toFixed(1)}px -22px rgba(70,52,25,${(0.36 + 0.1 * l).toFixed(3)})`;
};
export const dropLift = (L = 0) => {
  const l = clamp(L);
  return `drop-shadow(${(4 + 10 * l).toFixed(1)}px ${(7 + 20 * l).toFixed(1)}px ${(6 + 16 * l).toFixed(1)}px rgba(70,52,25,${(0.3 + 0.08 * l).toFixed(3)}))`;
};
// paper card with the form shading of cardCss, but with the lift shadow
export const paperCss = (radius = 32, L = 0) =>
  `border-radius:${radius}px;background:linear-gradient(160deg,${P.card},${P.card2} 72%);box-shadow:inset 2px 2px 0 #fff,inset -2px -2px 0 rgba(0,0,0,.05),${lift(L)};`;

// ----------------------------------------------------------- kinetic type
// SLAM (M10, Disney anticipation): the word appears big on `at`, pulls back (grows a further
// tenth of its travel) for 2 frames, crashes into place in `crash` frames (speeding up, so the
// impact is the fastest frame) and overshoots 7% below size before settling over `settle`.
// Returns { o, s, v } (opacity, scale, scale change per frame for the blur). Impact frame:
// at + (2 + crash) frames, exported as slamHit.
export function slam(t, at, { from = 2.3, pull = 0.1, crash = 3, settle = 6, dip = 0.07 } = {}) {
  const f = (t - at) * FPS;
  if (f < 0) return { o: 0, s: from, v: 0 };
  const peak = from + (from - 1) * pull;
  const S = g => {
    if (g < 2) return lerp(from, peak, Math.sin((Math.PI / 2) * (g / 2)));
    if (g < 2 + crash) return lerp(peak, 1, inCubic((g - 2) / crash));
    const k = clamp((g - 2 - crash) / settle);
    return 1 - dip * Math.sin(Math.PI * k) * (1 - 0.35 * k);
  };
  return { o: clamp(f / 1.5), s: S(f), v: Math.abs(S(f) - S(f - 1)) };
}
export const slamHit = (at, crash = 3) => at + fr(2 + crash);

// TRACKING SETTLE: letters arrive spread wide and close up as the word lands (scale 1.18 -> 1).
export function trackIn(el, t, at, { spread = 0.32, to = -0.02, dur = 9, rise = 0 } = {}) {
  const p = prog(t, at, fr(dur)), e = outCubic(p);
  el.style.opacity = clamp(p * 3).toFixed(3);
  el.style.letterSpacing = `${lerp(spread, to, e).toFixed(3)}em`;
  el.style.transform = `translateY(${(rise * (1 - e)).toFixed(1)}px) scale(${lerp(1.18, 1, e).toFixed(4)})`;
  return p;
}

// MASK REVEAL: the line is uncovered left to right by a moving edge while it slides 30 px in.
export function maskIn(el, t, at, { dur = 7, dx = -30, dir = 'right' } = {}) {
  const p = prog(t, at, fr(dur)), e = outCubic(p);
  const cut = (100 * (1 - e)).toFixed(1);
  el.style.clipPath = p >= 1 ? 'none' : dir === 'up' ? `inset(${cut}% 0 0 0)` : `inset(-20% ${cut}% -20% -5%)`;
  el.style.opacity = p > 0 ? 1 : 0;
  el.style.transform = dir === 'up' ? `translateY(${(40 * (1 - e)).toFixed(1)}px)` : `translateX(${(dx * (1 - e)).toFixed(1)}px)`;
  return p;
}
export const maskOut = (el, t, at, dur = 5) => {
  const p = prog(t, at, fr(dur)), e = inCubic(p);
  if (p <= 0) return 0;
  el.style.clipPath = `inset(-20% -5% -20% ${(100 * e).toFixed(1)}%)`;
  el.style.transform = `translateX(${(40 * e).toFixed(1)}px)`;
  return p;
};

// SWAP IN PLACE: the old word leaves upward through a slot as the new one rises into it.
// `els` are stacked in one slot (overflow hidden); `ats` the moments each takes over.
export function swapIn(els, t, ats, { dur = 6, dist = 1.05 } = {}) {
  let cur = -1;
  ats.forEach((a, i) => { if (t >= a) cur = i; });
  els.forEach((el, i) => {
    const hh = el.offsetHeight || 100;
    if (i === cur) {
      const e = outBack(prog(t, ats[i], fr(dur)), 1.5);
      el.style.opacity = 1;
      el.style.transform = `translateY(${(hh * dist * (1 - e)).toFixed(1)}px)`;
    } else if (i === cur - 1) {
      const e = inCubic(prog(t, ats[cur], fr(dur - 1)));
      el.style.opacity = (1 - e).toFixed(3);
      el.style.transform = `translateY(${(-hh * dist * e).toFixed(1)}px)`;
    } else { el.style.opacity = 0; el.style.transform = `translateY(${hh * dist}px)`; }
  });
  return cur;
}

// LETTERS: a word split into spans, so each letter can be moved on its own.
export function letters(text, css = '') {
  const el = h('div', `white-space:nowrap;${css}`);
  const ls = [...text].map(ch => { const s = h('span', 'display:inline-block;will-change:transform', ch === ' ' ? '&nbsp;' : ch); el.append(s); return s; });
  return { el, ls };
}

// ------------------------------------------------------------ numbers
// A number that rolls like a slot machine (N06): each digit is a strip of two figures moving
// up; the lowest place rolls smoothly, higher places snap with a short roll, so it reads at speed.
// value(T) gives the number at time T; fmt(v) the text; the layout is fixed by fmt(final).
export function rollNumber({ final, fmt = v => Math.round(v).toLocaleString('en-US'), size = 120, cards = false, cardW = null, cardH = null, gap = 6, color = P.ink, weight = 900, font = DISPLAY, morph = null }) {
  const layout = fmt(final);
  const el = h('div', `display:flex;align-items:center;gap:${gap}px;width:fit-content;white-space:nowrap`);
  const cellH = cardH || Math.round(size * 1.12), cellW = cardW || Math.round(size * 0.64);
  const dec = (layout.split('.')[1] || '').replace(/\D/g, '').length;
  let place = layout.replace(/\..*$/, '').replace(/\D/g, '').length - 1 + 0;
  const cells = [];
  let afterPoint = false, di = 0;
  for (const ch of layout) {
    if (/\d/.test(ch)) {
      const p10 = afterPoint ? -(++di) : place--;
      const c = h('div', `position:relative;flex:none;width:${cellW}px;height:${cellH}px;overflow:hidden;${cards ? cardCss(Math.round(cellW * 0.16)) : ''}`);
      const strip = h('div', `position:absolute;left:0;top:0;width:100%;text-align:center;color:${color};font:${weight} ${cards ? Math.round(cellH * 0.78) : size}px/${cellH}px ${font};letter-spacing:-.02em`);
      const a = h('div', `height:${cellH}px`), b = h('div', `height:${cellH}px`);
      strip.append(a, b); c.append(strip);
      if (cards) c.append(h('div', 'position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(70,52,25,.12)'));
      if (morph) c.dataset.morph = `${morph}${cells.length}`;
      el.append(c);
      cells.push({ c, strip, a, b, unit: Math.pow(10, p10), blur: blurrer() });
    } else {
      if (ch === '.') afterPoint = true;
      el.append(h('div', `flex:none;color:${color};font:${weight} ${cards ? Math.round(cellH * 0.62) : size}px/${cellH}px ${font};${ch === ',' || ch === '.' ? 'margin:0 -2px' : ''}`, ch === ' ' ? '&nbsp;' : ch));
    }
  }
  return {
    el, cells,
    // v: the value now; vNext: the value one frame later (for blur). land: 0..1 bounce on landing.
    update(v, vNext = v, land = 0) {
      const speedAll = Math.abs(vNext - v);
      cells.forEach((k, i) => {
        const raw = v / k.unit + 1e-9, cur = Math.floor(raw) % 10, f = raw - Math.floor(raw);
        const roll = speedAll < 1e-9 ? 0 : k.unit <= Math.pow(10, -dec) ? f : Math.pow(f, 5);
        k.a.textContent = cur; k.b.textContent = (cur + 1) % 10;
        k.strip.style.transform = `translateY(${(-roll * cellH).toFixed(1)}px)`;
        const sp = speedAll / k.unit;
        k.blur(k.strip, 0, sp > 0.5 ? Math.min(9, sp * 2) : 0);
        const b = clamp(land - i * 0.12);
        k.c.style.transform = b > 0 && b < 1 ? `translateY(${(-0.12 * cellH * Math.sin(Math.PI * b)).toFixed(1)}px)` : '';
      });
    },
  };
}

// ------------------------------------------------------------- pencil
// A hand-drawn line (N10) that can "boil": on twos its wobble is redrawn with the next seed,
// the hand-made look of drawn animation. p = 0..1 drawn.
export function pencilLine(len, { seed = 7, width = 10, color = ACCENT, wobble = 3.5 } = {}) {
  const el = h('div', `position:absolute;width:${len}px;height:28px;pointer-events:none`,
    `<svg width="${len}" height="28" viewBox="0 -14 ${len} 28" style="overflow:visible;display:block"><path fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`);
  const path = el.querySelector('path');
  path.setAttribute('d', pencilPath(len, seed, wobble));
  return {
    el,
    update(p, boil = null) {
      el.style.opacity = p <= 0 ? 0 : 1;
      if (boil != null) path.setAttribute('d', pencilPath(len, seed + boil, wobble));
      path.setAttribute('stroke-dashoffset', (1 - clamp(p)).toFixed(4));
    },
  };
}
// step index for boiling lines: changes every second frame (15 drawings a second)
export const boilStep = (t, fps = 15) => Math.floor(t * fps + 1e-6) % 3;

// ------------------------------------------------------------ helpers
export const show = (el, o) => { el.style.opacity = clamp(o).toFixed(3); };
export const place = (el, x, y, s = 1, r = 0) => { el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`; };
// a point on a shallow arc from a to b (bend = share of the distance, to the left of travel)
export function arc(ax, ay, bx, by, u, bend = 0.18) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, d = Math.hypot(bx - ax, by - ay) || 1;
  let nx = -(by - ay) / d, ny = (bx - ax) / d;
  if (ny > 0) { nx = -nx; ny = -ny; }                  // bulge upward
  const cx = mx + nx * d * bend, cy = my + ny * d * bend;
  const x = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx;
  const y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
  return [x, y];
}
// Travel curve for a hero element: 2-3 frames of pull-back, an accelerating start, an
// overshoot of about 5% and a settle. x = 0..1 through the move, n = frames the move lasts.
export function heroTravel(x, n = 14, pull = 0.05) {
  const a = Math.min(0.2, 2.5 / Math.max(6, n));
  if (x <= 0) return 0;
  if (x < a) return -pull * Math.sin(Math.PI * (x / a));
  const q = (x - a) / (1 - a);
  return q < 0.5 ? 0.5 * inCubic(2 * q) : 0.5 + 0.5 * outBack(clamp(2 * q - 1), 1.6);
}
// A paper chapter tile: the finding's number on an accent square (carried scene to scene).
export function tile(n, size = 96) {
  const el = h('div', `position:relative;flex:none;width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.24)}px;background:var(--accent);box-shadow:inset 2px 2px 0 rgba(255,255,255,.25),inset -3px -3px 0 rgba(60,15,5,.18),${lift(0)};display:flex;align-items:center;justify-content:center;font:900 ${Math.round(size * 0.62)}px/1 ${DISPLAY};color:#fffdf8`, String(n));
  return el;
}
export { stepped, abs, P, h, cardCss };
