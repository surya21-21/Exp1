// Motion pack scene types, part one: the hook (reelDeal), the hero number (countSlam), the
// chapter list (chapterList) and the operated timeline (trackTimeline).
// Contract: type -> (wrap, props, ctx) => { update(t), avatar(t), lamp(t), cues, selfEnter, exit(k) }.
// selfEnter: the scene builds its own entrance from t = 0, so a motion-pack transition only
// hides it until the boundary. exit(k): how the scene leaves under a carry (k 0..1).
import { FPS, fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack, pulse, rng } from '../../../collection/lib/ease.js';
import { P, h, abs } from '../../../collection/lib/paper.js';
import * as E from '../../../collection/lib/elements.js';
import { travel } from '../../../collection/lib/avatar.js';
import { DISPLAY, SANS, SERIF, beat, wordAt, reelWord, slam, slamHit, trackIn, maskIn, rollNumber, blurrer, lift, paperCss, heroTravel, arc, tile, letters, pencilLine } from './kit.js';

const stage = wrap => { const c = h('div', 'position:absolute;inset:0;transform-origin:540px 960px'); wrap.append(c); return c; };
const ticks = (a, b, every, gain = 0.3) => { const o = []; for (let t = a; t < b - 1e-6; t += every) o.push({ t, sfx: 'tick', gain }); return o; };

// A face for one studied reel: our own generic drawing of a phone screen (never a creator's frame).
function reelFace(i) {
  const R = rng(40 + i), dark = i % 3 === 1, ink = dark ? 'rgba(243,237,226,.42)' : 'rgba(42,39,35,.26)';
  const bars = [0, 1, 2].map(k => `<rect x="12" y="${16 + k * 8}" width="${(26 + R() * 40).toFixed(1)}" height="4.6" rx="2.3" fill="${ink}"/>`).join('');
  const blk = i % 2 ? 'style="fill:var(--accent)"' : `fill="${dark ? '#4a463f' : '#d2c9b7'}"`;
  return `<svg viewBox="0 0 90 160" width="100%" height="100%" style="display:block"><rect x="5" y="5" width="80" height="150" rx="9" fill="${dark ? '#2a2723' : '#f3eee4'}"/>${bars}` +
    `<g class="blk"><rect x="13" y="50" width="64" height="56" rx="7" ${blk}/><path class="play" d="M38 66 L55 78 L38 90 Z" fill="#fffdf8" style="transform-origin:46px 78px;transform-box:view-box"/></g>` +
    `<circle cx="70" cy="131" r="6" style="fill:var(--accent)"/><rect x="12" y="144" width="66" height="3.4" rx="1.7" fill="${ink}"/><rect class="scrub" x="12" y="144" width="0" height="3.4" rx="1.7" style="fill:var(--accent)"/></svg>`;
}

export const SCENES = {
  // G05 Reel deal (H01 + A01/A02 + M22 fan-out, M01): the counter of frames studied is already
  // racing on frame 0; the large avatar talks in front of a hand of twelve reels. On the first
  // beat it shrinks into the cursor and the hand is dealt into a 6 x 2 grid, one card every
  // 2 frames on arcs with an overshoot; on the spoken words the reels start to play, then step
  // frame by frame. The counter keeps running into the next scene (it lands there).
  reelDeal(wrap, p, ctx) {
    const cam = stage(wrap);
    const n = p.count || 12, cols = p.cols || 6, CW = 140, CH = 249, GX = 16, GY = 22;
    const gx0 = Math.round(540 - (cols * CW + (cols - 1) * GX) / 2), gy0 = p.gridY || 700;
    const cfg = p.counter || { from: 11900, to: 18271 };
    const L = cfg.landAt ?? reelWord(ctx, cfg.land || 'eighteen', 0, ctx.end + 0.48);
    const val = T => cfg.from + (cfg.to - cfg.from) * outCubic(clamp(T / L));
    const CY = p.counterY || 470;
    const num = rollNumber({ final: cfg.to, cards: true, cardW: 88, cardH: 126, gap: 8, morph: 'dg' });
    const nb = h('div', abs(0, CY, 1080, 126, 'display:flex;justify-content:center'));
    nb.append(num.el); num.el.dataset.key = 'counter';
    const label = h('div', abs(60, CY + 142, 960, null, `text-align:center;font:800 38px/1 ${SANS};letter-spacing:.08em;text-transform:uppercase;color:${P.muted}`), p.label || 'frames studied');
    cam.append(nb, label);
    const deck = h('div', 'position:absolute;inset:0');
    cam.insertBefore(deck, nb);
    const shrinkAt = beat(ctx, 0, 1.25), dealAt = shrinkAt + fr(3);
    const viralAt = wordAt(ctx, 'viral', 0, shrinkAt + 0.45);
    const steps = [beat(ctx, 1, 2.8), wordAt(ctx, 'by', 0, 3.15), wordAt(ctx, 'frame', 1, 3.38)];
    const pivot = [540, p.fanY || 1240], RAD = 380;
    const cards = Array.from({ length: n }, (_, i) => {
      const el = h('div', `position:absolute;left:0;top:0;width:${CW}px;height:${CH}px;padding:7px;${paperCss(18)}`);
      el.innerHTML = reelFace(i);
      deck.append(el);
      const th = lerp(-62, 62, n === 1 ? 0.5 : i / (n - 1));
      const fan = [pivot[0] + RAD * Math.sin(th * Math.PI / 180), pivot[1] - RAD * Math.cos(th * Math.PI / 180)];
      const col = i % cols, row = Math.floor(i / cols);
      const grid = [gx0 + col * (CW + GX) + CW / 2, gy0 + row * (CH + GY) + CH / 2];
      const R = rng(70 + i);
      return { el, th, fan, grid, blk: el.querySelector('.blk'), play: el.querySelector('.play'), scrub: el.querySelector('.scrub'),
        jumps: [0, 1, 2, 3].map(() => [(R() - 0.5) * 22, (R() - 0.5) * 30]), blur: blurrer() };
    });
    const stepIdx = t => steps.filter(s => t >= s).length;
    const pos = (k, t) => {
      const d = dealAt + k.i * fr(2), x = prog(t, d, fr(12)), u = heroTravel(x, 12);
      const breath = 2.2 * Math.sin(t * 2.4 + k.i * 0.55) * (1 - clamp(x * 3));
      const [px, py] = arc(k.fan[0], k.fan[1], k.grid[0], k.grid[1], u, 0.22);
      return { x: px, y: py, r: lerp(k.th + breath, 0, u), s: lerp(1.1, 1, u), u };
    };
    cards.forEach((k, i) => { k.i = i; });
    let exitK = 0;
    return {
      selfEnter: true,
      update(t) {
        const T = ctx.start + t;
        num.update(val(T), val(T + fr(1)));
        const e0 = outCubic(prog(t, -fr(6), fr(8)));
        nb.style.opacity = e0.toFixed(3);
        label.style.opacity = outCubic(prog(t, fr(2), fr(8))).toFixed(3);
        const si = stepIdx(t);
        cards.forEach(k => {
          const q = pos(k, t), q1 = pos(k, t - fr(1));
          k.el.style.transform = `translate(${(q.x - CW / 2).toFixed(1)}px,${(q.y - CH / 2).toFixed(1)}px) rotate(${q.r.toFixed(2)}deg) scale(${q.s.toFixed(4)})`;
          k.el.style.boxShadow = `inset 2px 2px 0 #fff,${lift(Math.sin(Math.PI * clamp(q.u)) * 0.8)}`;
          k.blur(k.el, Math.abs(q.x - q1.x) * 0.06, Math.abs(q.y - q1.y) * 0.06);
          // the reels start to play on "viral", left to right, then step frame by frame
          const pl = prog(t, viralAt + k.i * fr(1), fr(5));
          k.play.style.transform = `scale(${pl <= 0 ? 0.001 : lerp(0.2, 1, outBack(pl, 2.4)).toFixed(3)})`;
          const j = k.jumps[si];
          k.blk.setAttribute('transform', `translate(${j[0].toFixed(1)} ${j[1].toFixed(1)})`);
          k.scrub.setAttribute('width', (66 * clamp(0.08 * prog(t, viralAt, 1.2) + 0.22 * si)).toFixed(1));
          k.el.style.outline = si && t - steps[si - 1] < fr(3) ? '4px solid var(--accent)' : 'none';
        });
        exitK = 0;
      },
      // under a carry the hand of reels flies past the camera while the counter is taken over
      exit(k) {
        const e = inCubic(k);
        cards.forEach(c => {
          const dx = c.grid[0] - 540, dy = c.grid[1] - 960;
          c.el.style.transform += ` translate(${(dx * 0.9 * e).toFixed(1)}px,${(dy * 0.9 * e + 120 * e).toFixed(1)}px) scale(${(1 + 0.9 * e).toFixed(3)})`;
          c.el.style.opacity = (1 - e).toFixed(3);
        });
        label.style.opacity = (1 - clamp(e * 2)).toFixed(3);
      },
      avatar(t) {
        const m = inOutCubic(prog(t, shrinkAt, fr(10))), e = outCubic(prog(t, -fr(6), fr(8)));
        const tgt = [cards[0].grid[0] + CW / 2 - 6, gy0 - 30];
        if (m < 1) {
          const bx = lerp(540, tgt[0], m), by = lerp(1080 + (1 - e) * 50, tgt[1], m);
          return {
            bust: { x: bx, y: by, w: lerp(440, 150, m), o: e * (1 - clamp((m - 0.35) / 0.4)) },
            chip: { x: bx, y: by - lerp(44, 0, m), size: lerp(360, 112, m), o: clamp((m - 0.3) / 0.4), ring: null },
          };
        }
        const stop = i => ({ x: cards[i].grid[0] + CW / 2 - 18, y: cards[i].grid[1] - CH / 2 + 26 });
        return { chip: travel(t, [{ t: 0, x: tgt[0], y: tgt[1] }, { t: steps[0], ...stop(0) }, { t: steps[2], ...stop(2) }], 112) };
      },
      lamp: t => ({ x: 540, y: lerp(1000, 900, prog(t, shrinkAt, 0.5)), k: 1 }),
      cues: [...ticks(0, Math.min(1.1, shrinkAt - 0.1), fr(4), 0.22), { t: dealAt, sfx: 'swoosh', gain: 0.5 }, { t: viralAt, sfx: 'pop', gain: 0.4 },
        ...steps.map(s => ({ t: s, sfx: 'tick', gain: 0.65 }))],
    };
  },

  // G06 Count slam, the hero (M01 landing + M10 slam + Disney multiplane): the giant paper
  // counter arrives already running (carried in digit by digit), pulls back for 3 frames and
  // lands on the claim with a bounce that runs through its digits, while the camera pushes in
  // 10% and three layers of film strip whip past and slow down (near layers faster, larger,
  // blurred; far ones smaller, paler, softer). Then the word lands with a tracking settle and
  // its full stop pops in: the dot the next transition dives into.
  countSlam(wrap, p, ctx) {
    const cam = stage(wrap);
    const cfg = p.counter || { from: 11900, to: 18271 };
    const L = cfg.landAt ?? reelWord(ctx, cfg.land || 'eighteen', 0, ctx.start + beat(ctx, 0, 0.48));
    const tl = L - ctx.start, val = T => cfg.from + (cfg.to - cfg.from) * outCubic(clamp(T / L));
    const strips = [], mkStrip = (y, hh, speed, alpha, soft, z) => {
      const fw = Math.round(hh * 0.62), pitch = fw + Math.round(hh * 0.16), count = Math.ceil(1400 / pitch) + 2;
      const el = h('div', `position:absolute;left:-160px;top:${y}px;width:1400px;height:${hh}px;background:${P.graphite};border-radius:6px;opacity:${alpha};${soft ? `filter:blur(${soft}px)` : ''};box-shadow:${lift(z * 0.6)}`);
      const row = h('div', 'position:absolute;left:0;top:0;height:100%;width:3000px');
      const R = rng(Math.round(y));
      for (let i = 0; i < count * 2; i++) {
        const f = h('div', `position:absolute;left:${i * pitch}px;top:${Math.round(hh * 0.18)}px;width:${fw}px;height:${Math.round(hh * 0.64)}px;border-radius:${Math.round(hh * 0.06)}px;background:${i % 4 === 1 ? '#3a3631' : '#f3eee4'}`);
        f.append(h('div', `position:absolute;left:18%;top:${(30 + R() * 25).toFixed(0)}%;width:64%;height:30%;border-radius:4px;background:${i % 3 ? '#d2c9b7' : 'var(--accent)'}`));
        row.append(f);
      }
      for (const yy of [0.05, 0.86]) for (let i = 0; i < 90; i++) row.append(h('div', `position:absolute;left:${i * Math.round(hh * 0.22) + 6}px;top:${Math.round(hh * yy)}px;width:${Math.round(hh * 0.1)}px;height:${Math.round(hh * 0.08)}px;border-radius:2px;background:#efeae0;opacity:.75`));
      el.append(row);
      strips.push({ el, row, speed, pitch, depth: z, period: pitch * count, blur: blurrer() });
      return el;
    };
    const far = mkStrip(p.farY || 478, 74, 70, 0.32, 1.6, 0.2), mid = mkStrip(p.midY || 572, 104, -150, 0.62, 0, 0.5);
    const near = mkStrip(p.nearY || 1258, 196, 330, 1, 0, 1);
    const num = rollNumber({ final: cfg.to, cards: true, cardW: 158, cardH: 228, gap: 12, morph: 'dg' });
    const nb = h('div', abs(0, p.counterY || 756, 1080, 228, 'display:flex;justify-content:center;transform-origin:540px 114px'));
    nb.append(num.el); num.el.dataset.key = 'counter';
    const wy = p.wordY || 1020, word = letters((p.word || 'frames').toUpperCase(), `font:900 ${p.wordSize || 150}px/1 ${DISPLAY};color:${P.ink}`);
    const wrow = h('div', abs(0, wy, 1080, 160, 'display:flex;justify-content:center;align-items:baseline;transform-origin:540px 110px'));
    const dot = h('div', `flex:none;width:36px;height:36px;margin-left:10px;border-radius:50%;background:var(--accent);box-shadow:3px 5px 8px rgba(70,52,25,.35)`);
    dot.dataset.zoom = 'dot';
    wrow.append(word.el, dot); word.el.dataset.key = 'word';
    cam.append(far, mid, nb, wrow, near);
    const wordAtT = wordAt(ctx, p.word || 'frames', 0, beat(ctx, 1, tl + 1.0));
    const dotAt = wordAtT + fr(5);
    const zoom = t => 1 + 0.1 * outCubic(prog(t, tl, fr(12))) + 0.012 * Math.sin(t * 1.3);
    return {
      selfEnter: true,
      update(t) {
        const T = ctx.start + t;
        // counter: the landing bounce runs through the digits; a 3-frame pull-back before it
        num.update(val(T), val(T + fr(1)), prog(t, tl, fr(10)) * 1.6);
        const pull = t < tl ? -0.05 * Math.sin(Math.PI / 2 * clamp((t - (tl - fr(3))) / fr(3))) : 0;
        const ov = t >= tl ? 0.07 * Math.sin(Math.PI * clamp((t - tl) / fr(8))) * (1 - clamp((t - tl) / fr(8)) * 0.5) : 0;
        nb.style.transform = `scale(${(1 + pull + ov).toFixed(4)})`;
        // film strips: steady drift, a whip on the landing that dies away (inertia)
        const kick = t < tl ? 0 : 7 * Math.exp(-(t - tl) * 3.2);
        const kickInt = t < tl ? 0 : (7 / 3.2) * (1 - Math.exp(-(t - tl) * 3.2));
        const Z = zoom(t);
        strips.forEach(s => {
          const x = -((s.speed * (t + kickInt)) % s.period + s.period) % s.period;
          s.row.style.transform = `translateX(${x.toFixed(1)}px)`;
          const v = Math.abs(s.speed * (1 + kick)) / FPS;
          s.blur(s.row, v > 8 ? v * 0.35 * s.depth : 0, 0);
          // parallax under the push-in: near layers grow and travel more than far ones
          const pz = 1 + (Z - 1) * (0.4 + 1.4 * s.depth);
          s.el.style.transformOrigin = '700px 50%';
          s.el.style.transform = `translateY(${((s.el.offsetTop - 960) * (pz - 1)).toFixed(1)}px) scale(${pz.toFixed(4)})`;
        });
        cam.style.transform = `scale(${Z.toFixed(4)})`;
        // the word lands with a tracking settle, its full stop pops 5 frames later
        trackIn(word.el, t, wordAtT, { spread: 0.38, to: -0.02, dur: 9 });
        const dp = prog(t, dotAt, fr(6));
        dot.style.opacity = dp > 0 ? 1 : 0;
        dot.style.transform = `scale(${dp <= 0 ? 0 : outBack(dp, 3).toFixed(4)})`;
        const e = outCubic(prog(t, -fr(2), fr(8)));
        for (const s of [far, mid]) s.style.opacity = (e * +s.dataset.o || e).toFixed(3);
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 96, y: 744 }, { t: dotAt + fr(6), x: 150, y: 1210 }], 112) }),
      lamp: t => ({ x: 540, y: t < wordAtT ? 880 : 1000, k: 1 }),
      cues: [{ t: tl, sfx: 'impact', gain: 0.75 }, { t: dotAt, sfx: 'pop', gain: 0.7 }],
    };
  },

  // G07 Chapter list (L06 step rows + mask reveal + carry out): the number arrives as a badge
  // (the dot of the scene before), the heading closes up with a tracking settle, the rows
  // are uncovered left to right 3 frames apart, and the cursor taps the first one, which is
  // carried into the next scene as its header while the others drop away.
  chapterList(wrap, p, ctx) {
    const cam = stage(wrap);
    const items = p.items || [], n = p.n || items.length;
    const badge = h('div', abs(p.badgeX || 92, p.badgeY || 470, 156, 156, `border-radius:50%;background:var(--accent);box-shadow:inset -6px -8px 14px rgba(60,15,5,.22),${lift(0.2)};display:flex;align-items:center;justify-content:center;font:900 112px/1 ${DISPLAY};color:#fffdf8`));
    const bnum = h('div', 'transform-origin:50% 55%', String(n));
    badge.append(bnum); badge.dataset.zoom = 'badge';
    const head = h('div', abs(276, 498, 760, null, `font:900 ${p.titleSize || 96}px/1 ${DISPLAY};color:${P.ink};white-space:nowrap;transform-origin:0 50%`), (p.title || 'findings').toUpperCase());
    head.dataset.key = 'title';
    const sub = h('div', abs(280, 604, 760, null, `font:italic 600 40px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    cam.append(badge, head, sub);
    const RY = p.rowY || 700, RH = 150, RG = 26;
    const rows = items.map((tx, i) => {
      const r = h('div', abs(92, RY + i * (RH + RG), 896, RH, `${paperCss(30)}display:flex;align-items:center;gap:30px;padding:0 36px;font:800 50px/1.1 ${SANS};letter-spacing:-.5px;color:${P.ink};white-space:nowrap`));
      const tl = tile(i + 1, 92);
      r.append(tl, h('div', '', tx));
      if (i === (p.tap || 0)) r.dataset.morph = 'head';
      cam.append(r);
      return { r, tl };
    });
    if (rows[0]) rows[0].r.dataset.key = 'row';
    const at = beat(ctx, 0, 0.48), headAt = wordAt(ctx, 'things', 0, at + 0.3);
    const rowAt = i => at + fr(2 + 3 * i);
    const tapAt = Math.min(ctx.dur - fr(8), rowAt(items.length - 1) + 0.45);
    const tapRow = rows[p.tap || 0];
    return {
      selfEnter: true,
      update(t) {
        const s = slam(t, at, { from: 2.4, crash: 3, settle: 6 });
        bnum.style.opacity = s.o.toFixed(3);
        bnum.style.transform = `scale(${s.s.toFixed(4)})`;
        badge.style.transform = `scale(${(1 + 0.08 * pulse(t, slamHit(at), fr(1), fr(5))).toFixed(4)})`;
        trackIn(head, t, headAt, { spread: 0.3, dur: 9 });
        sub.style.opacity = outCubic(prog(t, headAt + fr(6), fr(8))).toFixed(3);
        rows.forEach((k, i) => {
          const q = maskIn(k.r, t, rowAt(i), { dur: 8, dx: -36 });
          const tp = prog(t, rowAt(i) + fr(3), fr(6));
          k.tl.style.transform = `scale(${tp <= 0 ? 0.4 : outBack(tp, 2.6).toFixed(4)})`;
          k.r.style.boxShadow = `inset 2px 2px 0 #fff,${lift(0)}`;
        });
        const hp = prog(t, tapAt, fr(6));
        tapRow.r.style.outline = hp > 0 ? `${(6 * outCubic(hp)).toFixed(1)}px solid var(--accent)` : 'none';
        tapRow.r.style.transform += ` scale(${(1 - 0.03 * pulse(t, tapAt, fr(1), fr(4))).toFixed(4)})`;
      },
      // the rows that are not carried fall away one after another, faster than they came
      exit(k) {
        rows.forEach((r, i) => {
          if (r === tapRow) return;
          const e = inCubic(clamp(k * 1.4 - (i - 1) * 0.12));
          r.r.style.transform = `translateY(${(320 * e).toFixed(1)}px) rotate(${((i % 2 ? 7 : -6) * e).toFixed(2)}deg)`;
          r.r.style.opacity = (1 - e).toFixed(3);
        });
        const e = inCubic(k);
        for (const el of [badge, head, sub]) { el.style.opacity = (1 - e).toFixed(3); }
        badge.style.transform = `translateY(${(-80 * e).toFixed(1)}px) scale(${(1 - 0.4 * e).toFixed(3)})`;
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 270, y: 660 }, { t: rowAt(items.length - 1) + fr(6), x: 960, y: RY + (items.length - 1) * (RH + RG) + 20 }, { t: tapAt, x: 930, y: RY + 26 }], 108) }),
      lamp: t => ({ x: 540, y: t < tapAt - 0.2 ? 1000 : RY + 75, k: 1 }),
      cues: [{ t: slamHit(at), sfx: 'pop', gain: 0.7 }, ...items.map((_, i) => ({ t: rowAt(i), sfx: 'tick', gain: 0.4 })), { t: tapAt, sfx: 'click', gain: 0.7 }],
    };
  },

  // G08 Track timeline (U14 audio timeline + U22 tally + M07 rejected card): a rebuilt editor
  // timeline with one track per reel. The twelve reel dots light as "twelve" is spoken, every
  // waveform draws from frame 0 on the beat, the tally counts to the claim, the camera pushes
  // in on the playhead; then the rejected openings slam in below and are struck out, the
  // second swapped into the first one's place.
  trackTimeline(wrap, p, ctx) {
    const cam = stage(wrap);
    const nT = p.tracks || 12, X = 70, Y = p.cardY || 640, CW = 940, CHh = 520, PX = 150;
    const hdr = h('div', abs(X, p.headY || 470, CW, 132, `${paperCss(34)}display:flex;align-items:center;gap:30px;padding:0 30px;font:900 ${p.titleSize || 58}px/1.05 ${DISPLAY};letter-spacing:-1.5px;color:${P.ink};white-space:nowrap`));
    const tl = tile(p.n || 1, 92); tl.dataset.morph = 'tile';
    hdr.append(tl, h('div', '', p.title || '')); hdr.dataset.morph = 'head'; hdr.dataset.key = 'title';
    const card = h('div', abs(X, Y, CW, CHh, paperCss(34))); card.dataset.key = 'timeline';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', CW); svg.setAttribute('height', CHh); svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
    card.append(svg);
    const TY = 96, TP = 34, R = rng(9);
    let ruler = `<rect x="22" y="22" width="${CW - 44}" height="46" rx="10" fill="#efe8da"/>`;
    for (let x = PX, k = 0; x < CW - 30; x += 22, k++) ruler += `<line x1="${x}" y1="${k % 5 ? 52 : 34}" x2="${x}" y2="66" stroke="${P.graphite}" stroke-width="${k % 5 ? 2 : 3}" opacity=".55"/>`;
    svg.insertAdjacentHTML('beforeend', ruler);
    const tracks = Array.from({ length: nT }, (_, i) => {
      const y = TY + i * TP;
      const g = document.createElementNS(svgNS, 'g');
      let d = '';
      for (let x = PX + 4; x < CW - 40; x += 8) { const a = 3 + R() * 10 * (0.55 + 0.45 * Math.sin(x * 0.03 + i)); d += `M${x} ${(y + 13 - a).toFixed(1)}V${(y + 13 + a).toFixed(1)}`; }
      g.innerHTML = `<rect x="${PX}" y="${y}" width="${CW - 40 - PX}" height="26" rx="6" fill="#ece5d6"/>` +
        `<clipPath id="tlc${ctx.index}_${i}"><rect class="cr" x="${PX}" y="${y - 4}" width="0" height="34"/></clipPath>` +
        `<path d="${d}" stroke="${i % 4 === 0 ? 'var(--accent)' : P.graphite}" stroke-width="4" stroke-linecap="round" clip-path="url(#tlc${ctx.index}_${i})" style="stroke:${i % 4 === 0 ? 'var(--accent)' : P.graphite}"/>` +
        `<circle class="dot" cx="76" cy="${y + 13}" r="11" fill="#d9d2c3"/>`;
      svg.append(g);
      return { cr: g.querySelector('.cr'), dot: g.querySelector('.dot') };
    });
    const head = document.createElementNS(svgNS, 'g');
    head.innerHTML = `<line x1="${PX}" y1="20" x2="${PX}" y2="${TY + nT * TP}" stroke-width="5" style="stroke:var(--accent)"/><path d="M${PX - 14} 14 H${PX + 14} V30 L${PX} 44 L${PX - 14} 30 Z" style="fill:var(--accent)"/>`;
    svg.append(head);
    const flag = h('div', abs(PX - 6, -54, null, 58, `padding:0 18px;border-radius:29px;background:var(--accent);display:flex;align-items:center;font:900 38px/1 ${DISPLAY};color:#fffdf8;transform-origin:10% 100%;box-shadow:${lift(0.3)}`), p.flag || '0.0 s');
    const tally = h('div', abs(CW - 300, 18, 270, 54, `display:flex;align-items:baseline;justify-content:flex-end;gap:10px;font:900 50px/1 ${DISPLAY};color:${P.ink}`));
    const tN = h('span', '', ''), tOf = h('span', `font:800 36px/1 ${SANS};color:${P.muted}`, `of ${nT}`);
    tally.append(tN, tOf);
    card.append(flag, tally);
    // rejected openings: each slams into one slot, is struck out and drops away
    const rej = (p.reject || ['INTRO', 'LOGO']).map((w, i) => {
      const slot = h('div', abs(0, p.rejectY || 1212, 1080, 170, 'display:flex;justify-content:center;align-items:center'));
      const box = h('div', 'position:relative;transform-origin:50% 60%');
      const word = h('div', `font:900 ${p.rejectSize || 132}px/1 ${DISPLAY};letter-spacing:-3px;color:${P.ink}`, w);
      const st = pencilLine(w.length * 92 + 60, { seed: 30 + i, width: 16 });
      st.el.style.left = '-30px'; st.el.style.top = '52px';
      const x = E.badge('cross', 92); x.el.style.right = '-112px'; x.el.style.top = '16px';
      box.append(word, st.el, x.el); slot.append(box); cam.append(slot);
      word.dataset.key = 'reject';
      return { slot, box, st, x };
    });
    cam.prepend(card); cam.prepend(hdr);
    const oneAt = beat(ctx, 0, 0.1), talkAt = beat(ctx, 1, 1.65), twelveAt = wordAt(ctx, 'twelve', 0, talkAt - 0.62);
    const veryAt = wordAt(ctx, 'very', 0, talkAt + 0.8), firstAt = wordAt(ctx, 'first', 0, veryAt + 0.32);
    const noAt = [beat(ctx, 2, 3.7), beat(ctx, 3, 4.74)];
    const strikeAt = [wordAt(ctx, 'intro', 0, noAt[0] + 0.3), wordAt(ctx, 'logo', 0, noAt[1] + 0.3)];
    const lit = (i, t) => prog(t, twelveAt + i * fr(1), fr(4));
    const draw = (i, t) => outCubic(prog(t, talkAt + i * fr(2), fr(12)));
    const camK = t => outCubic(prog(t, veryAt, fr(12))) * (1 - inOutCubic(prog(t, noAt[0] - 0.42, fr(11))));
    return {
      selfEnter: true,
      update(t) {
        const e = outCubic(prog(t, fr(1), fr(9)));
        card.style.opacity = e.toFixed(3);
        card.style.transform = `translateY(${(60 * (1 - outBack(prog(t, fr(1), fr(10)), 1.3))).toFixed(1)}px)`;
        tl.style.transform = `scale(${(1 + 0.14 * pulse(t, Math.max(oneAt, fr(10)), fr(2), fr(6))).toFixed(4)})`;
        let count = 0;
        tracks.forEach((k, i) => {
          const l = lit(i, t), d = draw(i, t);
          k.dot.setAttribute('r', (11 * (1 + 0.5 * Math.sin(Math.PI * l))).toFixed(2));
          k.dot.style.fill = l > 0.5 ? 'var(--accent)' : '#d9d2c3';
          k.cr.setAttribute('width', ((CW - 40 - PX) * d).toFixed(1));
          if (d > 0.2) count++;
        });
        tN.textContent = count ? String(count) : '–';
        tally.style.transform = `scale(${(1 + 0.18 * pulse(t, talkAt + (nT - 1) * fr(2) + fr(3), fr(2), fr(6))).toFixed(4)})`;
        const fp = prog(t, firstAt, fr(7));
        flag.style.opacity = clamp(prog(t, fr(4), fr(6)) * 1).toFixed(3);
        flag.style.transform = `scale(${(1 + 0.25 * Math.sin(Math.PI * fp) * (1 - fp * 0.4)).toFixed(4)})`;
        const ck = camK(t);
        cam.style.transformOrigin = `${X + PX}px ${Y + 120}px`;
        cam.style.transform = `scale(${(1 + 0.13 * ck).toFixed(4)})`;
        rej.forEach((r, i) => {
          const s = slam(t, noAt[i], { from: 2.1, crash: 3, settle: 6 }), out = i === 0 ? inCubic(prog(t, noAt[1] - fr(5), fr(5))) : 0;
          r.box.style.opacity = (s.o * (1 - out)).toFixed(3);
          r.box.style.transform = `translateY(${(-120 * out).toFixed(1)}px) scale(${(s.s * (1 - 0.3 * out)).toFixed(4)}) rotate(${(-4 * out).toFixed(2)}deg)`;
          r.st.update(prog(t, strikeAt[i], fr(6)));
          r.x.update(prog(t, strikeAt[i] + fr(4), fr(6)));
        });
      },
      avatar: t => {
        const stops = [{ t: 0, x: X + 40, y: (p.headY || 470) - 6 }, { t: twelveAt, x: 30 + 76 + X, y: Y + TY - 30 }, { t: talkAt + 0.5, x: X + CW - 120, y: Y + TY + 6 * TP },
          { t: firstAt, x: X + PX + 70, y: Y - 40 }, { t: noAt[0] + fr(8), x: 860, y: 1230 }];
        return { chip: travel(t, stops, 108) };
      },
      lamp: t => ({ x: t < noAt[0] - 0.3 ? X + PX + 200 : 540, y: t < noAt[0] - 0.3 ? Y + 260 : 1290, k: 1 }),
      cues: [{ t: twelveAt, sfx: 'tick', gain: 0.5 }, { t: talkAt, sfx: 'swoosh', gain: 0.5 }, { t: talkAt + (nT - 1) * fr(2) + fr(3), sfx: 'pop', gain: 0.55 },
        { t: firstAt, sfx: 'click', gain: 0.6 }, { t: slamHit(noAt[0]), sfx: 'stamp', gain: 0.85 }, { t: strikeAt[0], sfx: 'scratch', gain: 0.6 },
        { t: slamHit(noAt[1]), sfx: 'pop', gain: 0.7 }, { t: strikeAt[1], sfx: 'scratch', gain: 0.6 }],
    };
  },
};
