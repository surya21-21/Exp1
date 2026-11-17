// G01 shared-element morph: the carry engine of the motion pack.
// Elements with the same data-morph name in the outgoing and the incoming scene are measured
// every frame. A "flyer" takes over from the outgoing one: it travels on a shallow arc to the
// incoming one's box (2-3 frames of pull-back, then an accelerating start and a 5% overshoot),
// changing width, height, corner radius and paint on the way while its contents cross over
// (the old content scales and fades out, the new one scales and fades in). It lifts off the
// paper as it travels (the tight shadow fades, the soft one grows) and is blurred along its
// path when fast. At p = 0 it is exactly the old element, at p = 1 exactly the new one, so the
// hand-over is invisible. Several pairs leave 2 frames apart, in document order.
// A scene that is not ours can be given pairs by selector in its props:
//   "morphIn": { "pill": [null, ":scope > :nth-child(3)"] }   (from-selector or null, to-selector)
import { FPS, clamp, lerp, prog, outCubic, inOutCubic } from '../../../collection/lib/ease.js';
import { h } from '../../../collection/lib/paper.js';
import { blurrer, dropLift, arc, heroTravel } from './kit.js';

// The slot between the scenes and the brand avatar: transition graphics drawn there sit above
// both scenes but under the avatar, the captions and the paper grain.
export function packSlot(ov, name = 'pack-over') {
  const st = ov.parentElement;
  return (st && st.querySelector(`:scope > [data-layer="${name}"]`)) || ov;
}
export function stageOrigin(el) {
  const st = el.closest('#stage') || document.getElementById('stage');
  const r = st.getBoundingClientRect();
  return { left: r.left, top: r.top };
}
export function rectOf(el, o) {
  const r = el.getBoundingClientRect();
  return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
}
const INHERIT = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'color', 'letterSpacing', 'textAlign', 'whiteSpace', 'textTransform'];
function paintOf(el) {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, img: cs.backgroundImage, shadow: cs.boxShadow, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, radius: cs.borderTopLeftRadius };
}
const radiusPx = (r, w, hh) => { const v = parseFloat(r) || 0; return String(r).endsWith('%') ? (v / 100) * Math.min(w, hh) : v; };

// A copy of what is inside a morph element, laid out exactly as the original, without its paint.
export function contentClone(el) {
  const c = el.cloneNode(true), cs = getComputedStyle(el);
  c.removeAttribute('data-morph'); c.removeAttribute('data-key'); c.removeAttribute('data-zoom');
  c.querySelectorAll('[data-key],[data-morph],[data-zoom]').forEach(e => { e.removeAttribute('data-key'); e.removeAttribute('data-morph'); e.removeAttribute('data-zoom'); });
  for (const k of INHERIT) c.style[k] = cs[k];
  Object.assign(c.style, { position: 'absolute', left: '0px', top: '0px', right: 'auto', bottom: 'auto', margin: '0px', width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`,
    transform: 'none', transformOrigin: '0 0', opacity: '1', visibility: 'visible', filter: 'none', background: 'none', boxShadow: 'none', borderColor: 'transparent', outline: 'none', clipPath: 'none' });
  return c;
}
// A copy of a whole scene (for transitions that cut the picture into pieces).
export function sceneClone(wrap, dx = 0, dy = 0) {
  const c = wrap.cloneNode(true);
  c.querySelectorAll('[data-key],[data-morph],[data-zoom]').forEach(e => { e.removeAttribute('data-key'); e.removeAttribute('data-morph'); e.removeAttribute('data-zoom'); });
  c.style.cssText = `position:absolute;left:${dx}px;top:${dy}px;width:1080px;height:1920px;display:block`;
  return c;
}

export function findPairs(out, inn, props) {
  const extra = (props && props.morphIn) || {};
  const names = [...out.querySelectorAll('[data-morph]')].map(e => e.dataset.morph);
  const pairs = [], seen = new Set();
  for (const n of [...names, ...Object.keys(extra)]) {
    if (seen.has(n)) continue;
    seen.add(n);
    const sel = extra[n] ? (Array.isArray(extra[n]) ? extra[n] : [null, extra[n]]) : [null, null];
    const a = sel[0] ? out.querySelector(sel[0]) : out.querySelector(`[data-morph="${n}"]`);
    const b = sel[1] ? inn.querySelector(sel[1]) : inn.querySelector(`[data-morph="${n}"]`);
    if (a && b && a.offsetWidth && b.offsetWidth) pairs.push({ name: n, a, b });
  }
  return pairs;
}

// morpher(slot, ctx, { lead, settle, stagger, bend }) -> { measure(out, inn, props), draw(p), off() }
// measure() must run before the transition moves either scene; draw() after.
export function morpher(slot, ctx, { lead = 6, settle = 10, stagger = 2, bend = 0.16 } = {}) {
  const box = h('div', 'position:absolute;inset:0;pointer-events:none;display:none');
  slot.append(box);
  const pool = [];
  const flyer = i => {
    while (pool.length <= i) {
      const f = h('div', 'position:absolute;left:0;top:0;display:none');
      const inner = h('div', 'position:absolute;inset:0');
      const bgA = h('div', 'position:absolute;inset:0'), bgB = h('div', 'position:absolute;inset:0');
      const ca = h('div', 'position:absolute;left:0;top:0'), cb = h('div', 'position:absolute;left:0;top:0');
      inner.append(bgA, bgB, ca, cb); f.append(inner); box.append(f);
      pool.push({ f, inner, bgA, bgB, ca, cb, blur: blurrer() });
    }
    return pool[i];
  };
  let pairs = [], touched = [];
  const N = lead + settle;
  return {
    get pairs() { return pairs; },
    measure(out, inn, props) {
      const o = stageOrigin(out);
      pairs = findPairs(out, inn, props).map(pr => {
        const A = rectOf(pr.a, o), B = rectOf(pr.b, o);
        return { ...pr, A, B, pa: paintOf(pr.a), pb: paintOf(pr.b), ca: contentClone(pr.a), cb: contentClone(pr.b),
          la: [pr.a.offsetWidth, pr.a.offsetHeight], lb: [pr.b.offsetWidth, pr.b.offsetHeight] };
      });
      for (const pr of pairs) { pr.a.style.visibility = 'hidden'; pr.b.style.visibility = 'hidden'; touched.push(pr.a, pr.b); }
      return pairs;
    },
    draw(p) {
      box.style.display = pairs.length ? 'block' : 'none';
      // many pairs: the stagger shrinks so every flight still lasts 8 frames and lands by p = 1
      const n = pairs.length, sg = n > 1 ? Math.min(stagger, (N - 8) / (n - 1)) : 0, D = N - (n - 1) * sg;
      pairs.forEach((pr, i) => {
        const F = flyer(i), x = clamp((p * N - i * sg) / D), xp = clamp((p * N - i * sg - 1) / D);
        const u = heroTravel(x, D), up = heroTravel(xp, D);
        const ca = [pr.A.x + pr.A.w / 2, pr.A.y + pr.A.h / 2], cb = [pr.B.x + pr.B.w / 2, pr.B.y + pr.B.h / 2];
        const [cx, cy] = arc(ca[0], ca[1], cb[0], cb[1], u, bend), [px, py] = arc(ca[0], ca[1], cb[0], cb[1], up, bend);
        const w = Math.max(2, lerp(pr.A.w, pr.B.w, u)), hh = Math.max(2, lerp(pr.A.h, pr.B.h, u));
        const r = lerp(radiusPx(pr.pa.radius, pr.A.w, pr.A.h), radiusPx(pr.pb.radius, pr.B.w, pr.B.h), clamp(u));
        const c = outCubic(prog(x, 0.3, 0.45));           // paint and content cross over in the middle of the move
        F.f.style.cssText = `position:absolute;left:0;top:0;width:${w.toFixed(1)}px;height:${hh.toFixed(1)}px;transform:translate(${(cx - w / 2).toFixed(1)}px,${(cy - hh / 2).toFixed(1)}px);filter:${dropLift(Math.sin(Math.PI * x) * 0.9)}`;
        // the new paint fades in on top of the old, which goes only once it is covered (no pale middle)
        for (const [bg, pa, o] of [[F.bgA, pr.pa, 1 - prog(c, 0.7, 0.3)], [F.bgB, pr.pb, c]]) {
          bg.style.cssText = `position:absolute;inset:0;border-radius:${r.toFixed(1)}px;background-color:${pa.bg};background-image:${pa.img};box-shadow:${pa.shadow};border:${pa.border};opacity:${o.toFixed(3)}`;
        }
        const fit = (cl, lw, lh, el, o) => {
          const s = Math.min(w / lw, hh / lh);
          el.replaceChildren(cl);
          el.style.cssText = `position:absolute;left:0;top:0;width:${lw}px;height:${lh}px;transform-origin:0 0;transform:translate(${((w - lw * s) / 2).toFixed(1)}px,${((hh - lh * s) / 2).toFixed(1)}px) scale(${s.toFixed(4)});opacity:${o.toFixed(3)}`;
        };
        fit(pr.ca, pr.la[0], pr.la[1], F.ca, 1 - outCubic(prog(x, 0.42, 0.25)));
        fit(pr.cb, pr.lb[0], pr.lb[1], F.cb, outCubic(prog(x, 0.25, 0.3)));
        // fast moves are blurred along the direction of travel (T12, T17)
        F.blur(F.inner, Math.abs(cx - px) * 0.07, Math.abs(cy - py) * 0.07);
      });
      for (let i = n; i < pool.length; i++) pool[i].f.style.display = 'none';
    },
    off() {
      box.style.display = 'none';
      for (const el of touched) el.style.visibility = '';
      touched = [];
      pairs = [];
    },
  };
}

// What the rest of the two scenes do around the carried elements.
// The outgoing scene leaves faster than the incoming one arrives (exits are shorter).
export function leave(out, win, k) {
  if (win && win.A && win.A.exit) { win.A.exit(clamp(k), out); return; }
  const e = Math.pow(clamp(k), 2.2);
  out.style.opacity = (1 - e).toFixed(3);
  out.style.transformOrigin = '540px 960px';
  out.style.transform = `translateY(${(46 * e).toFixed(1)}px) scale(${(1 - 0.06 * e).toFixed(4)})`;
}
export function arrive(inn, win, k, after) {
  inn.style.zIndex = '';                                  // stay under the avatar, the captions and the grain
  if (win && win.B && win.B.selfEnter) { inn.style.visibility = after ? '' : 'hidden'; return; }
  const e = outCubic(clamp(k));
  inn.style.opacity = e.toFixed(3);
  inn.style.transform = `translateY(${(40 * (1 - e)).toFixed(1)}px)`;
}
