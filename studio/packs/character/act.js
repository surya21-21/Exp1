// The puppet's actions: pure functions of time that build a pose layer by layer.
// A scene's character(t) starts from stand(), then applies its timeline of actions in order;
// each action changes the pose from its start onward (a walk leaves him where it ends, a point
// hands the arm back). resolve() turns the result into the joint pose the rig draws.
// Craft rules followed (reel-director, Motion): every move eased; anticipation before, overshoot
// and settle after; arcs; squash of 5 to 8% for one frame on landings, body only; feet never slide.
import { fr, clamp, lerp, prog, outCubic, inCubic, inOutCubic, outBack, spring } from '../../../collection/lib/ease.js';
import { D, HIP_H, rot, dir, angOf, ik2 } from './rig.js';

export const inOutSine = p => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p));
const angDelta = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
export const angLerp = (a, b, w) => a + angDelta(a, b) * w;
const lerp2 = (a, b, w) => [lerp(a[0], b[0], w), lerp(a[1], b[1], w)];

// A weight that rises over inD before a, holds to b, and falls over outD after b.
export const env = (t, a, b = Infinity, inD = fr(4), outD = fr(6)) => {
  if (t < a - inD || t > b + outD) return 0;
  if (t < a) return inOutCubic(prog(t, a - inD, inD));
  if (t <= b) return 1;
  return 1 - inOutCubic(prog(t, b, outD));
};

export const REST_ARMS = [[-12, 9], [12, -9]];

// Standing still on the desk at ground point (x, y) with head size S.
export function stand(x, y, S) {
  return {
    x, y, S, o: 1, px: 0, lift: 0, tuck: 0, bob: 0, lean: 0, squash: 0, spread: 1, facing: 0,
    feet: null, knee: [-1, 1], thighK: [1, 1], legOrder: [0, 1],
    arms: REST_ARMS.map(a => a.slice()), armZ: ['front', 'front'], hands: ['mitt', 'mitt'], props: [],
    head: { tilt: 0, dx: 0, dy: 0, face: null, set: null, k: 1, o: 1, x: null, y: null },
    body: 1, fold: null, clip: null, shadow: 1, ground: null,
  };
}

// The joints the rig will use, for actions that aim at something.
export function pelvisOf(Q) { return [Q.x + (Q.px || 0), Q.y - Q.S * HIP_H - Q.lift + Q.bob]; }
export function shoulderOf(Q, i) {
  const [px, py] = pelvisOf(Q), sq = Q.squash || 0;
  const [rx, ry] = rot((i ? 1 : -1) * (D.shoulder - 0.045) * (1 + sq * 0.6), -(D.torso - 0.045) * (1 - sq), Q.lean || 0);
  return [px + rx * Q.S, py + ry * Q.S];
}
export function chinOf(Q) {
  const [px, py] = pelvisOf(Q), sq = Q.squash || 0;
  const [rx, ry] = rot(0, -D.torso * (1 - sq), Q.lean || 0);
  return [px + rx * Q.S + (Q.head.dx || 0) * Q.S, py + ry * Q.S - D.neck * Q.S + (Q.head.dy || 0) * Q.S];
}
// Where the hand of arm i would be for angles (a1, a2).
export function handOf(Q, i, a = Q.arms[i]) {
  const [sx, sy] = shoulderOf(Q, i), L = Q.lean * 0.3, u = dir(a[0] + L), v = dir(a[0] + a[1] + L), S = Q.S, r = D.hand * S;
  return [sx + u[0] * D.upper * S + v[0] * (D.fore * S + r * 0.55), sy + u[1] * D.upper * S + v[1] * (D.fore * S + r * 0.55)];
}
// Arm angles that put the hand of arm i on the target; the elbow bends toward (px, py).
export function armTo(Q, i, target, pref = [0, 1]) {
  const [sx, sy] = shoulderOf(Q, i), S = Q.S, l1 = D.upper * S, l2 = D.fore * S + D.hand * S * 0.55;
  const a = ik2(sx, sy, target[0], target[1], l1, l2, 1), b = ik2(sx, sy, target[0], target[1], l1, l2, -1);
  const score = r => (r.mx - sx) * pref[0] + (r.my - sy) * pref[1];
  const r = score(a) >= score(b) ? a : b;
  const L = Q.lean * 0.3, a1 = angOf(r.mx - sx, r.my - sy) - L, a2 = angDelta(a1 + L, angOf(r.ex - r.mx, r.ey - r.my));
  return [a1, a2];
}

// Breathing, a slow weight shift and small head moves, so a held pose is never frozen.
export function idle(Q, t, k = 1) {
  const br = Math.sin(t * 2 * Math.PI / 2.6), sw = Math.sin(t * 2 * Math.PI / 5.1 + 0.8);
  Q.squash += -0.012 * br * k;
  Q.px += 0.012 * Q.S * sw * k;
  Q.lean += 0.9 * sw * k;
  Q.arms[0][0] += -2.2 * br * k; Q.arms[1][0] += 2.2 * br * k;
  Q.head.tilt += (1.6 * Math.sin(t * 2 * Math.PI / 3.9 + 0.7) - 0.7 * sw) * k;
  Q.head.dy += -0.004 * br * k;
  return Q;
}

// ---- walk -------------------------------------------------------------------------------
// A walk from x0 to x1 between t0 and t1 (Williams: contact, down, passing, up). The feet are
// planted where they land and never slide: the legs reach them by IK. The first and last steps
// are short and low, so he eases into and out of the walk; the head leads before he goes and
// the body carries on a little after he stops.
export function walkPlan(o) {
  const { t0, t1, x0, x1, S } = o, y0 = o.y0, y1 = o.y1 ?? o.y0;
  const dn = Math.sign(x1 - x0) || 1, hg = 0.085 * S, dist = Math.abs(x1 - x0);
  let n = Math.max(2, 1 + Math.round(2 * Math.max(0, dist - 2 * hg) / ((o.step || 0.34) * S)));
  if (n % 2) n++;                                          // an even count ends with the feet the right way round
  const Q = new Array(n + 2);
  Q[0] = x0 - dn * hg; Q[1] = x0 + dn * hg; Q[n] = x1 - dn * hg; Q[n + 1] = x1 + dn * hg;
  for (let j = 2; j < n; j++) Q[j] = lerp(Q[1], Q[n], (j - 1) / (n - 1));
  const mids = []; for (let j = 0; j <= n; j++) mids.push((Q[j] + Q[j + 1]) / 2);
  const gy = x => (x1 === x0 ? y0 : lerp(y0, y1, clamp((x - x0) / (x1 - x0))));
  return { t0, t1, x0, x1, y0, y1, S, dn, n, Q, T: (t1 - t0) / n, mids, gy, b: dn > 0 ? 0 : 1, lift: o.lift ?? 0.085, antic: o.antic ?? fr(3), settle: o.settle ?? fr(8), arms: o.arms ?? 1, stepsAt: [] };
}
export function walkX(W, t) {
  const u = clamp((t - W.t0) / W.T, 0, W.n), j = Math.min(W.n - 1, Math.floor(u)), s = u - j;
  const m = k => (k <= 0 || k >= W.n ? 0 : (W.mids[k + 1] - W.mids[k - 1]) / 2);
  const p0 = W.mids[j], p1 = W.mids[j + 1], m0 = m(j), m1 = m(j + 1), s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * m1;
}
function footAt(W, i, t) {
  const first = i === W.b ? 1 : 2, u = (t - W.t0) / W.T;
  let x = W.Q[first - 1], roll = 0, lift = 0;
  for (let j = first; j <= W.n; j += 2) {
    const s = u - (j - 1);
    if (s <= 0) break;
    if (s < 1) {
      const e = s - Math.sin(2 * Math.PI * s) / (2 * Math.PI);          // leaves and lands at rest
      x = lerp(W.Q[j - 1], W.Q[j + 1], e);
      lift = W.lift * W.S * ((j === 1 || j === W.n) ? 0.55 : 1) * Math.sin(Math.PI * s);
      roll = s < 0.25 ? W.dn * 24 * (1 - s / 0.25) : s > 0.78 ? -W.dn * 16 * ((s - 0.78) / 0.22) : 0;
      break;
    }
    x = W.Q[j + 1];
    const since = (s - 1) * W.T;                                       // heel strike flattens in 2 frames
    roll = since < fr(2) ? -W.dn * 16 * (1 - since / fr(2)) : 0;
  }
  return [x, W.gy(x) - D.ankle * W.S - lift, roll, W.dn];
}
// moments the feet land, for footstep timing in scenes (seconds)
export const landings = W => Array.from({ length: W.n }, (_, j) => W.t0 + (j + 1) * W.T);

export function walk(Q, t, W) {
  if (t < W.t0 - W.antic) return Q;
  const S = W.S;
  if (t < W.t0) {                       // anticipation: the head turns first, the body dips and leans back
    const a = prog(t, W.t0 - W.antic, W.antic);
    Q.x = W.x0; Q.y = W.y0;
    Q.head.tilt += W.dn * 5 * a; Q.head.dx += W.dn * 0.025 * a;
    Q.lean += -W.dn * 3 * Math.sin(Math.PI * a);
    Q.bob += 0.014 * S * Math.sin(Math.PI * a);
    return Q;
  }
  if (t >= W.t1) {                      // arrived: the body carries on a little, then settles
    const s = prog(t, W.t1, W.settle);
    Q.x = W.x1; Q.y = W.y1;
    if (s < 1) {
      Q.lean += W.dn * 4.5 * Math.sin(Math.PI * s) * (1 - 0.4 * s);
      Q.bob += 0.018 * S * Math.sin(Math.PI * s);
      Q.head.tilt += W.dn * 4 * (1 - outCubic(s));
      Q.spread = lerp(0.35, 1, outCubic(s));
      Q.facing = s < 0.4 ? W.dn : 0;
      const ra = REST_ARMS;
      Q.arms = Q.arms.map((a, i) => [lerp(ra[i][0] - W.dn * 14, a[0], outCubic(s)), a[1]]);
    }
    return Q;
  }
  const u = (t - W.t0) / W.T, j = Math.min(W.n - 1, Math.floor(u)), s = u - j;
  const cruise = clamp(Math.min(u, W.n - u));
  Q.x = walkX(W, t); Q.y = W.gy(Q.x);
  Q.feet = [footAt(W, 0, t), footAt(W, 1, t)];
  Q.spread = lerp(1, 0.35, clamp(u * 1.5));
  Q.facing = W.dn;
  Q.knee = [W.dn, W.dn];
  Q.bob += 0.016 * S * Math.cos(2 * Math.PI * (s - 0.22)) * lerp(0.5, 1, cruise);   // down after contact, up before the next
  Q.lean += W.dn * 5 * cruise;
  // arms swing opposite the legs: the arm across from the swinging foot comes forward
  const swingFoot = (j + 1) % 2 ? W.b : 1 - W.b, oa = 1 - swingFoot;
  const A = 27 * lerp(0.45, 1, cruise) * W.arms, sw = -Math.cos(Math.PI * s) * W.dn * A;
  const fwd = x => clamp(x * W.dn / A);
  const arm = a => [a, W.dn * (6 + 26 * fwd(a))];
  const aw = clamp(u * 2) * (W.arms > 0 ? 1 : 0);
  const wa = [];
  wa[oa] = arm(sw); wa[1 - oa] = arm(-sw);
  Q.arms = Q.arms.map((a, i) => [angLerp(a[0], wa[i][0], aw), lerp(a[1], wa[i][1], aw)]);
  Q.head.tilt += W.dn * 3 + 1.6 * Math.sin(2 * Math.PI * s);
  Q.head.dy += -0.006 * Math.cos(2 * Math.PI * (s - 0.35));
  Q.head.dx += W.dn * 0.012;
  return Q;
}

// ---- hop and jump -----------------------------------------------------------------------
// From (x0, y0) to (x1, y1), taking off at t0 for dur seconds, apex h px above the higher end.
// Crouch first (anticipation), stretch on the way up, tuck at the top, squash on landing for
// one frame (body only), knees absorb, arms follow through.
export function hop(Q, t, H) {
  const S = Q.S, antic = H.antic ?? fr(4), settle = H.settle ?? fr(8);
  const dn = H.dn ?? (Math.sign(H.x1 - H.x0) || 0), t1 = H.t0 + H.dur;
  if (t < H.t0 - antic) return Q;
  const sqz = H.squash ?? 0.07;
  if (t < H.t0) {
    const a = outCubic(prog(t, H.t0 - antic, antic));
    Q.x = H.x0; Q.y = H.y0; Q.feet = null;
    Q.bob += 0.075 * S * a; Q.lean += dn * 5 * a;
    Q.arms = Q.arms.map((r, i) => [angLerp(r[0], (i ? 1 : -1) * 35 - dn * 25, a), lerp(r[1], (i ? -1 : 1) * 20, a)]);
    Q.head.dy += 0.02 * a;
    return Q;
  }
  if (t < t1) {
    const s = (t - H.t0) / H.dur, base = lerp(H.y0, H.y1, s);
    const peak = Math.min(H.y0, H.y1) - H.h;                         // a parabola through both ends and the apex
    const a = H.y0, c = H.y1, b = 2 * peak - (a + c) / 2;
    const y = (1 - s) * (1 - s) * a + 2 * s * (1 - s) * b + s * s * c;
    Q.x = lerp(H.x0, H.x1, s); Q.y = H.y1; Q.lift = H.y1 - y; Q.feet = null;
    Q.ground = H.ground != null ? H.ground : (s < 0.5 ? H.y0 : H.y1);
    Q.tuck = 0.11 * S * Math.sin(Math.PI * clamp(s * 1.2 - 0.1));
    Q.squash += -0.05 * Math.sin(Math.PI * clamp(s * 2.5)) * (s < 0.4 ? 1 : 0);   // stretch on the way up
    const up = Math.sin(Math.PI * clamp(s * 1.3));
    Q.arms = Q.arms.map((r, i) => [(i ? 1 : -1) * lerp(40, 150, up) + dn * 10, (i ? 1 : -1) * 15]);
    Q.lean += dn * 6 * (1 - s) - dn * 3 * s;
    Q.head.tilt += dn * 4 * Math.sin(Math.PI * s);
    void base;
    return Q;
  }
  // landed
  const s = prog(t, t1, settle);
  Q.x = H.x1; Q.y = H.y1; Q.feet = null;
  if (t < t1 + fr(1)) Q.squash += sqz;                                // one frame of squash
  if (s < 1) {
    const k = Math.sin(Math.PI * Math.min(1, s * 1.15)) * (1 - s * 0.5);
    Q.bob += 0.07 * S * k;
    Q.lean += dn * 4 * k;
    Q.arms = Q.arms.map((r, i) => [angLerp((i ? 1 : -1) * 40, r[0], outCubic(s)), lerp((i ? 1 : -1) * 15, r[1], outCubic(s))]);
    Q.head.dy += 0.025 * k;
  }
  return Q;
}

// ---- point, reach, tap ------------------------------------------------------------------
// The arm draws back 2 to 3 frames (a tenth of its travel) the other way, swings out past the
// target and settles; a finger comes out; the head turns toward the target; the arm goes back.
export function point(Q, t, o) {
  const pull = o.pull ?? fr(3), go = o.go ?? fr(7), out = o.out ?? fr(7), i = o.hand ?? 1;
  if (t < o.t0 - pull || t > o.t1 + out) return Q;
  const at = typeof o.at === 'function' ? o.at(t) : o.at;
  const sh = shoulderOf(Q, i), rest = Q.arms[i].slice();
  const goal = o.reach ? armTo(Q, i, at, o.pref || [0, 1]) : [angOf(at[0] - sh[0], at[1] - sh[1]) - Q.lean * 0.3 - (i ? -8 : 8), i ? -8 : 8];
  const d = angDelta(rest[0], goal[0]);
  const back = [rest[0] - d * 0.1, rest[1] + (i ? 10 : -10)];
  let a;
  if (t < o.t0) a = [angLerp(rest[0], back[0], inOutCubic(prog(t, o.t0 - pull, pull))), lerp(rest[1], back[1], inOutCubic(prog(t, o.t0 - pull, pull)))];
  else if (t <= o.t1) { const e = outBack(prog(t, o.t0, go), o.over ?? 1.9); a = [angLerp(back[0], goal[0], e), lerp(back[1], goal[1], clamp(e))]; }
  else { const e = inOutCubic(prog(t, o.t1, out)); a = [angLerp(goal[0], rest[0], e), lerp(goal[1], rest[1], e)]; }
  Q.arms[i] = a;
  if (t >= o.t0 && t < o.t1 + out * 0.4 && !o.reach) Q.hands[i] = 'point';
  const w = env(t, o.t0, o.t1, fr(4), out), side = Math.sign(at[0] - Q.x) || 1;
  if (o.look !== false) { Q.head.tilt += clamp((at[0] - Q.x) / (1.6 * Q.S), -1, 1) * 8 * w; Q.head.dx += side * 0.015 * w; }
  Q.lean += side * (o.lean ?? 2.5) * w;
  if (o.face && w > 0.5) Q.head.face = o.face;
  return Q;
}

// Both arms (or one) to fixed angles over a window, eased in and out.
export function armsTo(Q, t, o) {
  const w = env(t, o.t0, o.t1 ?? Infinity, o.in ?? fr(5), o.out ?? fr(6));
  if (!w) return Q;
  (o.arms || []).forEach((a, i) => { if (a) Q.arms[i] = [angLerp(Q.arms[i][0], a[0], w), lerp(Q.arms[i][1], a[1], w)]; });
  if (o.hands && w > 0.5) o.hands.forEach((m, i) => { if (m) Q.hands[i] = m; });
  return Q;
}

// One arm to a moving target (a prop's handle, a card's edge) by IK, eased in and out.
export function reach(Q, t, o) {
  const w = env(t, o.t0, o.t1 ?? Infinity, o.in ?? fr(5), o.out ?? fr(6));
  if (!w) return Q;
  const i = o.hand ?? 1, at = typeof o.at === 'function' ? o.at(t) : o.at;
  const g = armTo(Q, i, at, o.pref || [0, 1]);
  Q.arms[i] = [angLerp(Q.arms[i][0], g[0], w), lerp(Q.arms[i][1], g[1], w)];
  if (o.hand2 != null) Q.hands[i] = o.hand2;
  return Q;
}

// ---- head and face ----------------------------------------------------------------------
export function look(Q, t, o) {
  const w = env(t, o.t0, o.t1 ?? Infinity, o.in ?? fr(4), o.out ?? fr(6));
  if (!w) return Q;
  Q.head.tilt += (o.tilt || 0) * w; Q.head.dx += (o.dx || 0) * w; Q.head.dy += (o.dy || 0) * w;
  Q.lean += (o.lean || 0) * w;
  return Q;
}
export function face(Q, t, o) { if (t >= o.t0 && t < (o.t1 ?? Infinity)) Q.head.face = o.face; return Q; }

// ---- reactions ----------------------------------------------------------------------------
// 'leanBack' (whoa: the body rocks back, hands up, head tilts, a face), 'tilt' (a curious head tilt),
// 'shake' (no: the head swings left-right-left with the arms crossing), 'nod'.
export function react(Q, t, o) {
  const dur = o.dur ?? 0.7, w = env(t, o.t0, o.t0 + dur, o.in ?? fr(4), o.out ?? fr(7));
  if (!w) return Q;
  const dn = o.dn ?? 1, p = prog(t, o.t0, dur);
  if (o.kind === 'leanBack') {
    const e = spring(prog(t, o.t0 - fr(1), fr(10)), 0.8, 6);
    Q.lean += -dn * 11 * e * w; Q.px += -dn * 0.04 * Q.S * e * w;
    Q.head.tilt += -dn * 9 * e * w; Q.head.dy += -0.015 * w;
    Q.arms = Q.arms.map((a, i) => [angLerp(a[0], (i ? 1 : -1) * 70 - dn * 10, w * e), lerp(a[1], (i ? 1 : -1) * 70, w * e)]);
    Q.hands = ['mitt', 'mitt'];
  } else if (o.kind === 'tilt') {
    Q.head.tilt += (o.side ?? 1) * 12 * outBack(clamp(prog(t, o.t0, fr(6))), 1.6) * w;
    Q.lean += (o.side ?? 1) * 2 * w;
  } else if (o.kind === 'shake') {
    const sw = Math.sin(2 * Math.PI * p * (o.times ?? 1.5));
    Q.head.tilt += 11 * sw * w; Q.head.dx += 0.03 * sw * w;
    Q.lean += -3 * sw * w;
  } else if (o.kind === 'nod') {
    Q.head.dy += 0.03 * Math.sin(2 * Math.PI * p * 2) * w; Q.head.tilt += 3 * w;
  }
  if (o.face && w > 0.3) Q.head.face = o.face;
  return Q;
}

// ---- sit, carry, push, haul -------------------------------------------------------------
// Sitting on an edge at seat (x, y): the thighs come toward the camera (foreshortened), the
// shins hang and swing like two pendulums half a cycle apart, the hands rest on the edge.
export function sit(Q, t, o) {
  const w = env(t, o.t0, o.t1 ?? Infinity, o.in ?? fr(5), o.out ?? fr(5));
  if (!w) return Q;
  const S = Q.S, [sx, sy] = o.seat, sw = o.swing ?? 1, per = o.period ?? 1.05;
  const hipY = sy - 0.02 * S;
  const gx = sx, gy = hipY + S * HIP_H;                               // the ground point that puts the pelvis on the seat
  const sitQ = {
    x: gx, y: gy,
    feet: [0, 1].map(i => {
      const ph = 2 * Math.PI * (t / per) + (i ? Math.PI : 0), a = 0.55 * sw * Math.sin(ph);
      const len = (D.shin + 0.06) * S;
      return [sx + (i ? 1 : -1) * 0.09 * S + Math.sin(a) * len * 0.55, hipY + 0.07 * S + Math.cos(a) * len, -8 * Math.sin(a) * (i ? 1 : -1), 0];
    }),
  };
  Q.x = lerp(Q.x, sitQ.x, w); Q.y = lerp(Q.y, sitQ.y, w);
  const stanceFeet = Q.feet || [0, 1].map(i => [Q.x + (i ? 1 : -1) * 0.085 * S, Q.y - D.ankle * S - Q.lift, 0, Q.facing]);
  Q.feet = stanceFeet.map((f, i) => [lerp(f[0], sitQ.feet[i][0], w), lerp(f[1], sitQ.feet[i][1], w), lerp(f[2] || 0, sitQ.feet[i][2], w), w > 0.5 ? 0 : f[3]]);
  Q.thighK = [lerp(1, 0.32, w), lerp(1, 0.32, w)];
  Q.knee = [-1, 1];
  Q.spread = lerp(Q.spread, 1.1, w);
  Q.ground = sy; Q.shadow *= 1 - w;
  if (o.hands !== false) Q.arms = Q.arms.map((a, i) => [angLerp(a[0], (i ? 1 : -1) * 28, w), lerp(a[1], (i ? -1 : 1) * 14, w)]);
  Q.lean += 1.5 * Math.sin(2 * Math.PI * t / per) * w * sw;
  Q.head.tilt += 2.5 * Math.sin(2 * Math.PI * t / (per * 2) + 1) * w * sw;
  return Q;
}

// Holding something in front of the chest with both hands.
export function carry(Q, t, o) {
  return armsTo(Q, t, { t0: o.t0, t1: o.t1, in: o.in ?? fr(5), out: o.out ?? fr(5), arms: [[-18, 105], [18, -105]], hands: ['grip', 'grip'] });
}
// Pushing toward dn with both arms out and the body leaning in.
export function push(Q, t, o) {
  const w = env(t, o.t0, o.t1 ?? Infinity, o.in ?? fr(4), o.out ?? fr(6));
  if (!w) return Q;
  const dn = o.dn ?? 1;
  Q.lean += dn * 14 * w;
  Q.arms = Q.arms.map((a, i) => [angLerp(a[0], dn * (78 + (i ? 4 : -4)), w), lerp(a[1], dn * 8, w)]);
  Q.head.tilt += dn * 5 * w;
  return Q;
}
// Hauling a rope up hand over hand (dn = which side the rope is on).
export function haul(Q, t, o) {
  const w = env(t, o.t0, o.t1, o.in ?? fr(4), o.out ?? fr(6));
  if (!w) return Q;
  const dn = o.dn ?? 1, per = o.period ?? 0.36, ph = 2 * Math.PI * (t - o.t0) / per;
  Q.lean += -dn * 9 * w; Q.bob += 0.02 * Q.S * Math.abs(Math.sin(ph)) * w;
  Q.arms = Q.arms.map((a, i) => { const s = Math.sin(ph + (i ? Math.PI : 0)); return [angLerp(a[0], dn * (150 - 45 * s), w), lerp(a[1], dn * (10 + 25 * s), w)]; });
  Q.head.tilt += dn * 6 * w;
  return Q;
}

// The large avatar alone (the approved expression faces), as at the hook, "Save this" and the outro.
export function bigHead(Q, o) {
  Q.body = 0;
  Q.head = { ...Q.head, x: o.x, y: o.y, k: (o.size || 420) / Q.S, set: 'big', tilt: o.tilt || 0, face: o.face || null };
  return Q;
}

// ---- turn a high-level pose into the joint pose the rig draws ------------------------------
export function resolve(Q) {
  const S = Q.S;
  const feet = Q.feet || [0, 1].map(i => [Q.x + (i ? 1 : -1) * 0.085 * S, Q.y - D.ankle * S - Q.lift - (Q.tuck || 0), 0, Q.facing]);
  return {
    S, o: Q.o, pelvis: pelvisOf(Q), lean: Q.lean, squash: Q.squash, spread: Q.spread, facing: Q.facing,
    feet, knee: Q.knee, thighK: Q.thighK, legOrder: Q.legOrder, arms: Q.arms, armZ: Q.armZ, hands: Q.hands,
    head: Q.head, body: Q.body, fold: Q.fold, clip: Q.clip, shadow: Q.shadow, ground: Q.ground ?? (Q.lift > 0 ? null : Q.y), props: Q.props,
  };
}

export { lerp2 };
