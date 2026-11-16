// Transitions of the character pack: he causes the change or rides it.
// Each is make(overlay, ctx, info) => { lead, settle, both, sfx, gain, apply(p, out, inn, at, win), off(), character(p, win, A, B) }.
// A transition registers itself in ctx.shared.puppet.transitions[index] so the puppet layer can ask
// it for his pose across the window. apply() asks the same pose function, so the torn edge follows
// his hand and the card he throws is the card that fills the frame.
import { fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack, pulse } from '../../../collection/lib/ease.js';
import { P, h, tornLine, pts, W, H, cardCss } from '../../../collection/lib/paper.js';
import { solve, HIP_H, D } from './rig.js';
import { stand, hop, sit, armsTo, reach, resolve, look, face, env, angLerp } from './act.js';
import { cardRect } from './props.js';

const joints = Q => solve(resolve(Q));
const move = (el, x, y, extra = '') => { el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) ${extra}`; };
const reg = (ctx, info, tr) => { if (ctx.shared.puppet) ctx.shared.puppet.transitions[info.index] = tr; return tr; };
const timing = (info, lead, settle) => { const a = info.to.start - lead / 30, d = (lead + settle) / 30; return { a, d, at: p => a + p * d, pOf: t => (t - a) / d }; };
const poses = (win, info) => {
  const tA = win.t - info.from.start, tB = Math.max(0, win.t - info.to.start);
  return [win.A && win.A.character ? win.A.character(tA) : null, win.B && win.B.character ? win.B.character(tB) : null];
};
// Move and scale a whole pose about (ox, oy) to (tx, ty), as a camera would.
export function cameraPose(Q, ox, oy, z, tx = ox, ty = oy) {
  const X = x => tx + (x - ox) * z, Y = y => ty + (y - oy) * z;
  Q.x = X(Q.x); Q.y = Y(Q.y); Q.S *= z; Q.px *= z; Q.bob *= z; Q.lift *= z; Q.tuck *= z;
  if (Q.ground != null) Q.ground = Y(Q.ground);
  if (Q.feet) Q.feet = Q.feet.map(f => [X(f[0]), Y(f[1]), f[2], f[3]]);
  if (Q.head.x != null) Q.head.x = X(Q.head.x);
  if (Q.head.y != null) Q.head.y = Y(Q.head.y);
  Q.clip = null;
  return Q;
}

export const TRANSITIONS = {
  // R10 He tears the page away: he reaches for the right edge, grabs it and leaps across the
  // frame dragging it; the torn edge is wherever his hand is, the old page rolls up in his fist and
  // the next scene is underneath. Our signature tear (N01), with him as its cause. 18 frames.
  charTear(ov, ctx, info) {
    const lead = 10, settle = 8, T = timing(info, lead, settle);
    const rel = tornLine(0, -80, 0, H + 80, 31, 18, 34).map(([x, y]) => [x + (y - H / 2) * 0.06, y]);
    const under = ctx.shared.puppet ? ctx.shared.puppet.under : ov;
    const curl = h('div', 'position:absolute;left:0;top:-80px;width:56px;height:2080px;display:none;border-radius:28px;' +
      `background:linear-gradient(90deg,#c9b48d,#efe1c2 30%,#fbf3e2 48%,#e2cfa9 70%,#b49c74);box-shadow:-10px 10px 22px rgba(70,52,25,.4);transform-origin:28px 1040px`);
    under.append(curl);
    const grab = 0.07, fly = 0.62;
    const pose = (t, QA, QB) => {
      const p = T.pOf(t);
      if (!QA || !QB) return QB || QA;
      const x0 = QA.x, y0 = QA.y;
      if (p < grab) { reach(QA, t, { t0: T.a + fr(1), t1: 9, in: fr(3), hand: 1, at: [1040, y0 - 1.1 * QA.S], pref: [0, 1] }); look(QA, t, { t0: T.a, t1: 9, tilt: 8, dx: 0.03 }); return QA; }
      const Q = QB, t0 = T.at(grab) + fr(2), dur = T.d * (fly - grab) - fr(2), e = clamp((t - t0) / dur);
      Q.S = lerp(QA.S, QB.S, outCubic(e));
      hop(Q, t, { t0, dur, x0, y0, x1: QB.x, y1: QB.y, h: 150, antic: fr(2), settle: fr(9), squash: 0.08, arms: 0 });
      // the fist that holds the torn edge stays up and behind him as he goes
      const k = env(t, t0 - fr(2), T.at(fly) + fr(1), fr(2), fr(5));
      Q.arms[1] = [angLerp(Q.arms[1][0], 128, k), lerp(Q.arms[1][1], 22, k)];
      Q.arms[0] = [angLerp(Q.arms[0][0], -110, k), lerp(Q.arms[0][1], 30, k)];
      face(Q, t, { t0, t1: T.at(fly), face: 'grin' });
      return Q;
    };
    let lastX = 300;
    const xAt = (t, Q) => {
      const p = T.pOf(t);
      if (p < grab) return W + 60;
      if (p < fly) return Math.min(W + 60, joints(Q).arms[1].hand[0] + 6);
      return lerp(lastX, -140, inCubic(clamp((p - fly) / (1 - fly))));
    };
    return reg(ctx, info, {
      lead, settle, both: true, sfx: 'tear', gain: 0.9,
      apply(p, out, inn, at, win) {
        const [QA, QB] = poses(win, info);
        // where his fist was when he let go: the edge carries on from there
        const tl = T.at(fly) - fr(0.5);
        const [qa2, qb2] = poses({ ...win, t: tl }, info);
        lastX = Math.min(W + 60, joints(pose(tl, qa2, qb2)).arms[1].hand[0] + 6);
        const x = xAt(win.t, pose(win.t, QA, QB));
        const edge = rel.map(([dx, y]) => [x + dx, y]);
        const poly = a => `polygon(${a.map(q => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',')})`;
        inn.style.clipPath = poly([...edge, [W + 400, H + 80], [W + 400, -80]]);
        out.style.clipPath = poly([...edge, [-400, H + 80], [-400, -80]]);
        curl.style.display = x < W + 40 && x > -120 ? 'block' : 'none';
        curl.style.transform = `translateX(${(x - 30).toFixed(1)}px) rotate(3.4deg)`;
      },
      off() { curl.style.display = 'none'; },
      character(p, win, QA, QB) { return pose(win.t, QA, QB); },
    });
  },

  // R11 Card throw: he flicks the card in his hand at the camera; it spins, grows until it fills
  // the frame, the scenes swap behind it, and it lands as the next scene's card. 14 frames.
  charThrow(ov, ctx, info) {
    const lead = 6, settle = 8, T = timing(info, lead, settle);
    const el = h('div', `position:absolute;left:0;top:0;display:none;${cardCss(26)}transform-origin:0 0;overflow:hidden`);
    const num = h('div', `position:absolute;left:18px;top:14px;font:900 58px/1 "Inter Display","Inter",sans-serif;color:var(--accent)`);
    const txt = h('div', `position:absolute;left:18px;top:82px;right:16px;font:800 32px/1.12 Inter,sans-serif;color:${P.ink}`);
    el.append(num, txt);
    ov.append(el);
    const to = info.to.props && info.to.props.cardRect ? info.to.props.cardRect : [90, 760, 900, 680];
    return reg(ctx, info, {
      lead, settle, both: false, sfx: 'swoosh', gain: 0.8,
      apply(p, out, inn, at, win) {
        // the card leaves his hand where it was on the first frame of the throw
        const QA0 = win.A && win.A.character ? win.A.character(T.a - info.from.start) : null;
        const pr = QA0 && (QA0.props || []).find(q => q.kind === 'card');
        const r0 = pr ? cardRect(joints(QA0).arms[pr.hand ?? 1].hand, pr) : { x: 400, y: 900, w: 210, h: 170, rot: 0 };
        num.textContent = pr ? String(pr.n) : '1'; txt.innerHTML = pr ? pr.lines.join('<br>') : '';
        el.style.display = 'block';
        el.style.width = `${r0.w}px`; el.style.height = `${r0.h}px`;
        const pb = lead / (lead + settle);
        const cover = Math.max(W / r0.w, H / r0.h) * 1.15;
        let x, y, s, rot, o = 1;
        if (p < pb) {                                         // out of the hand, spinning, growing to fill the frame
          const e = inCubic(p / pb), cx = lerp(r0.x + r0.w / 2, W / 2, outCubic(p / pb)), cy = lerp(r0.y + r0.h / 2, H / 2, outCubic(p / pb)) - 120 * Math.sin(Math.PI * p / pb);
          s = lerp(1, cover, e); rot = lerp(r0.rot, -14, p / pb) + 0; x = cx - r0.w * s / 2; y = cy - r0.h * s / 2;
        } else {                                              // settles onto the next scene's card
          const q = (p - pb) / (1 - pb), e = outBack(q, 1.2), sw = lerp(cover, to[2] / r0.w, e), sh = lerp(cover, to[3] / r0.h, e);
          const cx = lerp(W / 2, to[0] + to[2] / 2, outCubic(q)), cy = lerp(H / 2, to[1] + to[3] / 2, outCubic(q));
          x = cx - r0.w * sw / 2; y = cy - r0.h * sh / 2; rot = lerp(-14, 0, outCubic(q)); s = null;
          el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sw.toFixed(4)},${sh.toFixed(4)})`;
          o = 1 - prog(q, 0.55, 0.45);
          num.style.opacity = txt.style.opacity = '0';
          el.style.opacity = o.toFixed(3);
          ctx.blur(el, 0, 0);
          return;
        }
        num.style.opacity = txt.style.opacity = (1 - prog(s, 2.2, 1.5)).toFixed(3);
        el.style.opacity = '1';
        el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
        ctx.blur(el, Math.min(10, 6 * p / pb), Math.min(10, 6 * p / pb));
      },
      off() { el.style.display = 'none'; },
      character(p, win, QA, QB) {
        const t = win.t;
        if (t < info.to.start || !QB) {                      // the throw: the arm whips forward and follows through
          if (!QA) return QB;
          const k = outCubic(prog(t, T.a, fr(3)));
          QA.props = (QA.props || []).filter(q => q.kind !== 'card');
          QA.arms[1] = [angLerp(QA.arms[1][0], 40, k), lerp(QA.arms[1][1], -30, k)];
          QA.lean += 6 * k; QA.head.face = 'grin';
          return QA;
        }
        return QB;
      },
    });
  },

  // R12 Lift: the page scrolls up (T17 timing); he jumps off the old ledge, lands on the top
  // edge of the next card as it rises under him, and rides it up into place, sitting. 18 frames.
  charLift(ov, ctx, info) {
    const lead = 8, settle = 10, T = timing(info, lead, settle);
    const ease = p => inOutCubic(clamp(p + 1 / 18));
    const seatY = info.to.props && info.to.props.seatY ? info.to.props.seatY : 820;
    const ledgeY = info.from.props && info.from.props.ledgeY ? info.from.props.ledgeY : 760;
    const offIn = t => H * (1 - ease(T.pOf(t))), offOut = t => -H * ease(T.pOf(t));
    const take = 0.08, land = 0.6;
    const pose = (t, QA, QB) => {
      if (!QA || !QB) return QB || QA;
      const p = T.pOf(t);
      if (p < take) { QA.y = ledgeY + offOut(t); QA.feet = null; return QA; }
      const t0 = T.at(take) + fr(1), t1 = T.at(land), x1 = QB.x, y1 = seatY + offIn(t1) + 0.02 * QB.S - 0.02 * QB.S;
      if (t < t1) {
        const Q = stand(QA.x, QA.y, QA.S);
        Q.S = lerp(QA.S, QB.S, clamp((t - t0) / (t1 - t0)));
        hop(Q, t, { t0, dur: t1 - t0, x0: QA.x, y0: ledgeY + offOut(t0), x1, y1, h: 90, antic: fr(2), settle: fr(2), squash: 0, arms: 0.7 });
        return Q;
      }
      // landed on the rising edge: sit and ride it up
      const Q = QB, dy = offIn(t);
      Q.y += dy; if (Q.feet) Q.feet = Q.feet.map(f => [f[0], f[1] + dy, f[2], f[3]]);
      if (Q.ground != null) Q.ground += dy;
      if (t < t1 + fr(1)) Q.squash += 0.06;
      Q.bob += 0.04 * Q.S * Math.sin(Math.PI * clamp((t - t1) / fr(6)));
      return Q;
    };
    return reg(ctx, info, {
      lead, settle, both: true, sfx: 'whoosh', gain: 0.75,
      apply(p, out, inn, at, win) {
        const a = ease(p), sp = Math.abs(a - ease(p - 1 / 18)) * H;
        move(out, 0, -H * a); move(inn, 0, H * (1 - a));
        ctx.blur(out, 0, Math.min(24, sp * 0.06)); ctx.blur(inn, 0, Math.min(24, sp * 0.06));
      },
      off() {},
      character(p, win, QA, QB) { return pose(win.t, QA, QB); },
    });
  },

  // R13 Hole hop: a hole is punched in the card beside him and the next scene shows through it
  // (N11); he hops in and drops through, then the hole opens to fill the frame and he climbs up
  // from behind the next scene's desk. 24 frames.
  charHole(ov, ctx, info) {
    const lead = 12, settle = 12, T = timing(info, lead, settle);
    const hp = (info.from.props && info.from.props.hole) || [690, 1080], R0 = 100;
    const cardR = (info.from.props && info.from.props.holeCard) || [100, 820, 960, 1420];
    const under = ctx.shared.puppet ? ctx.shared.puppet.under : ov;
    const ring = h('div', 'position:absolute;left:0;top:0;border-radius:50%;display:none;box-shadow:0 0 0 9px #fffdf8,inset 14px 18px 30px rgba(70,52,25,.45)');
    under.append(ring);
    const rAt = p => (p < 0.22 ? R0 * outBack(p / 0.22, 1.8) : p < 0.52 ? R0 : lerp(R0, 2300, inCubic(clamp((p - 0.52) / 0.33))));
    const take = 0.14, into = 0.42;
    const pose = (t, QA, QB) => {
      const p = T.pOf(t);
      if (!QA || !QB) return QB || QA;
      if (p < into + 0.12) {
        const t0 = T.at(take) + fr(2), t1 = T.at(into);
        if (p < take) { look(QA, t, { t0: T.a, t1: 9, tilt: -10, dy: 0.02 }); face(QA, t, { t0: T.a, face: 'curious' }); return QA; }
        const Q = stand(QA.x, QA.y, QA.S);
        if (t < t1) {
          hop(Q, t, { t0, dur: t1 - t0, x0: QA.x, y0: QA.y - 0.02 * QA.S, x1: hp[0], y1: hp[1] + 0.25 * QA.S, h: 110, antic: fr(3), squash: 0, arms: 0.8 });
        } else {                                              // dropping through, straight down
          Q.x = hp[0]; Q.y = hp[1] + 0.25 * QA.S + 2400 * Math.pow(t - t1, 2); Q.ground = 9999;
          Q.arms = [[-165, 5], [165, -5]];
        }
        // he is behind the card except where the hole is
        const r = rAt(p);
        Q.clip = `path(evenodd, "M-200 -200 H1300 V2200 H-200 Z M${cardR[0]} ${cardR[1]} H${cardR[2]} V${cardR[3]} H${cardR[0]} Z M${(hp[0] - r).toFixed(1)} ${hp[1]} a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0 Z")`;
        Q.clipY = cardR[1]; Q.noKey = true;
        return Q;
      }
      // in the next scene he climbs up from behind the desk
      const up = outBack(prog(p, 0.68, 0.32), 1.5);
      QB.bob += (1 - up) * 1.3 * QB.S; QB.lean += 6 * (1 - up);
      QB.arms = [[-150 * (1 - up) + QB.arms[0][0] * up, QB.arms[0][1]], [150 * (1 - up) + QB.arms[1][0] * up, QB.arms[1][1]]];
      if (up < 0.05) QB.o = 0;
      return QB;
    };
    return reg(ctx, info, {
      lead, settle, both: true, sfx: 'pop', gain: 0.8,
      apply(p, out, inn) {
        const r = rAt(p);
        inn.style.clipPath = `circle(${r.toFixed(1)}px at ${hp[0]}px ${hp[1]}px)`;
        out.style.webkitMaskImage = `radial-gradient(circle ${r.toFixed(1)}px at ${hp[0]}px ${hp[1]}px,transparent 99.6%,#000 100%)`;
        Object.assign(ring.style, { display: r > 2 ? 'block' : 'none', left: `${(hp[0] - r).toFixed(1)}px`, top: `${(hp[1] - r).toFixed(1)}px`, width: `${(2 * r).toFixed(1)}px`, height: `${(2 * r).toFixed(1)}px` });
      },
      off() { ring.style.display = 'none'; },
      character(p, win, QA, QB) { return pose(win.t, QA, QB); },
    });
  },

  // R14 Whip and land: the scene is thrown off to the left with him on it, blurred (T12); the
  // next scene whips in from the right and he flies in on an arc and lands with a squash and a
  // settle. 14 frames.
  charWhip(ov, ctx, info) {
    const lead = 4, settle = 10, T = timing(info, lead, settle);
    const xo = p => -1250 * inCubic(clamp((p + 1 / 14) / 0.32));
    const xi = p => 1250 * (1 - outBack(clamp((p + 1 / 14 - 0.22) / 0.5), 1.15));
    const landP = 0.74;
    const pose = (t, QA, QB) => {
      const p = T.pOf(t);
      if (p < 0.3) { if (!QA) return QB; const dx = xo(p); QA.x += dx; if (QA.feet) QA.feet = QA.feet.map(f => [f[0] + dx, f[1], f[2], f[3]]); QA.lean -= 14 * clamp(p / 0.3); QA.blur = [Math.min(30, Math.abs(xo(p) - xo(p - 1 / 14)) * 0.05), 0]; return QA; }
      if (!QB) return null;
      const dx = xi(p), q = clamp((p - 0.3) / (landP - 0.3));
      QB.x += dx * 0.85; QB.lift += p < landP ? 320 * Math.sin(Math.PI * q) * (1 - q * 0.3) : 0;
      if (QB.feet) QB.feet = QB.feet.map(f => [f[0] + dx * 0.85, f[1], f[2], f[3]]);
      QB.lean += p < landP ? -12 * (1 - q) : 0;
      QB.tuck += p < landP ? 0.1 * QB.S * Math.sin(Math.PI * q) : 0;
      QB.ground = QB.y;
      const s = prog(p, landP, 1 - landP);
      if (p >= landP && p < landP + 1 / 14) QB.squash += 0.08;
      if (p >= landP) { QB.bob += 0.08 * QB.S * Math.sin(Math.PI * s) * (1 - 0.4 * s); QB.lean += 5 * Math.sin(Math.PI * s); }
      QB.blur = [Math.min(30, Math.abs(xi(p) - xi(p - 1 / 14)) * 0.05), 0];
      return QB;
    };
    return reg(ctx, info, {
      lead, settle, both: true, sfx: 'swoosh', gain: 0.85,
      apply(p, out, inn) {
        move(out, xo(p), 0); move(inn, xi(p), 0);
        ctx.blur(out, Math.min(36, Math.abs(xo(p) - xo(p - 1 / 14)) * 0.06), 0);
        ctx.blur(inn, Math.min(36, Math.abs(xi(p) - xi(p - 1 / 14)) * 0.06), 0);
      },
      off() {},
      character(p, win, QA, QB) { return pose(win.t, QA, QB); },
    });
  },

  // R15 Push into his face: the camera accelerates toward his head (T05 ramp) for 10 frames,
  // blurring, until his head is the size and place of the large face in the next scene; hard cut.
  charPush(ov, ctx, info) {
    const lead = 10, settle = 0, T = timing(info, lead, settle);
    const tgt = (info.to.props && info.to.props.face) || [540, 906, 430];
    const zoomAt = (t, QA) => {
      const J = joints(QA), hx = J.chin[0], hy = J.chin[1] - 0.45 * J.HS;
      const e = inCubic(clamp(T.pOf(t) + 0.1));
      const z = lerp(1, tgt[2] / J.HS, e);
      return { hx, hy, z, tx: lerp(hx, tgt[0], e), ty: lerp(hy, tgt[1], e), e };
    };
    let lastZ = null;
    return reg(ctx, info, {
      lead, settle, both: false, sfx: 'riser', gain: 0.6,
      apply(p, out, inn, at, win) {
        const [QA] = poses(win, info);
        if (!QA) return;
        const c = zoomAt(win.t, QA); lastZ = c;
        out.style.transformOrigin = '0 0';
        out.style.transform = `translate(${(c.tx - c.hx * c.z).toFixed(1)}px,${(c.ty - c.hy * c.z).toFixed(1)}px) scale(${c.z.toFixed(4)})`;
        out.style.filter = `blur(${(6 * c.e * c.e).toFixed(1)}px)`;
      },
      off() {},
      character(p, win, QA, QB) {
        if (win.t >= info.to.start || !QA) return QB;
        const c = zoomAt(win.t, QA);
        const Q = cameraPose(QA, c.hx, c.hy, c.z, c.tx, c.ty);
        Q.blur = [3 * c.e * c.e, 3 * c.e * c.e];
        Q.noKey = true;
        void lastZ;
        return Q;
      },
    });
  },
};
