// R01 Paper puppet: a jointed body drawn in SVG under one of the approved heads.
// The body is new (the owner approves it). The heads are the locked brand images: only ever
// moved, scaled uniformly and rotated, never redrawn, recoloured, stretched or mirrored. The
// face shown comes from faceAt / bigFaceAt in collection/lib/avatar.js.
// solve(pose) is pure joint math that scenes can call too (so a pencil line lands exactly
// under the drawn pencil); draw(pose) only writes attributes. Nothing is remembered.
import { faceAt, bigFaceAt } from '../../../collection/lib/avatar.js';
import { clamp, lerp } from '../../../collection/lib/ease.js';
import { h } from '../../../collection/lib/paper.js';
import { PROPS } from './props.js';

const NS = 'http://www.w3.org/2000/svg';
export const sv = (tag, attrs = {}, parent = null) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.append(e);
  return e;
};
export const f1 = v => (Math.round(v * 10) / 10).toString();

// Body proportions in head sizes: S is the head image's box in px.
export const D = {
  torso: 0.40, shoulder: 0.205, hip: 0.16, neck: 0.05,
  upper: 0.165, fore: 0.15, hand: 0.052,
  thigh: 0.17, shin: 0.16, ankle: 0.036,
  armW: 0.078, legW: 0.094, out: 0.012,
  shoe: 0.13, shoeH: 0.07,
};
export const HIP_H = D.thigh + D.shin + D.ankle - 0.014;   // standing pelvis height, knees soft
export const HEIGHT = HIP_H + D.torso + D.neck + 0.91;      // ground to the top of the hair, in S

// Greys taken from the head images (skin #e8e9ea, hair #424141, outline near-black),
// each with one lighter tone for the side that faces the key light (top-left).
export const C = {
  out: '#151515', skin: '#e8e9ea', skinL: '#f8f8f8',
  shirt: '#3d3d3c', shirtL: '#565654', pants: '#8f8f8c', pantsL: '#a9a9a6',
  shoe: '#2a2a29', shoeL: '#4b4b49', sole: '#f2f1ee',
  phones: '#d9d9d8', phonesD: '#8e8e8c', phonesL: '#f4f4f3',
};

const SMALL = ['neutral', 'talk', 'blink', 'wink', 'grin', 'curious'];
const BIG = ['neutral', 'talk-a', 'talk-o', 'talk-e', 'blink', 'wink', 'interested', 'thinking', 'grin'];
// Where the chin meets the neck inside each image (fractions of the image box).
const PIV = { small: [0.527, 0.935], big: [0.53, 0.935] };
const BIG_K = 0.984;                       // the expression faces drawn 1.6% smaller so both sets match in width
// Faces a reaction may ask for, mapped to the set in use (curious exists only small; interested and thinking only big).
const MAP = { small: { interested: 'curious', thinking: 'curious' }, big: { curious: 'interested' } };

// rotate (x, y) by deg (screen coordinates: positive = clockwise)
export const rot = (x, y, deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [x * c - y * s, x * s + y * c]; };
// direction of a limb angle: 0 = straight down, +90 = screen right, 180 = up
export const dir = deg => { const r = deg * Math.PI / 180; return [Math.sin(r), Math.cos(r)]; };
export const angOf = (vx, vy) => Math.atan2(vx, vy) * 180 / Math.PI;

// Two-bone IK: root a, target t, lengths l1, l2; the middle joint bulges toward screen-x sign `bend`.
export function ik2(ax, ay, tx, ty, l1, l2, bend = 1) {
  const dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy) || 1e-6;
  const dc = clamp(d, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.9995);
  const a = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1));
  const s = Math.sin(a) >= 0 ? 1 : -1;                    // keeps "toward +x" meaning the same for limbs pointing up or down
  const a1 = a - bend * s * A;
  const mx = ax + l1 * Math.cos(a1), my = ay + l1 * Math.sin(a1);
  return { mx, my, ex: ax + dx / d * dc, ey: ay + dy / d * dc, reach: d / (l1 + l2) };
}

// The joints of a resolved pose, in stage px. Pure: scenes call it to know where a hand will be.
export function solve(P) {
  const S = P.S, lean = P.lean || 0, sq = P.squash || 0, [px, py] = P.pelvis;
  const fold = P.fold || { torso: 1, arms: 1, legs: 1 };
  const T = (x, y) => { const [rx, ry] = rot(x * (1 + sq * 0.6), y * (1 - sq), lean); return [px + rx * S, py + ry * S]; };
  const top = -D.torso * fold.torso;
  const neck = T(0, top);
  const shoulders = [T(-(D.shoulder - 0.045), top + 0.045 * fold.torso), T(D.shoulder - 0.045, top + 0.045 * fold.torso)];
  const spread = P.spread ?? 1;
  const hips = [T(-0.08 * spread, -0.03), T(0.08 * spread, -0.03)];
  const legs = [0, 1].map(i => {
    const ft = P.feet[i], [hx, hy] = hips[i], k = clamp(fold.legs);
    const tx = lerp(hx, ft[0], k), ty = lerp(hy + D.ankle * S, ft[1], k);
    const tk = (P.thighK ? P.thighK[i] : 1) * lerp(0.4, 1, k);
    const r = ik2(hx, hy, tx, ty, D.thigh * S * tk, D.shin * S * lerp(0.4, 1, k), (P.knee && P.knee[i]) || (i ? 1 : -1));
    return { hip: [hx, hy], knee: [r.mx, r.my], ankle: [r.ex, r.ey], roll: ft[2] || 0, facing: ft[3] != null ? ft[3] : (P.facing || 0) };
  });
  const arms = [0, 1].map(i => {
    const [a1, a2] = P.arms[i], [sx, sy] = shoulders[i], k = clamp(fold.arms);
    const u = dir(a1 + lean * 0.3), v = dir(a1 + a2 + lean * 0.3);
    const ex = sx + u[0] * D.upper * S * k, ey = sy + u[1] * D.upper * S * k;
    const wx = ex + v[0] * D.fore * S * k, wy = ey + v[1] * D.fore * S * k;
    const r = D.hand * S * lerp(0.3, 1, k);
    return { shoulder: [sx, sy], elbow: [ex, ey], wrist: [wx, wy], hand: [wx + v[0] * r * 0.55, wy + v[1] * r * 0.55], ang: a1 + a2 + lean * 0.3, r, v };
  });
  const hd = P.head || {};
  const HS = S * (hd.k || 1);
  const set = hd.set || (HS >= 300 ? 'big' : 'small');
  const chin = [hd.x != null ? hd.x : neck[0] + (hd.dx || 0) * S, hd.y != null ? hd.y : neck[1] - D.neck * S + (hd.dy || 0) * S];
  return { S, T, top, neck, shoulders, hips, legs, arms, chin, set, HS, tilt: (hd.tilt || 0) + lean * 0.5 };
}

let RIGS = 0;
export function makeRig(parent, { heads = '../brand/avatar/heads', exprs = '../brand/avatar/expressions' } = {}) {
  const gid = `pup${RIGS++}`;
  const root = h('div', 'position:absolute;left:0;top:0;width:1080px;height:1920px;display:none');
  root.dataset.rig = 'puppet';
  const fullSvg = () => sv('svg', { width: 1080, height: 1920, style: 'position:absolute;left:0;top:0;overflow:visible' });
  const shade = fullSvg();
  const body = h('div', 'position:absolute;inset:0');
  const back = fullSvg(), front = fullSvg();
  const headBox = h('div', 'position:absolute;left:0;top:0;width:0;height:0');
  body.append(back, headBox, front);
  root.append(shade, body);
  parent.append(root);

  // contact shadow on the desk: tight and dark under the feet, a little down-right of them (key light top-left)
  const rg = sv('radialGradient', { id: `${gid}-g` }, sv('defs', {}, shade));
  [[0, 0.4], [0.55, 0.2], [1, 0]].forEach(([o, a]) => sv('stop', { offset: o, 'stop-color': 'rgb(70,52,25)', 'stop-opacity': a }, rg));
  const contact = sv('ellipse', { fill: `url(#${gid}-g)` }, shade);
  // shirt: two flat greys split on the diagonal, lighter toward the top-left
  const lg = sv('linearGradient', { id: `${gid}-t`, x1: '0', y1: '0', x2: '1', y2: '.55' }, sv('defs', {}, back));
  sv('stop', { offset: '.42', 'stop-color': C.shirtL }, lg);
  sv('stop', { offset: '.42', 'stop-color': C.shirt }, lg);

  // a capsule = outline line, fill line, light line offset toward the light
  const capsule = (parent, fill, light) => ({
    o: sv('line', { stroke: C.out, 'stroke-linecap': 'round' }, parent),
    f: sv('line', { stroke: fill, 'stroke-linecap': 'round' }, parent),
    l: light ? sv('line', { stroke: light, 'stroke-linecap': 'round' }, parent) : null,
  });
  const setLine = (e, ax, ay, bx, by, w) => { e.setAttribute('x1', f1(ax)); e.setAttribute('y1', f1(ay)); e.setAttribute('x2', f1(bx)); e.setAttribute('y2', f1(by)); e.setAttribute('stroke-width', f1(Math.max(0.5, w))); };
  const drawCap = (c, [ax, ay], [bx, by], w, o) => {
    setLine(c.o, ax, ay, bx, by, w + 2 * o);
    setLine(c.f, ax, ay, bx, by, w);
    if (c.l) {
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-6;
      let nx = -dy / L, ny = dx / L;
      if (nx + ny > 0) { nx = -nx; ny = -ny; }
      const k = w * 0.2;
      setLine(c.l, ax + nx * k, ay + ny * k, bx + nx * k, by + ny * k, w * 0.38);
    }
  };
  const circ = (parent, fill) => sv('circle', { fill, stroke: C.out }, parent);
  const setC = (e, x, y, r, sw) => { e.setAttribute('cx', f1(x)); e.setAttribute('cy', f1(y)); e.setAttribute('r', f1(r)); if (sw != null) e.setAttribute('stroke-width', f1(sw)); };

  const backSlot = sv('g', {}, back);
  const legsG = sv('g', {}, back);
  const legs = [0, 1].map(() => ({ thigh: capsule(legsG, C.pants, C.pantsL), shin: capsule(legsG, C.pants, C.pantsL), shoe: capsule(legsG, C.shoe, C.shoeL), sole: sv('line', { stroke: C.sole, 'stroke-linecap': 'round' }, legsG) }));
  const waist = sv('path', { fill: C.pants, stroke: C.out, 'stroke-linejoin': 'round' }, back);
  const torso = sv('path', { fill: `url(#${gid}-t)`, stroke: C.out, 'stroke-linejoin': 'round' }, back);
  const hem = sv('path', { fill: 'none', stroke: 'rgba(0,0,0,.3)', 'stroke-linecap': 'round' }, back);
  const band = sv('path', { fill: 'none', stroke: C.out, 'stroke-linecap': 'round' }, back);
  const bandF = sv('path', { fill: 'none', stroke: C.phones, 'stroke-linecap': 'round' }, back);
  const neckC = capsule(back, C.skin, null);
  const cups = [0, 1].map(() => { const g = sv('g', {}, back); return { g, shell: sv('rect', { fill: C.phones, stroke: C.out }, g), pad: sv('rect', { fill: C.phonesD }, g), hi: sv('rect', { fill: C.phonesL }, g) }; });
  const frontSlot = sv('g', {}, front);
  const arms = [0, 1].map(() => {
    const g = sv('g', {});
    return { g, upper: capsule(g, C.shirt, C.shirtL), fore: capsule(g, C.skin, C.skinL), prop: sv('g', {}, g), hand: circ(g, C.skin), handL: sv('circle', { fill: C.skinL }, g), thumb: circ(g, C.skin), finger: capsule(g, C.skin, null), top: sv('g', {}, g) };
  });

  // the head: the approved images, one shown per frame (as collection/lib/avatar.js does)
  const sets = { small: { box: h('div', 'position:absolute;left:0;top:0;width:400px;height:400px;display:none'), img: {}, size: 400 },
    big: { box: h('div', 'position:absolute;left:0;top:0;width:500px;height:500px;display:none'), img: {}, size: 500 } };
  const loads = [];
  const addImgs = (set, names, dirp) => {
    const s = sets[set];
    for (const n of names) {
      const im = h('img', `position:absolute;left:0;top:0;width:${s.size}px;height:${s.size}px;display:none`);
      im.src = `${dirp}/${n}.png`;
      loads.push(im.decode().catch(() => null));
      s.box.append(im); s.img[n] = im;
    }
    s.box.style.transformOrigin = `${PIV[set][0] * s.size}px ${PIV[set][1] * s.size}px`;
    headBox.append(s.box);
  };
  addImgs('small', SMALL, heads);
  addImgs('big', BIG, exprs);

  const propState = {};   // built prop elements, by key

  return {
    el: root,
    ready: () => Promise.all(loads),
    // P: a resolved pose (act.js resolve). Returns the solved joints and the drawn box.
    draw(P, t = 0, speaking = false) {
      if (!P || (P.o ?? 1) <= 0.002) { root.style.display = 'none'; return null; }
      root.style.display = 'block';
      root.style.opacity = (P.o ?? 1).toFixed(3);
      const J = solve(P), S = P.S, o = D.out * S;
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      const grow = (x, y, r = 0) => { minX = Math.min(minX, x - r); maxX = Math.max(maxX, x + r); minY = Math.min(minY, y - r); maxY = Math.max(maxY, y + r); };
      const showBody = (P.body ?? 1) > 0.001;
      back.style.display = front.style.display = showBody ? 'block' : 'none';
      shade.style.display = showBody && (P.shadow ?? 1) > 0.01 ? 'block' : 'none';
      if (showBody) {
        // legs: the nearer leg is drawn last
        (P.legOrder || [0, 1]).forEach(i => { const L = legs[i]; legsG.append(L.thigh.o, L.thigh.f, L.thigh.l, L.shin.o, L.shin.f, L.shin.l, L.shoe.o, L.shoe.f, L.shoe.l, L.sole); });
        J.legs.forEach((g, i) => {
          const L = legs[i];
          drawCap(L.thigh, g.hip, g.knee, D.legW * S, o);
          drawCap(L.shin, g.knee, g.ankle, D.legW * S * 0.94, o);
          // the shoe runs heel to toe along the facing (end-on when facing the camera), turned by the foot's roll
          const f = g.facing, len = D.shoe * S, side = i ? 1 : -1;
          const toeV = f === 0 ? [side * 0.16 * len, 0] : [f * len * 0.78, 0], heelV = f === 0 ? [-side * 0.16 * len, 0] : [-f * len * 0.3, 0];
          const lift = (D.ankle - D.shoeH / 2 - D.out) * S;      // the sole touches the floor when the ankle is at its height
          const [tx, ty] = rot(toeV[0], toeV[1] + lift, g.roll), [hx, hy] = rot(heelV[0], heelV[1] + lift, g.roll);
          const sw = D.shoeH * S * (f === 0 ? 1.05 : 1);
          const A = [g.ankle[0] + hx, g.ankle[1] + hy], B = [g.ankle[0] + tx, g.ankle[1] + ty];
          drawCap(L.shoe, A, B, sw, o);
          const [sx, sy] = rot(0, sw * 0.34, g.roll);
          setLine(L.sole, A[0] + sx, A[1] + sy, B[0] + sx, B[1] + sy, sw * 0.2);
          grow(A[0], A[1], sw / 2 + o); grow(B[0], B[1], sw / 2 + o); grow(g.knee[0], g.knee[1], D.legW * S / 2 + o); grow(g.hip[0], g.hip[1], D.legW * S / 2);
        });
        const T = J.T, top = J.top;
        const w0 = T(-0.15, -0.075), w1 = T(0.15, -0.075), w2 = T(0.14, 0.035), w3 = T(-0.14, 0.035);
        waist.setAttribute('d', `M${f1(w0[0])},${f1(w0[1])} L${f1(w1[0])},${f1(w1[1])} L${f1(w2[0])},${f1(w2[1])} Q${f1((w2[0] + w3[0]) / 2)},${f1((w2[1] + w3[1]) / 2 + 0.03 * S)} ${f1(w3[0])},${f1(w3[1])} Z`);
        waist.setAttribute('stroke-width', f1(2 * o));
        const pts = [[-D.shoulder, top + 0.075], [-D.shoulder + 0.01, top + 0.005], [-0.1, top], [0.1, top], [D.shoulder - 0.01, top + 0.005], [D.shoulder, top + 0.075], [D.hip, -0.045], [D.hip - 0.02, 0.012], [-D.hip + 0.02, 0.012], [-D.hip, -0.045]].map(([x, y]) => T(x, y));
        const q = (a, b) => `${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])}`;
        const mid = [(pts[7][0] + pts[8][0]) / 2, (pts[7][1] + pts[8][1]) / 2];
        torso.setAttribute('d', `M${f1(pts[0][0])},${f1(pts[0][1])} Q${q(pts[1], pts[2])} L${f1(pts[3][0])},${f1(pts[3][1])} Q${q(pts[4], pts[5])} L${f1(pts[6][0])},${f1(pts[6][1])} Q${q(pts[7], mid)} Q${q(pts[8], pts[9])} Z`);
        torso.setAttribute('stroke-width', f1(2 * o));
        const hm0 = T(-D.hip + 0.03, -0.014), hm1 = T(D.hip - 0.03, -0.014);
        hem.setAttribute('d', `M${f1(hm0[0])},${f1(hm0[1])} L${f1(hm1[0])},${f1(hm1[1])}`); hem.setAttribute('stroke-width', f1(o * 0.9));
        pts.forEach(p => grow(p[0], p[1], o));
        // headphones round the neck: the band behind the neck, a cup resting on each collarbone
        const b0 = T(-0.125, top + 0.02), b1 = T(0.125, top + 0.02), bc = T(0, top + 0.105);
        const bd = `M${f1(b0[0])},${f1(b0[1])} Q${q(bc, b1)}`;
        band.setAttribute('d', bd); band.setAttribute('stroke-width', f1(0.034 * S + 2 * o));
        bandF.setAttribute('d', bd); bandF.setAttribute('stroke-width', f1(0.034 * S));
        drawCap(neckC, [J.neck[0], J.neck[1] + 0.01 * S], [lerp(J.neck[0], J.chin[0], 0.6), J.chin[1]], 0.1 * S, o);
        cups.forEach((c, i) => {
          const s = i ? 1 : -1, [cx, cy] = T(s * 0.14, top + 0.03), cw = 0.105 * S, ch = 0.135 * S;
          c.g.setAttribute('transform', `translate(${f1(cx)},${f1(cy)}) rotate(${f1((P.lean || 0) + s * 18)})`);
          const set = (e, a) => { for (const k in a) e.setAttribute(k, f1(a[k])); };
          set(c.shell, { x: -cw / 2, y: -ch / 2, width: cw, height: ch, rx: cw * 0.42, 'stroke-width': 2 * o });
          set(c.pad, { x: s < 0 ? cw * 0.02 : -cw * 0.5, y: -ch * 0.36, width: cw * 0.48, height: ch * 0.72, rx: cw * 0.22 });
          set(c.hi, { x: s < 0 ? -cw * 0.36 : -cw * 0.38 + cw * 0.5 - cw * 0.22, y: -ch * 0.38, width: cw * 0.2, height: ch * 0.28, rx: cw * 0.1 });
        });
        // arms: FK from the shoulder; a mitten hand with a thumb, a finger when pointing
        J.arms.forEach((g, i) => {
          const A = arms[i], k = clamp((P.fold || {}).arms ?? 1);
          const slot = (P.armZ && P.armZ[i] === 'back') ? backSlot : frontSlot;
          if (A.g.parentNode !== slot) slot.append(A.g);
          drawCap(A.upper, g.shoulder, g.elbow, D.armW * S * lerp(0.6, 1, k), o);
          drawCap(A.fore, g.elbow, g.wrist, D.armW * S * 0.86 * lerp(0.6, 1, k), o);
          const mode = (P.hands && P.hands[i]) || 'mitt', [hx, hy] = g.hand, r = g.r;
          const pointing = mode === 'point';
          A.finger.o.style.display = A.finger.f.style.display = pointing ? 'inline' : 'none';
          if (pointing) drawCap(A.finger, g.hand, [hx + g.v[0] * r * 1.6, hy + g.v[1] * r * 1.6], r * 0.62, o);
          setC(A.hand, hx, hy, r, 2 * o);
          setC(A.handL, hx - r * 0.28, hy - r * 0.3, r * 0.5);
          const side = i ? 1 : -1, [tx, ty] = rot(side * r * 0.78, -r * 0.2, g.ang);
          setC(A.thumb, hx + tx, hy + ty, r * 0.42, 2 * o);
          A.thumb.style.display = mode === 'grip' ? 'none' : 'inline';
          grow(hx, hy, r + o); grow(g.elbow[0], g.elbow[1], D.armW * S / 2 + o);
          if (pointing) grow(hx + g.v[0] * r * 1.6, hy + g.v[1] * r * 1.6, r * 0.4);
        });
        // contact shadow: shrinks and fades as the feet leave the desk
        const gy = P.ground ?? Math.max(P.feet[0][1], P.feet[1][1]) + D.ankle * S;
        const air = clamp((gy - D.ankle * S - Math.max(J.legs[0].ankle[1], J.legs[1].ankle[1])) / (0.5 * S));
        const cx = (J.legs[0].ankle[0] + J.legs[1].ankle[0]) / 2 + 0.07 * S;
        contact.setAttribute('cx', f1(cx)); contact.setAttribute('cy', f1(gy + 0.008 * S));
        contact.setAttribute('rx', f1((0.34 + 0.08 * (P.spread ?? 1)) * S * (1 - 0.45 * air))); contact.setAttribute('ry', f1(0.065 * S * (1 - 0.3 * air)));
        contact.setAttribute('opacity', (clamp(P.shadow ?? 1) * (1 - 0.6 * air)).toFixed(3));
      }
      // props: drawn in the hand's own group so they share its depth; 'top' sits over the mitten
      const used = new Set();
      for (const pr of P.props || []) {
        const key = pr.key || pr.kind;
        used.add(key);
        if (!propState[key]) propState[key] = PROPS[pr.kind].build(sv('g', { 'data-prop': key }));
        const st = propState[key], arm = arms[pr.hand ?? 1];
        const parent = pr.over ? arm.top : arm.prop;
        if (st.g.parentNode !== parent) parent.append(st.g);
        st.g.style.display = 'inline';
        const b = PROPS[pr.kind].update(st, pr, J.arms[pr.hand ?? 1], S, J);
        if (b) b.forEach(([x, y, r]) => grow(x, y, r));
      }
      for (const k in propState) if (!used.has(k)) propState[k].g.style.display = 'none';

      // the head: chin on the neck, uniform scale and rotation only
      const hd = P.head || {}, set = J.set, other = set === 'big' ? 'small' : 'big', s = sets[set];
      sets[other].box.style.display = 'none';
      s.box.style.display = (hd.o ?? 1) > 0.002 ? 'block' : 'none';
      s.box.style.opacity = (hd.o ?? 1).toFixed(3);
      const forced = hd.face ? (MAP[set][hd.face] || hd.face) : null;
      const want = set === 'big' ? bigFaceAt(t, speaking, forced) : faceAt(t, speaking, forced);
      for (const n in s.img) s.img[n].style.display = n === want ? 'block' : 'none';
      const sc = (set === 'big' ? BIG_K : 1) * J.HS / s.size, [pvx, pvy] = PIV[set];
      s.box.style.transform = `translate(${(J.chin[0] - pvx * s.size).toFixed(1)}px,${(J.chin[1] - pvy * s.size).toFixed(1)}px) rotate(${J.tilt.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      grow(J.chin[0] - 0.43 * J.HS, J.chin[1] - 0.915 * J.HS); grow(J.chin[0] + 0.43 * J.HS, J.chin[1] + 0.045 * J.HS);
      // the lifted paper casts a soft shadow down and to the right
      body.style.filter = `drop-shadow(${f1(0.02 * S)}px ${f1(0.034 * S)}px ${f1(0.03 * S)}px rgba(70,52,25,.26))`;
      root.style.clipPath = P.clip || 'none';
      return { J, face: want, box: { x0: minX, y0: minY, x1: maxX, y1: maxY } };
    },
  };
}
