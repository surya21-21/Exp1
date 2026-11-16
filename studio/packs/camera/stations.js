// Camera pack: scene types. Each one is a station on the desk world's one big paper desk
// (K01). It builds its objects at its own place, registers how the camera rests there, and
// sets every object from the time alone, for any time in the reel (a station far away in the
// background is still drawn, so it must always be in a known state).
import * as THREE from '../../vendor/three.module.min.js';
import { fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack, outExpo, spring, pulse, rng } from '../../../collection/lib/ease.js';
import { reelFace } from '../../scenes3d.js';
import { v3, frame } from './world.js';
import * as B from './build.js';

const beat = (ctx, i, d) => (ctx.beats && ctx.beats[i] != null ? ctx.beats[i] : d);

export function need(ctx, type) {
  const W = ctx.shared && ctx.shared.world;
  if (!W) throw new Error(`scene type "${type}" needs the desk world: add "layers": ["deskWorld"] to reel.json`);
  return W;
}

// A group placed at the station's frame on the desk.
export function place(W, F) {
  const g = new THREE.Group();
  g.position.set(F.at[0], 0, F.at[1]);
  g.rotation.y = F.yaw;
  W.scene.add(g);
  return g;
}

// Camera keyframes in a station's own frame: [{ t, eye, look, fov }]. Each segment is one
// camera move, eased at both ends (Katz); a tiny breathing drift keeps a held shot alive.
export function keyed(F, K, tl, { breathe = 1, ease = inOutCubic } = {}) {
  let i = 0;
  while (i + 1 < K.length && tl >= K[i + 1].t) i++;
  const a = K[i], b = K[Math.min(i + 1, K.length - 1)];
  const p = b === a ? 0 : (b.ease || ease)(prog(tl, a.t, b.t - a.t));
  const dr = [0.03 * Math.sin(tl * 0.83) * breathe, 0.02 * Math.sin(tl * 1.17 + 1.3) * breathe, 0];
  return { eye: F.p(v3.add(v3.mix(a.eye, b.eye, p), dr)), look: F.p(v3.mix(a.look, b.look, p)), fov: lerp(a.fov, b.fov, p), roll: lerp(a.roll || 0, b.roll || 0, p) };
}

// A hinge: a child that turns about its own bottom edge (cards standing up, falling flat).
function hinge(child, hgt) {
  const g = new THREE.Group();
  g.add(child);
  child.position.y = hgt / 2;
  return g;
}

const ticks = (times, gain = 0.3) => times.map(t => ({ t, sfx: 'tick', gain }));

export const SCENES = {
  // K02 Hook at the odometer. A paper odometer is already rolling on frame 0 and lands on the
  // number on the second beat; on the first beat twelve reel cards stand up behind it, one
  // after another, while the camera pulls out to show them. The big avatar opens the reel and
  // becomes the cursor. Props: from, to, top, label, at, yaw, cursorAt.
  camHook(wrap, p, ctx) {
    const W = need(ctx, 'camHook'), F = frame(p.at || [0, 0], p.yaw || 0), G = place(W, F);
    const odo = B.odometer({ accent: ctx.accent, top: p.top || '12 VIRAL REELS', bottom: p.label || 'FRAMES STUDIED' });
    G.add(odo.group);
    const sh = B.contact(odo.PW * 1.25, 1.4, 0.38); sh.position.set(0.12, 0.002, -0.42); G.add(sh);
    const n = p.count || 12, CW = 0.56, CH = 1.0, cards = [];
    for (let i = 0; i < n; i++) {
      const c = B.card(CW, CH, 0.024, { front: reelFace(i, ctx.accent), res: 384 });
      const hg = hinge(c, CH);
      const a = lerp(-0.95, 0.95, n === 1 ? 0.5 : i / (n - 1)), R = 1.75;
      hg.position.set(R * Math.sin(a), 0, 0.15 - R * Math.cos(a));
      hg.rotation.order = 'YXZ';
      hg.rotation.y = -a;
      G.add(hg);
      cards.push(hg);
    }
    const props = [B.pencil(2.4, 0.05), B.tapeRoll(), B.eraser()];
    props[0].position.set(-1.25, 0, 2.3); props[0].rotation.y = 0.55;
    props[1].position.set(1.55, 0, 1.15); props[1].rotation.y = -0.5;
    props[2].position.set(-1.75, 0, 0.5); props[2].rotation.y = 0.35;
    props.forEach(q => G.add(q));
    const from = p.from ?? 11900, to = p.to ?? 18271;
    const tTwelve = beat(ctx, 0, 1.27), tLand = beat(ctx, 1, 4.45), tCursor = p.cursorAt ?? 0.85;
    const value = t => from + (to - from) * outExpo(prog(t + 0.12, 0, tLand + 0.12));
    const K = [
      { t: 0, eye: [0.32, 0.86, 4.6], look: [0, 0.5, 0], fov: 44 },
      { t: tTwelve - 0.12, eye: [0.24, 0.82, 4.25], look: [0, 0.5, 0], fov: 44 },               // creeping in while it counts
      { t: tTwelve + 0.42, eye: [0.75, 1.62, 6.3], look: [0, 0.82, -0.45], fov: 44 },           // pull-out: the twelve stand up
      { t: tLand - 0.2, eye: [-0.55, 1.5, 6.0], look: [0, 0.78, -0.45], fov: 44 },              // slow arc round to the left
      { t: tLand + 0.25, eye: [-0.4, 1.12, 4.95], look: [0, 0.58, -0.1], fov: 44 },             // push in as it lands
      { t: 99, eye: [-0.3, 1.18, 4.75], look: [0, 0.58, -0.1], fov: 44 },
    ];
    W.station(ctx.index, {
      update(tl) {
        const v = value(tl), sp = Math.abs(value(tl + fr(1)) - v), landed = tl + 0.12 >= tLand + 0.12;
        odo.update(landed ? to : v, sp, landed);
        odo.group.scale.setScalar(1 + 0.035 * pulse(tl, tLand, fr(1), fr(7)));
        cards.forEach((hg, i) => {
          const q = prog(tl, tTwelve + i * fr(2), fr(14));
          hg.rotation.x = lerp(-Math.PI / 2 + 0.02, -0.1, spring(q, 1.1, 5.2));
        });
      },
      view: tl => keyed(F, K, tl),
      avatar(tl) {
        const m = inOutCubic(prog(tl, tCursor, fr(10))), e = outCubic(prog(tl, -fr(2), fr(8)));
        const c = W.project(F.p([-odo.winW / 2 - 0.05, odo.cy + odo.winH / 2 + 0.12, 0.05]));
        const bx = lerp(540, c[0], m), by = lerp(1290 + (1 - e) * 60, c[1], m);
        return {
          bust: { x: bx, y: by, w: lerp(400, 150, m), o: e * (1 - clamp((m - 0.35) / 0.4)) },
          chip: { x: bx, y: by - lerp(44, 0, m), size: lerp(360, 116, m), o: clamp((m - 0.3) / 0.4), ring: prog(tl, tCursor + fr(10), fr(9)) },
        };
      },
    });
    W.proxy(ctx.index, wrap, 'counter', () => [F.p([-odo.winW / 2, odo.cy - odo.winH / 2, 0.05]), F.p([odo.winW / 2, odo.cy + odo.winH / 2, 0.05])]);
    const tk = [];
    let last = Math.floor(value(0) / 100);
    for (let t = fr(1); t < tLand - 0.1; t += fr(1)) { const k = Math.floor(value(t) / 100); if (k !== last && (!tk.length || t - tk[tk.length - 1] >= fr(2))) { tk.push(+t.toFixed(3)); last = k; } }
    return {
      update() {},
      lamp: () => { const q = W.project(F.p([0, 0.5, 0])); return { x: q[0], y: q[1], k: 0.8 }; },
      cues: [...ticks(tk.slice(0, 26), 0.3), { t: tCursor, sfx: 'swoosh', gain: 0.55 }, { t: tTwelve, sfx: 'whoosh', gain: 0.45 }, { t: tLand, sfx: 'impact', gain: 0.85 }],
    };
  },
};
