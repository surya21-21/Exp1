// Props the puppet holds. Each is { build(g) -> state, update(state, prop, arm, S, J) -> bounds }.
// A prop hangs from the hand along prop.ang (degrees: 0 = straight down, +90 = screen right,
// 180 = up). Sizes scale with the head size S; text is set in real px (never under 34 px).
// Helpers (tipOf, faceOf, lensOf) give the working point of a prop, so a scene can put its
// mark exactly where the drawn prop touches.
import { clamp } from '../../../collection/lib/ease.js';
import { P as PAPER } from '../../../collection/lib/paper.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, parent = null) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };
const f1 = v => (Math.round(v * 10) / 10).toString();
const OUT = '#151515';
const dir = deg => { const r = deg * Math.PI / 180; return [Math.sin(r), Math.cos(r)]; };
const place = (g, x, y, ang) => g.setAttribute('transform', `translate(${f1(x)},${f1(y)}) rotate(${f1(-ang)})`);
const set = (e, a) => { for (const k in a) e.setAttribute(k, typeof a[k] === 'number' ? f1(a[k]) : a[k]); };

// Where along the prop the hand holds it, and its length, in S.
export const PENCIL = { len: 0.78, grip: 0.3, w: 0.07 };
export const STAMP = { len: 0.3 };
export const LENS = { handle: 0.24, r: 0.2 };

export const tipOf = (hand, ang, S, len = PENCIL.len) => { const v = dir(ang); return [hand[0] + v[0] * len * S * (1 - PENCIL.grip), hand[1] + v[1] * len * S * (1 - PENCIL.grip)]; };
export const faceOf = (hand, ang, S) => { const v = dir(ang); return [hand[0] + v[0] * STAMP.len * S, hand[1] + v[1] * STAMP.len * S]; };
export const lensOf = (hand, ang, S, r = LENS.r) => { const v = dir(ang); const d = (LENS.handle + r) * S; return [hand[0] + v[0] * d, hand[1] + v[1] * d]; };

// A held card's box on screen, from the hand: centre offset (dx, dy) px, size (w, h), turn rot (deg).
export const cardRect = (hand, pr) => ({ x: hand[0] + (pr.dx ?? 110) - (pr.w || 210) / 2, y: hand[1] + (pr.dy ?? -30) - (pr.h || 170) / 2, w: pr.w || 210, h: pr.h || 170, rot: pr.rot || 0 });

export const PROPS = {
  // A paper card held at the side of the hand: a number in the accent and one to three short lines.
  card: {
    build(g) {
      return { g, shadow: sv('rect', { fill: 'rgba(70,52,25,.22)' }, g), face: sv('rect', { fill: PAPER.card, stroke: 'rgba(70,52,25,.18)', 'stroke-width': 2 }, g),
        num: sv('text', { 'font-family': '"Inter Display","Inter",sans-serif', 'font-weight': 900, fill: 'var(--accent)' }, g),
        lines: [0, 1, 2].map(() => sv('text', { 'font-family': 'Inter,sans-serif', 'font-weight': 800, fill: PAPER.ink }, g)) };
    },
    update(st, pr, arm) {
      const r = cardRect(arm.hand, pr), s = pr.scale ?? 1;
      st.g.setAttribute('transform', `translate(${f1(r.x + r.w / 2)},${f1(r.y + r.h / 2)}) rotate(${f1(r.rot)}) scale(${s.toFixed(3)})`);
      set(st.shadow, { x: -r.w / 2 + 6, y: -r.h / 2 + 9, width: r.w, height: r.h, rx: 22 });
      set(st.face, { x: -r.w / 2, y: -r.h / 2, width: r.w, height: r.h, rx: 22 });
      st.num.textContent = pr.n || ''; set(st.num, { x: -r.w / 2 + 18, y: -r.h / 2 + 62, 'font-size': 56 });
      (pr.lines || []).concat(['', '', '']).slice(0, 3).forEach((l, i) => { st.lines[i].textContent = l; set(st.lines[i], { x: -r.w / 2 + 18, y: -r.h / 2 + 104 + i * 36, 'font-size': 32 }); });
      return [[r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) / 2]];
    },
  },
  // A stack of small cards held flat in the hand: pr.n of them.
  stack: {
    build(g) { return { g, cards: Array.from({ length: 12 }, () => sv('rect', { fill: PAPER.card, stroke: 'rgba(70,52,25,.35)', 'stroke-width': 2 }, g)) }; },
    update(st, pr, arm) {
      const n = pr.n ?? 12, w = pr.w || 116, hh = pr.h || 66;
      st.g.setAttribute('transform', `translate(${f1(arm.hand[0])},${f1(arm.hand[1] - 8)}) rotate(${f1(pr.rot ?? -6)})`);
      st.cards.forEach((c, i) => { c.style.display = i < n ? 'inline' : 'none'; set(c, { x: -w / 2, y: -hh - i * 3.5, width: w, height: hh, rx: 10 }); });
      return [[arm.hand[0], arm.hand[1] - hh / 2 - n * 2.5, w / 2]];
    },
  },

  // A long red pencil (N10's pencil, in the accent): grip near the back, the graphite tip draws.
  pencil: {
    build(g) {
      return { g, body: sv('path', { fill: 'var(--accent)', stroke: OUT, 'stroke-linejoin': 'round' }, g), lit: sv('rect', { fill: 'rgba(255,255,255,.22)' }, g),
        wood: sv('path', { fill: '#ead7b0', stroke: OUT, 'stroke-linejoin': 'round' }, g), lead: sv('path', { fill: '#2b2b2a' }, g),
        ferrule: sv('rect', { fill: '#bdbdbb', stroke: OUT }, g), eraser: sv('rect', { fill: '#dcdad5', stroke: OUT }, g) };
    },
    update(st, pr, arm, S) {
      const L = (pr.len || PENCIL.len) * S, w = PENCIL.w * S, o = 0.012 * S, b = -L * PENCIL.grip, tip = L * (1 - PENCIL.grip);
      const cone = w * 1.7;
      place(st.g, arm.hand[0], arm.hand[1], pr.ang);
      // drawn along +y: from the back (b) to the tip
      set(st.eraser, { x: -w / 2, y: b - w * 0.55, width: w, height: w * 0.75, rx: w * 0.3, 'stroke-width': o * 1.6 });
      set(st.ferrule, { x: -w / 2 - o * 0.3, y: b + w * 0.05, width: w + o * 0.6, height: w * 0.55, 'stroke-width': o * 1.6 });
      st.body.setAttribute('d', `M${f1(-w / 2)},${f1(b + w * 0.6)} L${f1(w / 2)},${f1(b + w * 0.6)} L${f1(w / 2)},${f1(tip - cone)} L${f1(-w / 2)},${f1(tip - cone)} Z`);
      st.body.setAttribute('stroke-width', f1(o * 1.6));
      set(st.lit, { x: -w / 2 + o, y: b + w * 0.7, width: w * 0.28, height: Math.max(1, tip - cone - b - w * 0.8) });
      st.wood.setAttribute('d', `M${f1(-w / 2)},${f1(tip - cone)} L${f1(w / 2)},${f1(tip - cone)} L0,${f1(tip)} Z`);
      st.wood.setAttribute('stroke-width', f1(o * 1.6));
      st.lead.setAttribute('d', `M${f1(-w * 0.17)},${f1(tip - cone * 0.34)} L${f1(w * 0.17)},${f1(tip - cone * 0.34)} L0,${f1(tip)} Z`);
      const v = dir(pr.ang);
      return [[arm.hand[0] + v[0] * tip, arm.hand[1] + v[1] * tip, w], [arm.hand[0] + v[0] * b, arm.hand[1] + v[1] * b, w]];
    },
  },

  // Rubber stamp (N08): a round knob in the hand, a wooden block, the inked rubber below.
  stamp: {
    build(g) {
      return { g, neck: sv('rect', { fill: '#7a6a55', stroke: OUT }, g), block: sv('rect', { fill: '#a58d6b', stroke: OUT }, g), blockL: sv('rect', { fill: '#bfa781' }, g),
        rubber: sv('rect', { fill: 'var(--accent)', stroke: OUT }, g), knob: sv('circle', { fill: '#8a765d', stroke: OUT }, g), knobL: sv('circle', { fill: '#a8916f' }, g) };
    },
    update(st, pr, arm, S) {
      const o = 0.012 * S, L = STAMP.len * S, bw = 0.3 * S, bh = 0.1 * S;
      place(st.g, arm.hand[0], arm.hand[1], pr.ang);
      set(st.neck, { x: -0.035 * S, y: 0, width: 0.07 * S, height: L - bh - 0.03 * S, 'stroke-width': 2 * o });
      set(st.block, { x: -bw / 2, y: L - bh - 0.035 * S, width: bw, height: bh, rx: 0.015 * S, 'stroke-width': 2 * o });
      set(st.blockL, { x: -bw / 2 + o, y: L - bh - 0.035 * S + o, width: bw * 0.42, height: bh * 0.35 });
      set(st.rubber, { x: -bw / 2 + 0.01 * S, y: L - 0.035 * S, width: bw - 0.02 * S, height: 0.035 * S, 'stroke-width': 1.6 * o });
      set(st.knob, { cx: 0, cy: 0, r: 0.07 * S, 'stroke-width': 2 * o });
      set(st.knobL, { cx: -0.022 * S, cy: -0.022 * S, r: 0.03 * S });
      const v = dir(pr.ang);
      return [[arm.hand[0] + v[0] * L, arm.hand[1] + v[1] * L, bw / 2]];
    },
  },

  // Magnifier (M16): the hand holds the handle; the lens shows the detail it is over, larger.
  magnifier: {
    build(g) {
      const lens = sv('g', {}, g);
      return { g, handle: sv('line', { stroke: OUT, 'stroke-linecap': 'round' }, g), handleF: sv('line', { stroke: '#3d3d3c', 'stroke-linecap': 'round' }, g), lens,
        glass: sv('circle', { fill: 'rgba(255,253,248,.93)' }, lens), text: sv('text', { 'text-anchor': 'middle', 'font-family': '"Inter Display","Inter",sans-serif', 'font-weight': 900 }, lens),
        sub: sv('text', { 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-weight': 700, fill: PAPER.muted }, lens),
        glare: sv('path', { fill: 'none', stroke: 'rgba(255,255,255,.95)', 'stroke-linecap': 'round' }, lens), ring: sv('circle', { fill: 'none', stroke: '#2b2b2a' }, lens), ringO: sv('circle', { fill: 'none', stroke: OUT }, lens) };
    },
    update(st, pr, arm, S) {
      const r = (pr.r || LENS.r) * S, o = 0.012 * S, v = dir(pr.ang), hl = LENS.handle * S;
      const [cx, cy] = lensOf(arm.hand, pr.ang, S, pr.r || LENS.r);
      const end = [arm.hand[0] - v[0] * 0.06 * S, arm.hand[1] - v[1] * 0.06 * S], neck = [arm.hand[0] + v[0] * hl, arm.hand[1] + v[1] * hl];
      set(st.handle, { x1: end[0], y1: end[1], x2: neck[0], y2: neck[1], 'stroke-width': 0.075 * S + 2 * o });
      set(st.handleF, { x1: end[0], y1: end[1], x2: neck[0], y2: neck[1], 'stroke-width': 0.075 * S });
      st.g.removeAttribute('transform');
      set(st.glass, { cx, cy, r });
      set(st.ring, { cx, cy, r, 'stroke-width': 0.05 * S });
      set(st.ringO, { cx, cy, r: r + 0.025 * S + o * 0.5, 'stroke-width': 2 * o });
      const fs = pr.size || Math.max(40, r * 0.55);
      set(st.text, { x: cx, y: cy + fs * 0.32 - (pr.sub ? fs * 0.22 : 0), 'font-size': fs, fill: pr.color || 'var(--accent)' });
      st.text.textContent = pr.text || '';
      st.sub.textContent = pr.sub || '';
      set(st.sub, { x: cx, y: cy + fs * 0.85, 'font-size': Math.max(34, fs * 0.38) });
      st.glare.setAttribute('d', `M${f1(cx - r * 0.62)},${f1(cy - r * 0.25)} A${f1(r * 0.7)},${f1(r * 0.7)} 0 0 1 ${f1(cx - r * 0.2)},${f1(cy - r * 0.66)}`);
      st.glare.setAttribute('stroke-width', f1(0.03 * S));
      st.lens.style.opacity = clamp(pr.lensO ?? 1).toFixed(3);
      return [[cx, cy, r + 0.03 * S], [end[0], end[1], 0.05 * S]];
    },
  },

  // A sign on a stick, held up: one or two short lines in real px.
  sign: {
    build(g) {
      return { g, stick: sv('line', { stroke: OUT, 'stroke-linecap': 'round' }, g), stickF: sv('line', { stroke: '#a58d6b', 'stroke-linecap': 'round' }, g),
        board: sv('rect', { fill: PAPER.card, stroke: OUT }, g), lines: [0, 1].map(() => sv('text', { 'text-anchor': 'middle', 'font-family': '"Inter Display","Inter",sans-serif', 'font-weight': 900, fill: PAPER.ink }, g)) };
    },
    update(st, pr, arm, S) {
      const o = 0.012 * S, w = pr.w || 300, hh = pr.h || 170, stick = (pr.stick || 0.5) * S;
      place(st.g, arm.hand[0], arm.hand[1], pr.ang ?? 180);
      set(st.stick, { x1: 0, y1: -0.08 * S, x2: 0, y2: stick, 'stroke-width': 0.05 * S + 2 * o });
      set(st.stickF, { x1: 0, y1: -0.08 * S, x2: 0, y2: stick, 'stroke-width': 0.05 * S });
      set(st.board, { x: -w / 2, y: stick, width: w, height: hh, rx: 18, 'stroke-width': 2 * o });
      const lines = pr.lines || [];
      st.lines.forEach((e, i) => {
        e.textContent = lines[i] || '';
        const fs = pr.size || 64;
        set(e, { x: 0, y: stick + hh / 2 + fs * 0.35 + (lines.length > 1 ? (i - 0.5) * fs * 1.05 : 0), 'font-size': fs });
        e.setAttribute('transform', `rotate(180 0 ${f1(stick + hh / 2)})`);
        e.style.fill = i === 1 && pr.accent2 ? 'var(--accent)' : PAPER.ink;
      });
      const v = dir(pr.ang ?? 180);
      return [[arm.hand[0] + v[0] * (stick + hh), arm.hand[1] + v[1] * (stick + hh), w / 2]];
    },
  },
};
