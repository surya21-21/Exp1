// Scene types of the character pack. Each is (wrap, props, ctx) => { update(t), character(t), lamp(t), cues }.
// character(t) is the puppet's pose at t (see act.js). The scene's own update(t) asks the same
// timeline where his hands are (solve), so the pencil line, the stamp, the thrown card and the
// muted speaker all land where he actually is: he causes what happens.
import { fr, clamp, lerp, prog, outCubic, inCubic, inOutCubic, outBack, spring, pulse, rng } from '../../../collection/lib/ease.js';
import { P, h, abs, card, cardCss } from '../../../collection/lib/paper.js';
import * as E from '../../../collection/lib/elements.js';
import { D, HIP_H, solve, sv, dir } from './rig.js';
import { PENCIL, tipOf } from './props.js';
import { stand, idle, walk, walkPlan, walkX, hop, point, sit, react, look, face, armsTo, reach, carry, push, resolve, bigHead, angLerp, env, REST_ARMS } from './act.js';

const { DISPLAY, SANS, SERIF } = E;
const beat = (ctx, i, d) => (ctx.beats && ctx.beats[i] != null ? ctx.beats[i] : d);
const joints = Q => solve(resolve(Q));
const rise = (el, e, dy = 40) => { el.style.opacity = clamp(e).toFixed(3); el.style.transform = `translateY(${((1 - e) * dy).toFixed(1)}px)`; };
const pop = (el, p, from = 0.5, s = 2.2) => { el.style.opacity = clamp(p * 3).toFixed(3); el.style.transform = `scale(${(p <= 0 ? from : lerp(from, 1, outBack(clamp(p), s))).toFixed(4)})`; };
const kick = (text, x, y, w) => h('div', abs(x, y, w, null, `font:800 30px/1 ${SANS};letter-spacing:4px;text-transform:uppercase;color:${P.muted}`), text);

// R09 Tally counter: number wheels in paper windows that roll like an odometer (the carry
// turns the next wheel only as the one below passes 9). update(v, speed) — v may fall too.
export function tally(places, { w = 112, hh = 164, gap = 10, comma = true } = {}) {
  const el = h('div', `display:flex;align-items:flex-end;justify-content:center;gap:${gap}px;width:fit-content;margin:0 auto`);
  const wheels = [];
  for (let i = places - 1; i >= 0; i--) {
    const win = h('div', `position:relative;width:${w}px;height:${hh}px;overflow:hidden;border-radius:${Math.round(w * 0.16)}px;background:linear-gradient(180deg,#e9e3d6,${P.card} 22%,${P.card} 78%,#e4ddcf);box-shadow:inset 0 6px 10px rgba(70,52,25,.28),inset 0 -6px 10px rgba(70,52,25,.22),4px 6px 12px ${P.shadowSoft}`);
    const strip = h('div', `position:absolute;left:0;top:0;width:100%;text-align:center;font:900 ${Math.round(hh * 0.74)}px/${hh}px ${DISPLAY};letter-spacing:-2px;color:${P.ink}`);
    for (let d = 0; d <= 10; d++) strip.append(h('div', `height:${hh}px`, String(d % 10)));
    win.append(strip);
    el.append(win);
    wheels.push({ win, strip, unit: Math.pow(10, i) });
    if (comma && i === 3) el.append(h('div', `font:900 ${Math.round(hh * 0.5)}px/1 ${DISPLAY};color:${P.ink};margin:0 -4px ${Math.round(hh * 0.08)}px`, ','));
  }
  return {
    el,
    update(v, speed = 0, bump = 0) {
      for (const k of wheels) {
        const lower = v % k.unit, pos = (Math.floor(v / k.unit + 1e-9) % 10) + (k.unit === 1 ? v - Math.floor(v) : clamp(lower - (k.unit - 1)));
        k.strip.style.transform = `translateY(${(-pos * hh).toFixed(1)}px)`;
        const sp = Math.abs(speed) / k.unit;
        k.strip.style.filter = sp > 0.4 ? `blur(${Math.min(5, sp * 1.2).toFixed(1)}px)` : 'none';
        k.win.style.transform = `scale(${(1 + 0.08 * bump).toFixed(4)})`;
      }
    },
  };
}

// A small speech bubble (for "start talking at frame zero").
const bubble = (size = 52) => h('div', `position:relative;width:${size}px;height:${size * 0.8}px`,
  `<svg viewBox="0 0 100 80" width="${size}" height="${size * 0.8}" style="overflow:visible"><path d="M12 6 H88 Q96 6 96 14 V46 Q96 54 88 54 H40 L22 72 L26 54 H12 Q4 54 4 46 V14 Q4 6 12 6 Z" fill="${P.card}" stroke="${P.ink}" stroke-width="6" stroke-linejoin="round"/><circle cx="32" cy="30" r="6" fill="var(--accent)"/><circle cx="50" cy="30" r="6" fill="var(--accent)"/><circle cx="68" cy="30" r="6" fill="var(--accent)"/></svg>`);

// A speaker with sound waves; mute(p) crosses it out.
function speaker(size = 70) {
  const el = h('div', `position:absolute;width:${size}px;height:${size}px`,
    `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="overflow:visible"><path d="M14 38 H32 L54 18 V82 L32 62 H14 Z" fill="${P.graphite}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>` +
    `<g class="w" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"><path d="M64 36 Q74 50 64 64"/><path d="M74 26 Q90 50 74 74"/></g>` +
    `<g class="x" stroke="${P.ink}" stroke-width="8" stroke-linecap="round" opacity="0"><path d="M66 38 L88 62 M88 38 L66 62"/></g></svg>`);
  const w = el.querySelector('.w'), x = el.querySelector('.x');
  return { el, update(loud, mute) {
    w.style.opacity = (1 - clamp(mute * 2)).toFixed(3);
    w.setAttribute('transform', `translate(60 50) scale(${(1 + 0.25 * loud).toFixed(3)}) translate(-60 -50)`);
    x.setAttribute('opacity', clamp(mute * 2 - 0.6).toFixed(3));
    el.style.opacity = (1 - 0.35 * clamp(mute)).toFixed(3);
  } };
}

// ---- adapters: the puppet's part in engine scene types that have no character() ------------------
export const ADAPT = {
  // The outro (cta): the large approved face waits low on the left, looking up at the keyword,
  // and becomes the picture in the sign-off card; it grins once Follow is tapped.
  cta(t, sc) {
    const b = sc.beats || [], tType = b[0] ?? 0.5, tSign = b[1] ?? 2.6, tFollow = tSign + 0.75;
    const Q = stand(226, 1700, 280);
    const settle = spring(prog(t, -fr(4), fr(14)), 0.8, 6);
    const tilt = t < tSign - 0.2 ? lerp(-6, 4, settle) + 2 * Math.sin(t * 2.4) : -2 + 3 * pulse(t, tFollow, fr(3), fr(10));
    bigHead(Q, { x: 226, y: 1431 - 10 * pulse(t, tSign - fr(5), fr(5), fr(8)), size: 280, tilt, face: t > tFollow ? 'grin' : t < tType + 0.1 ? 'interested' : null });
    return Q;
  },
};

export const SCENES = {
  // R02 Unfold and count (hook). Frame 0: the large approved face talks under a tally counter
  // already rolling. On "twelve" the head flies down to the first of twelve reels and his body
  // unfolds under it in parts (torso, arms, legs, 2 frames apart). He hops across the reels,
  // each one dips and lights as he lands and its frames roll onto the counter; a high jump and
  // a stomp on reel 12 land 18,271 on "eighteen thousand".
  charHook(wrap, p, ctx) {
    const S = 170, TOP = 1210, N = 12;
    const frames = p.frames || [1184, 1303, 859, 1286, 1197, 1682, 2712, 1272, 2508, 1109, 981, 2178];
    const cum = [0]; frames.forEach(f => cum.push(cum[cum.length - 1] + f));
    const CX = k => 120 + (k - 1) * (780 / 11);
    const cnt = tally(5, { w: 118, hh: 172 });
    const box = h('div', abs(0, 470, 1080, 190, 'display:flex;justify-content:center')); box.append(cnt.el); cnt.el.dataset.key = 'counter';
    const label = h('div', abs(60, 668, 960, null, `text-align:center;font:900 68px/1.05 ${DISPLAY};letter-spacing:-1.5px;color:${P.ink}`), p.label || 'frames studied');
    const sub = h('div', abs(60, 748, 960, null, `text-align:center;font:italic 600 44px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    const chips = h('div', abs(60, 838, 960, null, 'display:flex;gap:22px;justify-content:center'));
    const chipEls = (p.chips || []).map(tx => { const e = E.chip(tx, { dot: true, size: 40 }); chips.append(e); return e; });
    const cards = Array.from({ length: N }, (_, i) => {
      const c = h('div', abs(CX(i + 1) - 31, TOP, 62, 112, `${cardCss(14)}display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:10px`));
      const dot = h('div', 'position:absolute;left:21px;top:12px;width:20px;height:20px;border-radius:50%;background:var(--accent);opacity:0');
      const num = h('div', `font:900 32px/1 ${DISPLAY};letter-spacing:-1px;color:#b4ad9f`, String(i + 1).padStart(2, '0'));
      c.append(dot, num);
      return { c, dot, num };
    });
    wrap.append(box, label, sub, chips, ...cards.map(k => k.c));
    const B0 = beat(ctx, 0, 1.26), B1 = beat(ctx, 1, 4.45);
    const FLY = fr(11), U0 = B0 + FLY, LAND1 = U0 + fr(10);
    // hops 2..11 at a steady pace, then a high jump that stomps reel 12 on the second beat
    const H12 = { t0: B1 - 0.34, dur: 0.34 };
    const first = LAND1 + fr(5), gap = (H12.t0 - fr(3) - first) / 10;
    const hops = Array.from({ length: 10 }, (_, i) => ({ k: i + 2, t0: first + i * gap, dur: gap * 0.7 }));
    const L = [null, LAND1, ...hops.map(o => o.t0 + o.dur), B1];
    const chinF = [CX(1), TOP - (HIP_H + D.torso + D.neck) * S];
    const value = t => {
      if (t < LAND1) return lerp(260, cum[1], outCubic(clamp(t / LAND1)));
      let k = 1; for (let j = 2; j <= N; j++) if (t >= L[j]) k = j;
      return k === 1 ? cum[1] : lerp(cum[k - 1], cum[k], outCubic(prog(t, L[k], fr(5))));
    };
    const character = t => {
      if (t < U0) {                                   // the large avatar alone, then the flight down to reel 1
        const Q = stand(chinF[0], TOP, S), e = inOutCubic(prog(t, B0, FLY));
        const x = lerp(540, chinF[0], e), y = lerp(1236, chinF[1], e) - 170 * Math.sin(Math.PI * e);
        bigHead(Q, { x, y, size: lerp(400, S, e), tilt: -16 * Math.sin(Math.PI * e) + (1 - e) * 2 * Math.sin(t * 2.2), face: null });
        Q.head.set = null;
        return Q;
      }
      if (t < LAND1 + fr(1)) {                        // the body unfolds under the head, in parts
        const kT = outBack(prog(t, U0, fr(6)), 1.6), kA = outBack(prog(t, U0 + fr(2), fr(6)), 1.8), kL = outCubic(prog(t, U0 + fr(4), fr(6)));
        const Q = stand(chinF[0], 0, S);
        const pelvisY = chinF[1] + (D.neck + D.torso * kT) * S;
        Q.y = pelvisY + S * HIP_H;
        Q.fold = { torso: Math.max(0.02, kT), arms: kA, legs: kL };
        Q.body = kT > 0.03 ? 1 : 0;
        Q.arms = [[-12 - 60 * (1 - kA), 9], [12 + 60 * (1 - kA), -9]];
        Q.ground = TOP; Q.shadow = kL;
        if (t >= LAND1) Q.squash = 0.07;
        return Q;
      }
      const Q = stand(CX(1), TOP, S);
      idle(Q, t);
      // land on reel 1: knees absorb
      const s = prog(t, LAND1, fr(6)); if (s < 1) Q.bob += 0.06 * S * Math.sin(Math.PI * s);
      for (const o of hops) hop(Q, t, { t0: o.t0, dur: o.dur, x0: CX(o.k - 1), y0: TOP, x1: CX(o.k), y1: TOP, h: 34, antic: fr(1), settle: fr(3), squash: 0.05, arms: 0.3, absorb: 0.5 });
      hop(Q, t, { t0: H12.t0, dur: H12.dur, x0: CX(11), y0: TOP, x1: CX(12), y1: TOP, h: 130, antic: fr(3), settle: fr(9), squash: 0.08 });
      face(Q, t, { t0: B1 + fr(2), t1: B1 + 1.0, face: 'grin' });
      point(Q, t, { t0: B1 + 0.35, t1: B1 + 1.15, hand: 0, at: [560, 560], face: 'grin' });
      return Q;
    };
    return {
      character,
      update(t) {
        const v = value(t), sp = value(t + fr(1)) - v;
        cnt.update(v, sp, pulse(t, B1 + fr(5), fr(1), fr(6)));
        rise(label, ctx.pre ? 1 : outCubic(prog(t, -fr(2), fr(8))), 24);
        rise(sub, outCubic(prog(t, fr(4), fr(8))), 24);
        chipEls.forEach((e, i) => pop(e, prog(t, B1 + 0.45 + i * 0.3, fr(6))));
        cards.forEach((k, i) => {
          const at = L[i + 1], on = t >= at;
          const d = on ? (i === 11 ? 26 : 12) * Math.sin(Math.PI * clamp((t - at) / fr(7))) * (1 - 0.3 * prog(t, at, fr(7))) : 0;
          const enter = ctx.pre ? 1 : outBack(prog(t, -fr(3) + i * fr(1), fr(7)), 1.6);
          k.c.style.transform = `translateY(${(d + (1 - enter) * 40).toFixed(1)}px)`;
          k.c.style.opacity = clamp(enter * 2).toFixed(3);
          k.dot.style.opacity = on ? '1' : '0';
          k.dot.style.transform = `scale(${on ? outBack(prog(t, at, fr(5)), 2.5).toFixed(3) : 0})`;
          k.num.style.color = on ? P.ink : '#b4ad9f';
        });
      },
      lamp: t => ({ x: t < B0 ? 540 : lerp(CX(1), CX(12), clamp((t - LAND1) / (B1 - LAND1))), y: t < B0 ? 1000 : 1150, k: 1 }),
      cues: [{ t: U0 + fr(2), sfx: 'whoosh', gain: 0.5 }, { t: LAND1, sfx: 'pop', gain: 0.6 },
        ...hops.map(o => ({ t: o.t0 + o.dur, sfx: 'tick', gain: 0.32 })), { t: B1, sfx: 'impact', gain: 0.85 },
        ...chipEls.map((_, i) => ({ t: B1 + 0.45 + i * 0.3, sfx: 'pop', gain: 0.5 }))],
    };
  },

  // R03 Deal: cards fly from his hand to the wall, one per flick, 3 frames apart; the last
  // (card 1) stays in his hand, goes up high, and is thrown into the next scene (charThrow).
  charDeal(wrap, p, ctx) {
    const S = 250, X = 230, Y = 1440, items = p.items || [];
    const slots = [[400, 520], [690, 520], [400, 755], [690, 755]], CW = 260, CH = 210;
    const mkCard = (i, tx) => {
      const c = h('div', abs(0, 0, CW, CH, `${cardCss(26)}padding:22px 24px;transform-origin:50% 50%`));
      c.append(h('div', `font:900 58px/1 ${DISPLAY};color:var(--accent)`, String(i + 1)), h('div', `margin-top:10px;font:800 34px/1.12 ${SANS};letter-spacing:-.5px;color:${P.ink}`, tx));
      return c;
    };
    const title = h('div', abs(400, 1000, 600, null, `font:900 112px/0.95 ${DISPLAY};letter-spacing:-4px;color:${P.ink}`), p.title || '4 things');
    const sub = h('div', abs(404, 1118, 600, null, `font:italic 600 42px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    title.dataset.key = 'title';
    const hole = h('div', abs(slots[0][0], slots[0][1], CW, CH, `border-radius:26px;border:5px dashed ${P.track};display:flex;align-items:center;justify-content:center;font:900 90px ${DISPLAY};color:${P.track}`), '1');
    const cards = items.map((tx, i) => { const c = mkCard(i, tx); wrap.append(c); return c; });
    wrap.prepend(hole, title, sub);
    const B0 = beat(ctx, 0, 0.49);
    const rel = [B0, B0 + fr(3), B0 + fr(6)];          // cards 2, 3, 4 leave the hand
    const FL = fr(8), UP = B0 + fr(10);
    const end = ctx.dur;
    const handArm = t => {
      let a = 72;                                        // forward-right, ready to deal
      for (const r of rel) a += -26 * pulse(t, r - fr(2), fr(2), fr(0.01)) * (t < r ? 1 : 0) + 64 * pulse(t, r, fr(1), fr(4));
      return a;
    };
    const character = t => {
      const Q = stand(X, Y, S);
      idle(Q, t, 0.7);
      armsTo(Q, t, { t0: -fr(4), t1: UP - fr(2), in: fr(4), out: fr(4), arms: [null, [handArm(t), -18]] });
      // card 1 goes up high, then the arm cocks back for the throw
      const cock = inOutCubic(prog(t, end - fr(9), fr(6)));
      armsTo(Q, t, { t0: UP, t1: 9, in: fr(5), arms: [[-30, 20], [lerp(168, 128, cock), lerp(4, 35, cock)]] });
      look(Q, t, { t0: B0 - fr(3), t1: UP, tilt: 6, dx: 0.02 });
      look(Q, t, { t0: UP + fr(3), t1: 9, tilt: -4 });
      face(Q, t, { t0: UP + fr(4), t1: end - fr(6), face: 'grin' });
      Q.lean += -3 * cock;
      return Q;
    };
    const cardInHand = t => {
      const J = joints(character(t)), a = J.arms[1];
      const w = 210, hh = 170, ang = a.ang - 180;          // stands up out of the fist
      return { x: a.hand[0] - w / 2 + Math.sin(ang * Math.PI / 180) * 60, y: a.hand[1] - hh - 18, w, h: hh, rot: -ang * 0.35 };
    };
    if (ctx.shared.puppet) ctx.shared.puppet.throwFrom[ctx.index] = { rect: cardInHand, text: items[0] || '', n: 1 };
    return {
      character,
      update(t) {
        rise(title, outCubic(prog(t, fr(2), fr(8))), 30);
        rise(sub, outCubic(prog(t, fr(6), fr(8))), 24);
        hole.style.opacity = outCubic(prog(t, 0, fr(6))).toFixed(3);
        cards.forEach((c, i) => {
          if (i === 0) {                                   // card 1 rides in his hand
            const r = cardInHand(t), on = t >= UP - fr(3);
            c.style.display = on ? 'block' : 'none';
            if (on) { const g = outBack(prog(t, UP - fr(3), fr(5)), 2); c.style.width = `${r.w}px`; c.style.height = `${r.h}px`; c.style.padding = '16px 18px'; c.style.transform = `translate(${r.x.toFixed(1)}px,${r.y.toFixed(1)}px) rotate(${r.rot.toFixed(2)}deg) scale(${g.toFixed(3)})`; }
            return;
          }
          const r = rel[i - 1], q = prog(t, r, FL), on = t >= r;
          c.style.display = on ? 'block' : 'none';
          if (!on) return;
          const from = joints(character(r)).arms[1].hand, [sx, sy] = slots[i];
          const e = outCubic(q), x = lerp(from[0] - CW / 2, sx, e), y = lerp(from[1] - CH / 2, sy, e) - 120 * Math.sin(Math.PI * q);
          const s = lerp(0.35, 1, outBack(q, 1.6)), rot = lerp(-40, 0, outBack(q, 2)) + 3 * (i % 2 ? 1 : -1) * (1 - e);
          c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
          ctx.blur(c, q < 0.6 ? 6 * (1 - q) : 0, 0);
        });
      },
      lamp: () => ({ x: 640, y: 800, k: 1 }),
      cues: [{ t: rel[0], sfx: 'swoosh', gain: 0.45 }, { t: rel[2] + fr(8), sfx: 'pop', gain: 0.5 }],
    };
  },

  // R04 Giant pencil: he runs along the top edge of the card dragging a red pencil taller than
  // himself, and its tip draws the underline. Then he bats the INTRO card off the ledge and
  // stomps the LOGO card flat.
  charUnderline(wrap, p, ctx) {
    const S = 165, LEDGE = 760, LEN = 2.2, X0 = 130, X1 = 870, LY = 922;
    const c = card(90, LEDGE, 900, 680); c.dataset.key = 'card';
    const kickr = h('div', abs(40, 34, 820, null, `font:800 30px/1 ${SANS};letter-spacing:5px;color:var(--accent)`), p.kicker || 'STEP 01 / 04');
    const title = h('div', abs(40, 74, 840, null, `font:900 ${p.font || 66}px/1.02 ${DISPLAY};letter-spacing:-2px;color:${P.ink};white-space:nowrap`), p.name || '');
    const numeral = E.ledgerNumeral('01', 360); numeral.style.left = '470px'; numeral.style.top = '390px';
    const bubbles = h('div', abs(40, 236, 820, 60, 'display:flex;gap:16px'));
    const bs = Array.from({ length: 12 }, () => { const b = bubble(52); bubbles.append(b); return b; });
    const line = h('div', abs(40, 312, 820, null, `font:700 46px/1.15 ${SANS};letter-spacing:-.5px;color:${P.ink}`), p.line || '');
    c.append(numeral, kickr, title, bubbles, line);
    const ul = E.pencil(X1 - X0, { seed: 5, width: 12, color: 'var(--accent)' }); ul.el.style.left = `${X0}px`; ul.el.style.top = `${LY - 12}px`;
    // INTRO and LOGO pop up from behind the ledge
    const stageBox = h('div', abs(0, 0, 1080, LEDGE, 'overflow:hidden'));
    const tcard = (tx, cx) => { const e = h('div', abs(cx - 90, LEDGE - 112, 180, 112, `${cardCss(18)}display:flex;align-items:center;justify-content:center;gap:10px;font:900 40px/1 ${DISPLAY};letter-spacing:1px;color:${P.graphite};transform-origin:50% 100%`), `<i style="width:16px;height:16px;border-radius:50%;background:${P.track};display:block"></i>${tx}`); stageBox.append(e); return e; };
    const intro = tcard(p.a || 'INTRO', 770), logo = tcard(p.b || 'LOGO', 560);
    const pencilMarkA = h('div', abs(0, 0, 0, 0));
    wrap.append(c, ul.el, stageBox, pencilMarkA);
    const B = [beat(ctx, 0, 0.09), beat(ctx, 1, 1.65), beat(ctx, 2, 3.71), beat(ctx, 3, 4.74)];
    const RUN = walkPlan({ t0: B[1], t1: B[1] + 1.3, x0: 175, x1: 915, y0: LEDGE, S, step: 0.62, lift: 0.12, antic: fr(4) });
    const swat = B[2], upA = swat - 0.36, introUp = swat - 0.45;
    const HOP = { t0: B[3] - 0.4, dur: 0.4, x0: 915, y0: LEDGE, x1: 560, y1: LEDGE, h: 95, antic: fr(4), settle: fr(9), squash: 0.08 };
    const logoUp = HOP.t0 - 0.45;
    const pencilAng = t => {
      if (t < B[1] - fr(6)) return 4;
      if (t < upA) return lerp(4, -18, inOutCubic(prog(t, B[1] - fr(6), fr(6))));
      if (t < swat - fr(2)) return angLerp(-18, 165, inOutCubic(prog(t, upA, 0.26)));
      if (t < swat + fr(4)) return angLerp(165, -100, inCubic(prog(t, swat - fr(2), fr(3))));   // the bat swing
      if (t < HOP.t0) return angLerp(-100, -60, outCubic(prog(t, swat + fr(1), fr(8))));
      return angLerp(-60, 170, outCubic(prog(t, HOP.t0 - fr(4), fr(8))));
    };
    const drawing = t => t >= B[1] - fr(6) && t < upA;
    const character = t => {
      const Q = stand(175, LEDGE, S);
      idle(Q, t, 0.6);
      point(Q, t, { t0: B[0], t1: B[0] + 0.85, hand: 0, at: [140, 300], look: false });
      walk(Q, t, RUN);
      hop(Q, t, HOP);
      // hold the pencil: while drawing, the hand goes where the tip touches the line
      const ang = pencilAng(t);
      if (drawing(t)) {
        const tx = Q.x - 70, v = dir(ang), back = LEN * S * (1 - PENCIL.grip);
        reach(Q, t, { t0: B[1] - fr(6), t1: upA - fr(3), in: fr(5), out: fr(4), hand: 1, at: [tx - v[0] * back, LY - v[1] * back], pref: [1, 0.4] });
      } else if (t >= upA - fr(3)) {
        const sw = t >= swat - fr(2) && t < swat + fr(6);
        armsTo(Q, t, { t0: upA, t1: 99, in: fr(4), arms: [null, sw ? [-70, -20] : [140, 10]] });
      }
      Q.props = [{ kind: 'pencil', hand: 1, ang, len: LEN }];
      if (t > B[1] - fr(6) && t < upA) Q.head.face = null;
      face(Q, t, { t0: swat - fr(3), t1: swat + 0.4, face: 'wink' });
      face(Q, t, { t0: B[3] + fr(2), t1: B[3] + 0.8, face: 'grin' });
      return Q;
    };
    return {
      character,
      update(t) {
        const e = ctx.pre ? 1 : outCubic(prog(t, -fr(2), fr(7)));
        rise(kickr, e, 16); rise(title, outCubic(prog(t, fr(2), fr(8))), 24);
        numeral.style.opacity = outCubic(prog(t, 0, fr(10))).toFixed(3);
        // the underline is drawn up to wherever the tip has been
        const Q = character(t), J = joints(Q), tip = tipOf(J.arms[1].hand, pencilAng(t), S, LEN);
        let reachX = X0;
        if (t >= B[1]) { const tt = Math.min(t, upA - fr(4)); const Jq = joints(character(tt)); reachX = tipOf(Jq.arms[1].hand, pencilAng(tt), S, LEN)[0]; }
        ul.update(t < B[1] ? 0 : clamp((reachX - X0) / (X1 - X0)));
        void tip;
        const done = B[1] + 1.25;
        bs.forEach((b, i) => pop(b, prog(t, done + i * fr(2), fr(6)), 0.3));
        rise(line, outCubic(prog(t, done + fr(10), fr(8))), 20);
        // INTRO: up from behind the ledge, batted off to the left, spinning
        const iu = outBack(prog(t, introUp, fr(7)), 1.8), hit = prog(t, swat, 0.5);
        intro.style.transform = t < swat ? `translateY(${((1 - iu) * 120).toFixed(1)}px)` :
          `translate(${(-900 * outCubic(hit)).toFixed(1)}px,${(-260 * Math.sin(Math.PI * hit * 0.8)).toFixed(1)}px) rotate(${(-420 * hit).toFixed(1)}deg)`;
        intro.style.display = hit >= 1 ? 'none' : 'flex';
        if (t >= swat) ctx.blur(intro, Math.min(18, 30 * (1 - hit)), 0); else intro.style.filter = '';
        // LOGO: up from behind the ledge, stomped flat when he lands
        const lu = outBack(prog(t, logoUp, fr(7)), 1.8), land = HOP.t0 + HOP.dur;
        const flat = t < land ? 1 : lerp(0.14, 0.1, prog(t, land, fr(4)));
        logo.style.transform = `translateY(${((1 - lu) * 120).toFixed(1)}px) scale(${(1 + (t >= land ? 0.25 * (1 - prog(t, land, fr(6))) : 0)).toFixed(3)},${flat.toFixed(3)})`;
        logo.style.opacity = t < land + 0.5 ? '1' : (1 - prog(t, land + 0.5, fr(8))).toFixed(3);
      },
      lamp: t => ({ x: t < B[1] ? 300 : lerp(300, 820, clamp((t - B[1]) / 1.3)), y: 900, k: 1 }),
      cues: [{ t: B[1], sfx: 'scratch', gain: 0.55 }, { t: introUp, sfx: 'pop', gain: 0.4 }, { t: swat, sfx: 'swoosh', gain: 0.7 }, { t: logoUp, sfx: 'pop', gain: 0.4 }, { t: HOP.t0 + HOP.dur, sfx: 'stamp', gain: 0.9 }],
    };
  },

  // R05 Sit and measure: he sits on the top edge of the chart card, legs swinging ("nothing sits
  // still"), while the bars race; on "longest" he holds a magnifier over the longest bar and the
  // lens shows its value large.
  charMeasure(wrap, p, ctx) {
    const S = 150, SEAT = [858, 820], items = p.bars || [];
    const title = h('div', abs(100, 486, 640, null, `font:900 76px/0.98 ${DISPLAY};letter-spacing:-2.5px;color:${P.ink}`), p.title || '');
    const sub = h('div', abs(100, 650, 640, null, `font:italic 600 38px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    const c = card(100, SEAT[1], 860, 600); c.dataset.key = 'card';
    const b = E.bars(items, { w: 760, dur: p.run || 1.5, rowH: 100, gap: 30, labelW: 230 }); b.el.style.cssText += 'position:absolute;left:40px;top:62px'; c.append(b.el);
    wrap.append(title, sub, c);
    const B = [beat(ctx, 0, 1.57), beat(ctx, 1, 2.4), beat(ctx, 2, 4.68)];
    const hero = items[0] || {}, LENS = [796, SEAT[1] + 62 + 50];
    const character = t => {
      const Q = stand(SEAT[0], SEAT[1], S);
      // nothing sits still: his legs never stop, faster once the bars are racing
      sit(Q, t, { t0: -1, seat: SEAT, swing: 1, period: 1.0, in: 0.01 });
      Q.thighK = [0.42, 0.42];
      // the magnifier comes out on "longest" and goes over the top bar
      const m = env(t, B[1], ctx.dur + 1, fr(6));
      if (m) {
        reach(Q, t, { t0: B[1], t1: 99, in: fr(6), hand: 0, at: [LENS[0] + 52, LENS[1] - 128], pref: [-1, 0.3] });
        Q.props = [{ kind: 'magnifier', hand: 0, ang: -22, r: 0.62, text: hero.text || '', sub: hero.label || '', size: 54, lensO: clamp(m * 1.4) }];
      }
      look(Q, t, { t0: B[1], t1: 99, tilt: -10, dx: -0.03, dy: 0.02 });
      react(Q, t, { t0: B[2], kind: 'tilt', side: -1, dur: 0.9, face: 'curious' });
      look(Q, t, { t0: -1, t1: B[1] - fr(4), tilt: 4 });
      return Q;
    };
    return {
      character,
      update(t) {
        rise(title, ctx.pre ? 1 : outCubic(prog(t, -fr(2), fr(8))), 24);
        rise(sub, outCubic(prog(t, fr(3), fr(8))), 20);
        rise(c, ctx.pre ? 1 : outCubic(prog(t, -fr(4), fr(8))), 40);
        b.update(t + 0.15);
      },
      lamp: t => ({ x: t < B[1] ? 540 : 760, y: t < B[1] ? 1050 : 930, k: 1 }),
      cues: [{ t: (p.run || 1.5) - 0.05, sfx: 'pop', gain: 0.55 }, { t: B[1], sfx: 'swoosh', gain: 0.45 }, { t: B[2], sfx: 'click', gain: 0.6 }],
    };
  },

  // R06 Mixing desk (the hero scene): he stands behind a desk of ten channels. Every speaker
  // blares ("a sound on every move?"): he covers his ears and winces. "No.": he jumps and slams
  // the desk. Then he runs along it muting every other channel; the counter rolls from 210 down
  // to 103. Last, a strip shows the sound landing half a frame before the picture.
  charMute(wrap, p, ctx) {
    const S = 220, GROUND = 1400, DESK = 1290, N = 10;
    const CH = k => 120 + k * (770 / 9);
    const title = h('div', abs(80, 482, 920, null, `text-align:center;font:900 64px/1.05 ${DISPLAY};letter-spacing:-2px;color:${P.ink}`), p.title || '');
    const cnt = tally(3, { w: 104, hh: 150, comma: false });
    const cbox = h('div', abs(0, 590, 1080, 160, 'display:flex;justify-content:center')); cbox.append(cnt.el); cnt.el.dataset.key = 'counter';
    const clabel = h('div', abs(80, 758, 920, null, `text-align:center;font:700 40px/1.2 ${SANS};color:${P.graphite}`), p.label || 'of 210 moves get a sound');
    // the strip: frames of a picture event, the sound blip half a frame before it
    const strip = h('div', abs(130, 846, 820, 150, `${cardCss(22)}`));
    const fw = 92, frames = Array.from({ length: 7 }, (_, i) => { const f = h('div', abs(36 + i * (fw + 14), 26, fw, 60, `border-radius:10px;background:${i === 4 ? 'color-mix(in srgb,var(--accent) 16%,#fff)' : P.card2};border:4px solid ${i === 4 ? 'var(--accent)' : P.line}`)); strip.append(f); return f; });
    const blip = h('div', abs(0, 98, 20, 20, 'border-radius:50%;background:var(--accent)'));
    const blipLab = h('div', abs(0, 100, 380, null, `font:800 34px/1 ${SANS};color:${P.ink};white-space:nowrap`), p.early || 'half a frame early');
    strip.append(blip, blipLab);
    wrap.append(title, cbox, clabel, strip);
    // the desk is in front of him: the foreground layer of the puppet
    const fgEl = ctx.shared.puppet ? ctx.shared.puppet.fg(ctx.index) : wrap;
    const desk = h('div', abs(64, DESK, 930, 170, `border-radius:22px 22px 14px 14px;background:linear-gradient(170deg,#f6efe2,#e6dccb 70%);box-shadow:inset 2px 3px 0 #fff,inset 0 -8px 0 rgba(70,52,25,.12),6px 10px 18px rgba(70,52,25,.3),18px 40px 70px -20px ${P.shadowDeep}`));
    const lip = h('div', abs(64, DESK - 8, 930, 22, `border-radius:12px;background:linear-gradient(#fffdf8,#ece4d4);box-shadow:0 3px 6px rgba(70,52,25,.25)`));
    const sps = Array.from({ length: N }, (_, k) => { const s = speaker(70); s.el.style.left = `${CH(k) - 64 - 35}px`; s.el.style.top = '40px'; desk.append(s.el); return s; });
    const keys = Array.from({ length: N }, (_, k) => { const e = h('div', abs(CH(k) - 64 - 26, -6, 52, 22, `border-radius:8px;background:${P.graphite};box-shadow:0 4px 0 #2a2723`)); desk.append(e); return e; });
    fgEl.append(lip, desk);
    const B = [beat(ctx, 0, 1.54), beat(ctx, 1, 2.5), beat(ctx, 2, 3.6), beat(ctx, 3, 5.5)];
    // the run along the desk and the five slaps (channels 2, 4, 6, 8, 10)
    const RUN = walkPlan({ t0: B[2] - 0.2, t1: B[2] + 1.35, x0: 170, x1: 880, y0: GROUND, S, step: 0.7, lift: 0.1, arms: 0.5 });
    const slapK = [1, 3, 5, 7, 9];
    const xAt = t => (t < RUN.t0 ? 170 : t >= RUN.t1 ? 880 : walkX(RUN, t));
    const slapT = slapK.map(k => {                     // the moment his body passes each channel
      let lo = RUN.t0, hi = RUN.t1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (xAt(m) < CH(k) - 30) lo = m; else hi = m; } return lo;
    });
    const slam = B[1] + fr(1), JUMP = { t0: B[1] - 0.3, dur: 0.3, x0: 170, y0: GROUND, x1: 170, y1: GROUND, h: 70, antic: fr(4), settle: fr(10), squash: 0.08, arms: 0 };
    const v = t => { let n = 0; slapT.forEach(s => { n += outCubic(prog(t, s + fr(1), fr(5))); }); return lerp(210, 103, n / 5); };
    const character = t => {
      const Q = stand(170, GROUND, S);
      idle(Q, t, 0.8);
      Q.clipY = DESK;
      // every speaker blares: hands over the ears, a wince
      armsTo(Q, t, { t0: B[0], t1: B[1] - 0.32, in: fr(4), out: fr(4), arms: [[-150, 128], [150, -128]] });
      face(Q, t, { t0: B[0] + fr(2), t1: B[1] - 0.3, face: 'wink' });
      look(Q, t, { t0: B[0], t1: B[1] - 0.32, tilt: 0, dy: 0.03, lean: 0 });
      Q.bob += 0.012 * S * Math.sin(2 * Math.PI * t * 6) * env(t, B[0], B[1] - 0.32, fr(2), fr(3));
      // "No.": up, and both fists down on the desk
      hop(Q, t, JUMP);
      armsTo(Q, t, { t0: B[1] - 0.25, t1: slam - fr(1), in: fr(3), out: fr(1), arms: [[-165, 10], [165, -10]] });
      armsTo(Q, t, { t0: slam, t1: slam + 0.35, in: fr(1), out: fr(6), arms: [[-25, 40], [25, -40]] });
      react(Q, t, { t0: slam + 0.2, kind: 'shake', dur: 0.6, times: 1.5 });
      face(Q, t, { t0: slam - fr(2), t1: slam + 0.7, face: 'thinking' });
      // run and mute every other channel: a slap is 3 frames down, 4 up
      walk(Q, t, RUN);
      slapT.forEach(s => { const w = pulse(t, s - fr(3), fr(3), fr(4)); if (w > 0) Q.arms[1] = [angLerp(Q.arms[1][0], 20, w), lerp(Q.arms[1][1], 40, w)]; });
      face(Q, t, { t0: slapT[0], t1: slapT[4] + 0.2, face: 'grin' });
      // "before": point up at the strip
      point(Q, t, { t0: B[3], t1: B[3] + 0.9, hand: 0, at: [560, 930], face: 'curious' });
      return Q;
    };
    return {
      character,
      update(t) {
        rise(title, ctx.pre ? 1 : outCubic(prog(t, -fr(2), fr(8))), 24);
        const val = v(t);
        cnt.update(val, v(t + fr(1)) - val, slapT.reduce((m, s) => Math.max(m, pulse(t, s + fr(5), fr(1), fr(5))), 0));
        rise(clabel, outCubic(prog(t, fr(4), fr(8))), 16);
        const blare = env(t, B[0], B[1] + fr(2), fr(3), fr(2)), jolt = pulse(t, slam, fr(1), fr(6));
        sps.forEach((s, k) => {
          const muted = slapK.indexOf(k) >= 0 ? outCubic(prog(t, slapT[slapK.indexOf(k)], fr(4))) : 0;
          const loud = 0.3 * (0.5 + 0.5 * Math.sin(t * 9 + k)) + blare * (0.9 + 0.4 * Math.sin(t * 40 + k * 2));
          s.update(loud * (1 - muted), muted);
          s.el.style.transform = `translate(${(blare * 3 * Math.sin(t * 50 + k)).toFixed(1)}px,${(jolt * -14).toFixed(1)}px)`;
        });
        keys.forEach((e, k) => { const i = slapK.indexOf(k), d = i >= 0 ? (t >= slapT[i] ? 6 : 0) + 6 * pulse(t, slapT[i], fr(1), fr(3)) : 0; e.style.transform = `translateY(${d.toFixed(1)}px)`; e.style.background = i >= 0 && t >= slapT[i] ? 'var(--accent)' : P.graphite; });
        desk.style.transform = lip.style.transform = `translateY(${(jolt * 8).toFixed(1)}px)`;
        // the strip slides in; the blip arrives half a frame before frame 5
        const si = outCubic(prog(t, B[3] - 0.35, fr(9)));
        strip.style.opacity = si.toFixed(3); strip.style.transform = `translateY(${((1 - si) * 40).toFixed(1)}px)`;
        frames.forEach((f, i) => { f.style.opacity = outCubic(prog(t, B[3] - 0.3 + i * fr(2), fr(5))).toFixed(3); });
        const bx = 36 + 4 * (fw + 14) - (fw + 14) * 0.5 * outBack(prog(t, B[3], fr(8)), 1.6);
        blip.style.left = `${(bx - 10).toFixed(1)}px`; blip.style.opacity = prog(t, B[3] - fr(2), fr(3)).toFixed(3);
        blipLab.style.left = `${(bx + 22).toFixed(1)}px`; blipLab.style.opacity = prog(t, B[3] + fr(6), fr(5)).toFixed(3);
      },
      lamp: t => ({ x: t < B[2] ? 400 : xAt(t), y: 1150, k: 1 }),
      cues: [{ t: B[0], sfx: 'riser', gain: 0.35 }, { t: slam, sfx: 'impact', gain: 0.9 }, ...slapT.map(s => ({ t: s, sfx: 'click', gain: 0.5 })), { t: B[3], sfx: 'tick', gain: 0.6 }],
    };
  },

  // R07 Sort into piles: he holds the twelve endings and deals them into three trays — nine in
  // a quick stream, one flicked high, two just dropped (they land dead, no bounce).
  charSort(wrap, p, ctx) {
    const S = 230, X = 205, Y = 1450, TRAY = 1385;
    const piles = (p.piles || []).map((d, i) => ({ ...d, x: [505, 715, 900][i], w: [200, 170, 160][i] }));
    const kick_ = kick(p.kicker || 'How the 12 reels end', 104, 486, 900);
    const title = h('div', abs(100, 528, 900, null, `font:900 96px/1 ${DISPLAY};letter-spacing:-3px;color:${P.ink}`), p.title || 'The ending');
    title.dataset.key = 'title';
    wrap.append(kick_, title);
    const trays = piles.map(pl => {
      const tr = h('div', abs(pl.x - pl.w / 2 - 10, TRAY - 6, pl.w + 20, 46, `border-radius:12px;background:linear-gradient(#e2d8c5,#d3c7b0);box-shadow:inset 0 6px 8px rgba(70,52,25,.3),4px 8px 14px ${P.shadowSoft}`));
      const lab = h('div', abs(pl.x - 120, 1100, 240, null, `text-align:center;font:800 34px/1.12 ${SANS};letter-spacing:-.5px;color:${P.graphite}`), pl.label);
      const num = h('div', abs(pl.x - 120, 990, 240, null, `text-align:center;font:900 82px/1 ${DISPLAY};letter-spacing:-2px;color:${P.ink};transform-origin:50% 80%`), `${pl.n}<span style="font:800 34px ${SANS};letter-spacing:0;color:${P.muted}"> of 12</span>`);
      wrap.append(tr, lab, num);
      return { tr, lab, num };
    });
    const B = [beat(ctx, 0, 1.08), beat(ctx, 1, 1.87), beat(ctx, 2, 4.98), beat(ctx, 3, 6.4)];
    // which pile each of the twelve goes to, and when it leaves the hand
    const plan = [];
    for (let i = 0; i < (piles[0] ? piles[0].n : 9); i++) plan.push({ pile: 0, t: B[1] + i * fr(3), fl: fr(9), arc: 90 });
    plan.push({ pile: 1, t: B[2], fl: fr(14), arc: 260 });
    plan.push({ pile: 2, t: B[3], fl: fr(10), arc: 40, dead: true }, { pile: 2, t: B[3] + fr(3), fl: fr(10), arc: 30, dead: true });
    const slotOf = (pi, j) => [piles[pi].x, TRAY - 40 - j * 7];
    plan.forEach((c, i) => { c.j = plan.slice(0, i).filter(o => o.pile === c.pile).length; });
    const R = rng(23), jit = plan.map(() => (R() - 0.5) * 10);
    const flick = t => plan.reduce((m, c) => Math.max(m, pulse(t, c.t - fr(2), fr(2), fr(4))), 0);
    const character = t => {
      const Q = stand(X, Y, S);
      idle(Q, t, 0.7);
      // the stack in the left hand, held up on "the ending"
      armsTo(Q, t, { t0: -1, t1: 99, in: 0.01, arms: [[-8, 108], null], hands: ['grip', null] });
      armsTo(Q, t, { t0: B[0], t1: B[1] - fr(4), in: fr(5), out: fr(5), arms: [[-150, 40], null] });
      look(Q, t, { t0: B[0], t1: B[1] - fr(4), tilt: -6, dx: -0.02 });
      // the throwing arm: back 2 frames, out, back again
      const f = flick(t), base = [40, -60];
      Q.arms[1] = [angLerp(lerp(Q.arms[1][0], base[0], env(t, B[1] - fr(5), B[3] + 0.2, fr(5), fr(8))), 110, f), lerp(Q.arms[1][1], 10, f)];
      const big = pulse(t, B[2] - fr(5), fr(5), fr(8));
      Q.arms[1] = [angLerp(Q.arms[1][0], 165, big), Q.arms[1][1]];
      point(Q, t, { t0: B[1] + 1.2, t1: B[2] - 0.5, hand: 1, at: [505, 1250], face: 'interested' });
      // "just stop": a shrug
      armsTo(Q, t, { t0: B[3] + 0.35, t1: B[3] + 1.2, in: fr(5), out: fr(6), arms: [[-62, 70], [62, -70]] });
      face(Q, t, { t0: B[3] + 0.35, t1: B[3] + 1.2, face: 'grin' });
      look(Q, t, { t0: B[3] + 0.35, t1: B[3] + 1.2, tilt: 7 });
      return Q;
    };
    const stack = h('div', abs(0, 0, 130, 120));
    const sc = Array.from({ length: 12 }, (_, i) => { const e = h('div', abs(0, 60 - i * 5, 130, 80, `${cardCss(12)}`)); stack.append(e); return e; });
    const flying = plan.map(() => { const e = h('div', abs(0, 0, 150, 90, `${cardCss(14)}display:none;transform-origin:50% 50%`)); return e; });
    wrap.append(stack, ...flying);
    return {
      character,
      update(t) {
        rise(kick_, ctx.pre ? 1 : outCubic(prog(t, -fr(2), fr(7))), 16);
        rise(title, ctx.pre ? 1 : outCubic(prog(t, 0, fr(8))), 24);
        trays.forEach((tr, i) => {
          rise(tr.tr, outBack(prog(t, fr(2) + i * fr(2), fr(7)), 1.6), 30);
          rise(tr.lab, outCubic(prog(t, fr(5) + i * fr(2), fr(7))), 20);
          const last = plan.filter(c => c.pile === i).reduce((m, c) => Math.max(m, c.t + c.fl), 0);
          pop(tr.num, prog(t, last + fr(1), fr(7)), 0.4);
          tr.tr.style.outline = t >= last ? '4px solid var(--accent)' : 'none';
        });
        const J = joints(character(t)), hand0 = J.arms[0].hand;
        const left = plan.filter(c => t < c.t).length;
        stack.style.transform = `translate(${(hand0[0] - 65).toFixed(1)}px,${(hand0[1] - 108).toFixed(1)}px) rotate(-6deg)`;
        sc.forEach((e, i) => { e.style.display = i < left ? 'block' : 'none'; });
        plan.forEach((c, i) => {
          const el = flying[i];
          if (t < c.t) { el.style.display = 'none'; return; }
          el.style.display = 'block';
          const from = joints(character(c.t)).arms[1].hand, [sx, sy] = slotOf(c.pile, c.j);
          const q = prog(t, c.t, c.fl), x = lerp(from[0], sx, q), y = lerp(from[1], sy, q) - c.arc * Math.sin(Math.PI * q);
          const settle = c.dead ? 0 : -8 * Math.sin(Math.PI * clamp((t - c.t - c.fl) / fr(5))) * (t > c.t + c.fl ? 1 : 0);
          const rot = lerp(-200 * (c.pile === 1 ? 2 : 1), jit[i], outCubic(q));
          el.style.transform = `translate(${(x - 75).toFixed(1)}px,${(y - 45 + settle).toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
          ctx.blur(el, q < 0.7 ? 5 : 0, 0);
        });
      },
      lamp: t => ({ x: t < B[1] ? 300 : 650, y: 1200, k: 1 }),
      cues: [{ t: B[1], sfx: 'swoosh', gain: 0.5 }, { t: B[1] + 8 * fr(3) + fr(9), sfx: 'pop', gain: 0.5 }, { t: B[2], sfx: 'whoosh', gain: 0.5 }, { t: B[2] + fr(14), sfx: 'pop', gain: 0.6 }, { t: B[3] + fr(10), sfx: 'tick', gain: 0.5 }],
    };
  },

  // R08 Save close-up: the large approved face returns, nods toward the bookmark, which fills,
  // and winks.
  charSave(wrap, p, ctx) {
    const title = h('div', abs(60, 1150, 960, null, `text-align:center;font:900 132px/1 ${DISPLAY};letter-spacing:-4px;color:${P.ink}`), p.title || 'Save this.');
    title.dataset.key = 'title';
    const sub = h('div', abs(100, 1300, 880, null, `text-align:center;font:italic 600 46px/1.25 ${SERIF};color:${P.muted}`), p.sub || '');
    const bm = E.bookmark(130); bm.el.style.left = '800px'; bm.el.style.top = '560px';
    wrap.append(title, sub, bm.el);
    const at = beat(ctx, 0, 0.08), fill = at + fr(6);
    return {
      character(t) {
        const Q = stand(540, 1700, 430);
        const nod = pulse(t, at - fr(2), fr(4), fr(8));
        bigHead(Q, { x: 540 + 14 * nod, y: 1100 + 22 * nod + 6 * Math.sin(t * 2.6), size: 430, tilt: 7 * nod - 3 * pulse(t, 1.0, fr(4), fr(10)) + 1.5 * Math.sin(t * 1.9), face: t > 0.95 && t < 1.4 ? 'wink' : null });
        return Q;
      },
      update(t) {
        const e = ctx.pre ? 1 : outCubic(prog(t, 0, fr(6)));
        title.style.opacity = e.toFixed(3); title.style.transform = `scale(${lerp(1.18, 1, outBack(clamp(prog(t, 0, fr(7))), 1.4)).toFixed(4)})`;
        rise(sub, outCubic(prog(t, fr(5), fr(8))), 24);
        bm.el.style.opacity = outCubic(prog(t, 0, fr(5))).toFixed(3);
        bm.el.style.transform = `rotate(${(8 * pulse(t, fill, fr(3), fr(10))).toFixed(2)}deg)`;
        bm.update(prog(t, fill, fr(10)));
      },
      lamp: () => ({ x: 540, y: 880, k: 1 }),
      cues: [{ t: fill + fr(9), sfx: 'pop', gain: 0.75 }],
    };
  },
};
