// Motion pack scene types, part two: the measuring tape (tapeMeasure, made to be drawn on
// twos), the operated sound lane (soundLane), the tally of endings (tallyDots) and the save
// button (saveTap). Same contract as scenes-a.js.
import { FPS, fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack, pulse, rng } from '../../../collection/lib/ease.js';
import { P, h, abs } from '../../../collection/lib/paper.js';
import * as E from '../../../collection/lib/elements.js';
import { travel } from '../../../collection/lib/avatar.js';
import { DISPLAY, SANS, SERIF, beat, wordAt, slam, slamHit, trackIn, maskIn, rollNumber, blurrer, lift, paperCss, heroTravel, arc, tile, pencilLine, boilStep } from './kit.js';

const stage = wrap => { const c = h('div', 'position:absolute;inset:0;transform-origin:540px 960px'); wrap.append(c); return c; };
const KRAFT = '#d8c4a0';
// ticks along a strip of tape, redrawn with a new wobble on each drawing when boiling
function tapeTicks(len, hh, seed) {
  const R = rng(seed); let d = '';
  for (let x = 14, k = 0; x < len - 6; x += 16, k++) { const j = (R() - 0.5) * 2.2; d += `M${(x + j).toFixed(1)} 0V${(k % 5 ? hh * 0.3 : hh * 0.55).toFixed(1)}`; }
  return d;
}

export const SCENES = {
  // G09 Tape measure (M01 count + M03 bar + M24 stepped): a number that counts and becomes a
  // bar. The heading lands word by word and its last word cannot sit still (it boils on
  // twos); the cursor pulls a paper tape out of its case while the number riding its end
  // counts up at a steady speed and lands on the claim; then the other measurements drop in
  // below as shorter tapes. Meant to be drawn on twos ("stepped": 15): every pencil tick is
  // redrawn on each drawing, the hand-made look of reel 09 itself.
  tapeMeasure(wrap, p, ctx) {
    const cam = stage(wrap);
    const bars = p.bars || [], hero = bars[0] || { label: '', v: 1 }, max = p.max || Math.max(...bars.map(b => b.v)) * 1.08, unit = p.unit ?? ' s';
    const TX = 300, TL = p.tapeW || 620, len = v => (v / max) * TL;
    const tl = tile(p.n || 2, 92); tl.style.position = 'absolute'; tl.style.left = '80px'; tl.style.top = `${p.headY || 478}px`; tl.dataset.morph = 'tile';
    const words = (p.title || ['NOTHING', 'SITS', 'STILL']).map(w => String(w).toUpperCase());
    const w1 = words.slice(0, -1).map((w, i) => h('div', `display:inline-block;margin-right:26px;transform-origin:0 70%`, w));
    const line1 = h('div', abs(80, (p.headY || 478) + 120, 960, null, `font:900 ${p.titleSize || 100}px/1 ${DISPLAY};letter-spacing:-3px;color:${P.ink};white-space:nowrap`));
    line1.append(...w1);
    const last = h('div', abs(74, (p.headY || 478) + 222, 960, null, `font:900 ${p.lastSize || 176}px/1 ${DISPLAY};letter-spacing:-6px;color:var(--accent);transform-origin:0 60%;white-space:nowrap`), words[words.length - 1]);
    last.dataset.key = 'title';
    const HY = p.tapeY || 1100, HH = 58;
    const lab = h('div', abs(80, HY - 96, 220, null, `font:800 38px/1.1 ${SANS};color:${P.ink}`), hero.label);
    const tape = h('div', abs(TX, HY, 10, HH, `background:linear-gradient(${KRAFT},#cdb68e);border-radius:4px;box-shadow:${lift(0.1)};overflow:hidden`));
    tape.dataset.morph = 'ruler';
    const tsvg = h('div', 'position:absolute;left:0;top:0', `<svg width="${TL + 40}" height="${HH}" style="display:block"><path class="tk" fill="none" stroke="${P.graphite}" stroke-width="3" stroke-linecap="round"/></svg>`);
    tape.append(tsvg);
    const tk = tsvg.querySelector('.tk');
    const tab = h('div', abs(0, HY - 8, 22, HH + 16, `background:${P.graphite};border-radius:5px;box-shadow:${lift(0.2)}`));
    const caseEl = h('div', abs(TX - 118, HY - 30, 118, 118, `border-radius:50%;background:radial-gradient(circle at 38% 34%,#5d574e,${P.graphite} 62%);box-shadow:${lift(0.3)}`));
    caseEl.append(h('div', abs(34, 34, 50, 50, 'border-radius:50%;background:#efe8da;box-shadow:inset 3px 4px 6px rgba(0,0,0,.25)')));
    const num = rollNumber({ final: hero.v, fmt: v => v.toFixed(2) + unit, size: 108 });
    const nbox = h('div', abs(0, HY - 140, null, 120, 'display:flex;align-items:center;transform-origin:100% 100%'));
    nbox.append(num.el); nbox.dataset.key = 'value';
    const others = bars.slice(1).map((b, i) => {
      const y = HY + 132 + i * 82;
      const l = h('div', abs(80, y - 2, 180, null, `font:800 36px/1.1 ${SANS};color:${P.ink}`), b.label);
      const t2 = h('div', abs(TX, y, len(b.v), 38, `background:linear-gradient(${KRAFT},#cdb68e);border-radius:4px;box-shadow:${lift(0)};overflow:hidden`),
        `<svg width="${len(b.v)}" height="38" style="display:block"><path fill="none" stroke="${P.graphite}" stroke-width="2.5" stroke-linecap="round" d="${tapeTicks(len(b.v), 38, 50 + i)}"/></svg>`);
      const v = h('div', abs(TX + len(b.v) + 18, y - 4, null, null, `font:900 42px/1.1 ${DISPLAY};color:${P.ink};white-space:nowrap`), b.v.toFixed(2) + unit);
      cam.append(l, t2, v);
      return { els: [l, t2, v], path: t2.querySelector('path'), w: len(b.v), seed: 50 + i };
    });
    // behind everything: the chapter number drawn as a giant pencil outline that boils on twos
    const big = h('div', abs(p.bigX || 600, p.bigY || 380, 600, 900, `font:900 ${p.bigSize || 800}px/1 ${DISPLAY};color:transparent;-webkit-text-stroke:6px rgba(194,56,29,.34);white-space:nowrap;pointer-events:none`), String(p.n || 2));
    cam.prepend(big);
    const ul = pencilLine(300, { seed: 44, width: 12 });
    ul.el.style.left = '84px'; ul.el.style.top = `${(p.headY || 478) + 404}px`;
    cam.append(tl, line1, last, ul.el, lab, tape, tab, caseEl, nbox);
    const twoAt = beat(ctx, 0, 0.12), stillAt = beat(ctx, 1, 1.55), pullAt = beat(ctx, 2, 2.4), landAt = beat(ctx, 3, 4.68);
    const wAt = [wordAt(ctx, 'nothing', 0, stillAt - 0.7), wordAt(ctx, 'sits', 0, stillAt - 0.25)];
    const dropAt = wordAt(ctx, 'seconds', 0, landAt + 0.33);
    const R = rng(3);
    const jit = Array.from({ length: 3 }, () => [(R() - 0.5) * 7, (R() - 0.5) * 6, (R() - 0.5) * 1.6]);
    const value = t => hero.v * prog(t, pullAt, landAt - pullAt);
    return {
      selfEnter: true,
      update(t) {
        const b = boilStep(t);
        tl.style.transform = `scale(${(1 + 0.15 * pulse(t, Math.max(twoAt, fr(12)), fr(2), fr(6))).toFixed(4)})`;
        const bj = jit[(b + 1) % 3];
        big.style.transform = `translate(${(bj[0] * 0.6).toFixed(1)}px,${(bj[1] * 0.6).toFixed(1)}px) rotate(${(bj[2] * 0.5).toFixed(2)}deg)`;
        w1.forEach((el, i) => { const s = slam(t, wAt[i], { from: 1.7, crash: 2, settle: 5 }); el.style.opacity = s.o; el.style.transform = `scale(${s.s.toFixed(4)})`; });
        const s = slam(t, stillAt, { from: 1.5, crash: 3, settle: 6 }), j = jit[b], boil = t > slamHit(stillAt) + fr(6);
        last.style.opacity = s.o;
        last.style.transform = `translate(${boil ? j[0] : 0}px,${boil ? j[1] : 0}px) rotate(${boil ? j[2] : 0}deg) scale(${s.s.toFixed(4)})`;
        ul.update(prog(t, slamHit(stillAt) + fr(2), fr(6)), b);
        const v = value(t), L = Math.max(10, len(v));
        const e = outCubic(prog(t, fr(2), fr(10)));
        for (const el of [lab, caseEl, tab, tape]) el.style.opacity = e.toFixed(3);
        caseEl.style.transform = `rotate(${(-v * 220).toFixed(1)}deg)`;
        tape.style.width = `${L.toFixed(1)}px`;
        tab.style.left = `${(TX + L - 6).toFixed(1)}px`;
        tk.setAttribute('d', tapeTicks(TL + 40, HH, 20 + b));
        num.update(v, value(t + fr(2)), prog(t, landAt, fr(8)) * 1.5);
        const np = prog(t, pullAt - fr(4), fr(6)), land = pulse(t, landAt, fr(2), fr(6));
        nbox.style.opacity = outCubic(np).toFixed(3);
        nbox.style.left = `${Math.max(330, TX + L - (nbox.offsetWidth || 300) + 10).toFixed(1)}px`;
        nbox.style.transform = `scale(${(1 + 0.16 * land).toFixed(4)})`;
        nbox.style.color = t >= landAt ? 'var(--accent)' : '';
        others.forEach((o, i) => {
          const q = prog(t, dropAt + i * fr(4), fr(6)), d = outBack(q, 1.6);
          o.els.forEach(el => { el.style.opacity = clamp(q * 3).toFixed(3); el.style.transform = `translateY(${(-70 * (1 - d)).toFixed(1)}px)`; });
          o.path.setAttribute('d', tapeTicks(o.w, 38, o.seed + b));
        });
      },
      avatar: t => {
        const L = Math.max(10, len(value(t)));
        if (t < pullAt) return { chip: travel(t, [{ t: 0, x: 210, y: (p.headY || 478) + 46 }, { t: pullAt, x: TX + 30, y: HY - 46 }], 108) };
        if (t < landAt + 0.25) return { chip: { x: TX + L + 62, y: HY + HH / 2 + 4 * Math.sin(t * 9), size: 104, tilt: -8, ring: t >= landAt ? prog(t, landAt, fr(9)) : null } };
        return { chip: travel(t, [{ t: 0, x: TX + len(hero.v) + 62, y: HY + HH / 2 }, { t: landAt + 0.25 + fr(9), x: 980, y: HY - 230 }], 104) };
      },
      lamp: t => ({ x: t < pullAt ? 420 : 560, y: t < pullAt ? 760 : HY, k: 1 }),
      cues: [{ t: slamHit(stillAt), sfx: 'pop', gain: 0.6 }, ...Array.from({ length: Math.floor((landAt - pullAt) / 0.2) }, (_, i) => ({ t: pullAt + i * 0.2, sfx: 'tick', gain: 0.22 })),
        { t: landAt, sfx: 'pop', gain: 0.75 }, { t: dropAt, sfx: 'swoosh', gain: 0.4 }],
    };
  },

  // G10 Sound lane (U14 timeline + M10 slam + U22 counter + M16 magnifier): a two-lane editor,
  // picture above and sound below. The cursor paints a sound under every move; the answer
  // slams in over it, then shrinks into a label in the corner (type reacting to type); half
  // the sounds pop off, the count lands, and the camera pushes in on one pair to show the
  // sound starting half a frame before the picture. It pulls back out before the scene ends.
  soundLane(wrap, p, ctx) {
    const cam = stage(wrap);
    const n = p.moves || 12, keep = p.keep || [0, 2, 3, 6, 8, 11], X = 70, Y = p.cardY || 676, CW = 940, CHh = 520;
    const tl = tile(p.n || 3, 92); tl.style.position = 'absolute'; tl.style.left = '908px'; tl.style.top = `${p.headY || 478}px`; tl.dataset.morph = 'tile';
    const ruler = h('div', abs(X, Y - 74, CW, 54, `background:linear-gradient(${KRAFT},#cdb68e);border-radius:5px;box-shadow:${lift(0.1)};overflow:hidden`),
      `<svg width="${CW}" height="54" style="display:block"><path fill="none" stroke="${P.graphite}" stroke-width="3" stroke-linecap="round" d="${tapeTicks(CW, 54, 71)}"/></svg>`);
    ruler.dataset.morph = 'ruler';
    const card = h('div', abs(X, Y, CW, CHh, paperCss(34)));
    const lbl = (tx, y) => h('div', abs(34, y, 300, null, `font:800 32px/1 ${SANS};letter-spacing:.1em;color:${P.muted}`), tx);
    card.append(lbl('PICTURE', 26), lbl('SOUND', 206));
    const MX = i => 40 + i * 74, MY = 72, BY = 254;
    const lines = h('div', 'position:absolute;inset:0', `<svg width="${CW}" height="${CHh}" style="position:absolute;left:0;top:0">${Array.from({ length: n }, (_, i) => `<line class="ln" x1="${MX(i) + 27}" y1="${MY + 96}" x2="${MX(i) + 27}" y2="${BY - 4}" stroke="${P.graphite}" stroke-width="3" stroke-dasharray="6 7" opacity=".35"/>`).join('')}</svg>`);
    card.append(lines);
    const lnEls = [...lines.querySelectorAll('.ln')];
    const R = rng(5);
    const marks = Array.from({ length: n }, (_, i) => {
      const m = h('div', abs(MX(i), MY, 54, 92, `border-radius:9px;background:linear-gradient(160deg,#fffdf8,#f0eadd);box-shadow:inset 0 0 0 3px ${P.graphite},${lift(0)}`));
      m.append(h('div', abs(9, 18 + R() * 30, 36, 24, `border-radius:4px;background:${i % 3 ? '#cfc6b3' : P.graphite}`)));
      m.dataset.morph = `mk${i}`;
      card.append(m);
      return m;
    });
    const blips = Array.from({ length: n }, (_, i) => {
      const b = h('div', abs(MX(i), BY, 54, 46, `border-radius:23px;background:var(--accent);display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:${lift(0.1)}`),
        [10, 22, 14, 26, 12].map(hh => `<i style="display:block;width:4px;height:${hh}px;border-radius:2px;background:#fffdf8"></i>`).join(''));
      card.append(b);
      return b;
    });
    const stat = rollNumber({ final: 103, size: 92 });
    const sbox = h('div', abs(34, 352, 600, 100, 'display:flex;align-items:center;gap:16px'));
    sbox.append(stat.el, h('div', `font:900 56px/1 ${DISPLAY};color:${P.ink}`, `of ${p.of || 210}`));
    const scap = h('div', abs(36, 456, 700, null, `font:700 34px/1.1 ${SANS};color:${P.muted}`), p.statLabel || 'moves with a sound');
    card.append(sbox, scap);
    const early = h('div', abs(0, 0, null, 60, `padding:0 24px;border-radius:30px;background:${P.ink};display:flex;align-items:center;font:800 34px/1 ${SANS};color:#fffdf8;white-space:nowrap;box-shadow:${lift(0.4)}`), p.early || 'half a frame early');
    early.dataset.key = 'early';
    const fline = h('div', abs(0, MY - 10, 5, BY - MY + 60, 'background:var(--accent);border-radius:3px'));
    card.append(fline, early);
    const no = h('div', abs(0, 780, 1080, null, `text-align:center;font:900 ${p.slamSize || 260}px/1 ${DISPLAY};letter-spacing:-9px;color:var(--accent);transform-origin:540px 130px`), p.slam || 'NO.');
    no.dataset.key = 'answer';
    cam.append(ruler, card, tl);
    wrap.append(no);                       // the answer stays put while the camera pushes in
    const threeAt = beat(ctx, 0, 0.12), everyAt = beat(ctx, 1, 1.54), noAt = beat(ctx, 2, 2.5), halfAt = beat(ctx, 3, 3.6), hairAt = beat(ctx, 4, 5.2);
    const onlyAt = wordAt(ctx, 'only', 0, noAt + 0.76), backAt = Math.min(ctx.dur - fr(16), hairAt + 1.0);
    const paint = i => everyAt + i * fr(1.5);
    const gone = i => !keep.includes(i);
    const order = [...Array(n).keys()].filter(gone);
    const Z = 6, zx = X + MX(Z) + 27, zy = Y + (MY + BY) / 2 + 30;
    const zoomK = t => outCubic(prog(t, hairAt, fr(12))) * (1 - inOutCubic(prog(t, backAt, fr(10))));
    return {
      selfEnter: true,
      update(t) {
        const e = outCubic(prog(t, fr(1), fr(9)));
        card.style.opacity = e.toFixed(3);
        card.style.transform = `translateY(${(50 * (1 - outBack(prog(t, fr(1), fr(10)), 1.2))).toFixed(1)}px)`;
        tl.style.transform = `scale(${(1 + 0.15 * pulse(t, Math.max(threeAt, fr(14)), fr(2), fr(6))).toFixed(4)})`;
        marks.forEach((m, i) => { const q = prog(t, fr(3 + i), fr(6)); m.style.opacity = clamp(q * 3).toFixed(3); m.style.transform = `translateY(${(-24 * (1 - outBack(q, 2))).toFixed(1)}px)`; });
        blips.forEach((b, i) => {
          const q = prog(t, paint(i), fr(5)), off = gone(i) ? prog(t, halfAt + order.indexOf(i) * fr(2), fr(6)) : 0;
          const kept = !gone(i) ? pulse(t, halfAt + fr(12), fr(2), fr(6)) : 0;
          b.style.opacity = (clamp(q * 3) * (1 - off)).toFixed(3);
          b.style.transform = `translate(${i === Z ? (-14 * zoomK(t)).toFixed(1) : 0}px,${(-50 * outCubic(off)).toFixed(1)}px) scale(${(q <= 0 ? 0.3 : outBack(q, 2.4) * (1 - 0.5 * off) * (1 + 0.12 * kept)).toFixed(4)})`;
          lnEls[i].setAttribute('opacity', ((0.35 * clamp(q * 2)) * (1 - off)).toFixed(3));
        });
        const s = slam(t, noAt, { from: 1.6, crash: 3, settle: 7 }), fly = inOutCubic(prog(t, onlyAt, fr(9)));
        no.style.opacity = (s.o * (1 - 0.0 * fly)).toFixed(3);
        no.style.transform = `translate(${(-322 * fly).toFixed(1)}px,${(-402 * fly).toFixed(1)}px) scale(${(s.s * lerp(1, 0.39, fly)).toFixed(4)})`;
        const sp = prog(t, halfAt, fr(14));
        sbox.style.opacity = scap.style.opacity = clamp(sp * 4).toFixed(3);
        stat.update(103 * outCubic(sp), 103 * outCubic(prog(t + fr(1), halfAt, fr(14))), prog(t, halfAt + fr(14), fr(8)) * 1.5);
        const zk = zoomK(t);
        cam.style.transformOrigin = `${zx}px ${zy}px`;
        cam.style.transform = `scale(${(1 + 0.6 * zk).toFixed(4)})`;
        fline.style.left = `${MX(Z) - 1}px`; fline.style.opacity = clamp(zk * 2).toFixed(3);
        const ep = prog(t, hairAt + fr(6), fr(6));
        early.style.left = `${MX(Z) - 120}px`; early.style.top = `${BY + 62}px`;
        early.style.opacity = (clamp(ep * 3) * clamp(zk * 3)).toFixed(3);
        early.style.transform = `scale(${(ep <= 0 ? 0.5 : 0.75 * outBack(ep, 2)).toFixed(4)})`;
        early.style.transformOrigin = '50% 0';
      },
      avatar: t => {
        if (t >= everyAt - fr(9) && t < paint(n - 1) + fr(4)) {
          const k = prog(t, everyAt, paint(n - 1) - everyAt);
          return { chip: { x: X + lerp(MX(0), MX(n - 1), k) + 27, y: Y + BY - 40 - 10 * Math.abs(Math.sin(t * 14)), size: 104, tilt: 10 } };
        }
        return { chip: travel(t, [{ t: 0, x: 860, y: (p.headY || 478) + 46 }, { t: everyAt, x: X + MX(0) + 27, y: Y + BY - 40 }, { t: paint(n - 1) + fr(13), x: 960, y: Y + 30 },
          { t: halfAt + fr(10), x: 660, y: Y + 400 }, { t: backAt + fr(12), x: 960, y: Y + 30 }], 104) };
      },
      lamp: t => ({ x: t < hairAt ? 540 : zx, y: t < noAt ? Y + 200 : zy, k: 1 }),
      cues: [{ t: everyAt, sfx: 'swoosh', gain: 0.45 }, { t: slamHit(noAt), sfx: 'impact', gain: 0.7 }, { t: halfAt, sfx: 'pop', gain: 0.6 }, { t: halfAt + fr(14), sfx: 'tick', gain: 0.5 },
        { t: hairAt, sfx: 'click', gain: 0.55 }],
    };
  },

  // G11 Tally dots (M20 objects become the furniture + U11 checklist + M23 follow tap): twelve
  // dots, carried in from the scene before, are sorted into the rows they belong to on the
  // beats; each row's count rolls as its dots land and the row acts out its ending (a word is
  // typed, Follow becomes Following, a line just stops); the winning row is ticked last.
  tallyDots(wrap, p, ctx) {
    const cam = stage(wrap);
    const rows = p.rows || [], of = p.of || 12, X = 70, CW = 900;
    const tl = tile(p.n || 4, 92); tl.style.position = 'absolute'; tl.style.left = '80px'; tl.style.top = `${p.headY || 478}px`; tl.dataset.morph = 'tile';
    const title = h('div', abs(196, (p.headY || 478) + 6, 860, null, `font:900 ${p.titleSize || 84}px/1 ${DISPLAY};letter-spacing:-2.5px;color:${P.ink};white-space:nowrap`), (p.title || 'The ending').toUpperCase());
    title.dataset.key = 'title';
    const DY = p.dotsY || 622, dotX = i => 120 + i * 72;
    const RY = [716, 926, 1106], RH = [190, 160, 160];
    const icons = {
      comment: '<path d="M10 14 h44 a6 6 0 0 1 6 6 v24 a6 6 0 0 1 -6 6 h-26 l-12 10 v-10 h-6 a6 6 0 0 1 -6 -6 v-24 a6 6 0 0 1 6 -6z" fill="none" stroke="#1b1a17" stroke-width="5" stroke-linejoin="round"/>',
      follow: '<circle cx="26" cy="22" r="10" fill="none" stroke="#1b1a17" stroke-width="5"/><path d="M8 54 c2-14 34-14 36 0" fill="none" stroke="#1b1a17" stroke-width="5" stroke-linecap="round"/><path d="M50 22 v16 M42 30 h16" stroke="#1b1a17" stroke-width="5" stroke-linecap="round"/>',
      stop: '<rect x="14" y="14" width="36" height="36" rx="6" fill="none" stroke="#1b1a17" stroke-width="5"/>',
    };
    const slotXY = (r, k) => [X + 120 + k * 50 + 19, RY[r] + (r ? 104 : 120) + 19];
    const built = rows.map((r, i) => {
      const c = h('div', abs(X, RY[i], CW, RH[i], paperCss(30)));
      c.append(h('div', abs(30, 26, 64, 64), `<svg viewBox="0 0 64 64" width="64" height="64">${icons[r.icon] || icons.comment}</svg>`),
        h('div', abs(118, 30, 520, null, `font:800 46px/1.1 ${SANS};letter-spacing:-.5px;color:${P.ink};white-space:nowrap`), r.label));
      for (let k = 0; k < r.n; k++) c.append(h('div', abs(120 + k * 50, (i ? 104 : 120), 38, 38, 'border-radius:50%;box-shadow:inset 2px 3px 5px rgba(70,52,25,.28);background:#e9e2d3')));
      const cnt = h('div', abs(CW - 340, 28, 270, null, `text-align:right;font:900 56px/1 ${DISPLAY};color:${P.ink};white-space:nowrap`), '');
      c.append(cnt);
      cam.append(c);
      return { c, cnt, r };
    });
    built.forEach(b => { b.c.dataset.key = 'row'; });
    // row acts: a typed word, a Follow button, a line that just stops
    const field = h('div', abs(596, 104, 270, 64, `border-radius:32px;background:#fff;box-shadow:inset 3px 4px 8px rgba(70,52,25,.16);display:flex;align-items:center;padding:0 24px;font:800 36px/1 ${SANS};letter-spacing:2px;color:${P.ink}`));
    const ty = E.typer(p.typed || 'WORD', { cps: 12 }); field.append(ty.el);
    if (built[0]) built[0].c.append(field);
    const fb = h('div', abs(616, 86, 250, 66, `border-radius:33px;display:flex;align-items:center;justify-content:center;font:800 34px/1 ${SANS}`));
    if (built[1]) built[1].c.append(fb);
    const stopLine = pencilLine(360, { seed: 61, width: 10, color: P.graphite });
    stopLine.el.style.left = '260px'; stopLine.el.style.top = '110px';
    const stopBar = h('div', abs(616, 92, 10, 60, `border-radius:4px;background:${P.ink};opacity:0`));
    if (built[2]) built[2].c.append(stopLine.el, stopBar);
    const tick = E.badge('tick', 84); tick.el.style.left = `${CW - 62}px`; tick.el.style.top = '-36px';
    if (built[0]) built[0].c.append(tick.el);
    const dots = Array.from({ length: of }, (_, i) => {
      const d = h('div', abs(dotX(i), DY, 46, 46, `border-radius:50%;background:var(--accent);box-shadow:inset -3px -4px 6px rgba(60,15,5,.25),${lift(0)}`));
      d.dataset.morph = `mk${i}`;
      return { d, blur: blurrer() };
    });
    cam.append(tl, title, ...dots.map(d => d.d));
    const fourAt = beat(ctx, 0, 0.1), endAt = wordAt(ctx, 'ending', 0, 1.08), B = [beat(ctx, 1, 1.87), beat(ctx, 2, 4.98), beat(ctx, 3, 6.4)];
    const typeAt = wordAt(ctx, 'word', 0, B[0] + 1.6), followAt = wordAt(ctx, 'follow', 0, B[1] + 0.6), stopAt = wordAt(ctx, 'stop', 0, B[2] + 0.9);
    const winAt = Math.min(ctx.dur - 0.45, stopAt + 0.55);
    // which row and slot each dot goes to, and when it leaves
    const plan = []; let di = 0;
    rows.forEach((r, ri) => { for (let k = 0; k < r.n && di < of; k++, di++) plan.push({ ri, k, at: B[ri] + k * fr(2) }); });
    const landed = (ri, t) => plan.filter(q => q.ri === ri && t >= q.at + fr(7)).length;
    return {
      selfEnter: true,
      update(t) {
        tl.style.transform = `scale(${(1 + 0.15 * pulse(t, Math.max(fourAt, fr(16)), fr(2), fr(6))).toFixed(4)})`;
        maskIn(title, t, endAt - fr(2), { dur: 8 });
        built.forEach((b, i) => {
          const q = prog(t, fr(4 + 3 * i), fr(8)), e = outBack(q, 1.3);
          b.c.style.opacity = clamp(q * 3).toFixed(3);
          b.c.style.transform = `translateY(${(70 * (1 - e)).toFixed(1)}px)`;
          const nL = landed(i, t);
          b.cnt.textContent = nL ? `${nL} of ${of}` : '';
          b.cnt.style.transform = `scale(${(1 + 0.2 * Math.max(...plan.filter(q2 => q2.ri === i).map(q2 => pulse(t, q2.at + fr(7), fr(1), fr(4))), 0)).toFixed(4)})`;
          b.cnt.style.transformOrigin = '100% 50%';
          const dim = i > 0 ? 0.45 * outCubic(prog(t, winAt, fr(8))) : 0;
          b.c.style.opacity = (clamp(q * 3) * (1 - dim)).toFixed(3);
        });
        if (built[0]) {
          built[0].c.style.outline = t >= winAt ? `${(6 * outCubic(prog(t, winAt, fr(6)))).toFixed(1)}px solid var(--accent)` : 'none';
          built[0].c.style.transform += ` scale(${(1 + 0.03 * outCubic(prog(t, winAt, fr(8)))).toFixed(4)})`;
        }
        ty.update(t - typeAt);
        const fp = prog(t, typeAt - fr(4), fr(5));          // the field appears only when it is about to be typed in
        field.style.opacity = clamp(fp * 3).toFixed(3);
        field.style.transform = `scale(${fp <= 0 ? 0.6 : outBack(fp, 2).toFixed(4)})`;
        const on = t >= followAt;
        fb.textContent = on ? 'Following' : 'Follow';
        fb.style.background = on ? 'transparent' : 'var(--accent)'; fb.style.color = on ? P.ink : '#fffdf8';
        fb.style.border = `4px solid ${on ? P.ink : 'var(--accent)'}`;
        fb.style.transform = `scale(${(1 - 0.1 * pulse(t, followAt, fr(1), fr(4))).toFixed(4)})`;
        stopLine.update(Math.min(0.98, prog(t, stopAt - fr(8), fr(9))));
        stopBar.style.opacity = t >= stopAt + fr(1) ? 1 : 0;
        stopBar.style.transform = `scaleY(${(1 + 0.4 * pulse(t, stopAt + fr(1), fr(1), fr(4))).toFixed(3)})`;
        tick.update(prog(t, winAt + fr(2), fr(6)));
        dots.forEach((d, i) => {
          const q = plan[i], home = [dotX(i) + 23, DY + 23];
          let x = home[0], y = home[1], s = 1, u = 0, xp = x, yp = y;
          if (q) {
            const to = slotXY(q.ri, q.k), f = prog(t, q.at, fr(10)), f1 = prog(t - fr(1), q.at, fr(10));
            u = heroTravel(f, 10);
            [x, y] = arc(home[0], home[1], to[0], to[1], u, 0.25);
            [xp, yp] = arc(home[0], home[1], to[0], to[1], heroTravel(f1, 10), 0.25);
            s = lerp(1, 38 / 46, clamp(u));
          }
          d.d.style.transform = `translate(${(x - home[0]).toFixed(1)}px,${(y - home[1]).toFixed(1)}px) scale(${s.toFixed(4)})`;
          d.d.style.boxShadow = `inset -3px -4px 6px rgba(60,15,5,.25),${lift(Math.sin(Math.PI * clamp(u)) * 0.9)}`;
          d.blur(d.d, Math.abs(x - xp) * 0.06, Math.abs(y - yp) * 0.06);
        });
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 980, y: (p.headY || 478) + 40 }, { t: typeAt, x: X + 600, y: RY[0] + 62 }, { t: followAt, x: X + 880, y: RY[1] + 112 },
        { t: stopAt, x: X + 600, y: RY[2] + 70 }, { t: winAt, x: X + 40, y: RY[0] - 18 }], 104) }),
      lamp: t => ({ x: 540, y: t < B[1] - 0.3 ? RY[0] + 90 : t < B[2] - 0.3 ? RY[1] + 80 : t < winAt ? RY[2] + 80 : RY[0] + 90, k: 1 }),
      cues: [{ t: B[0], sfx: 'swoosh', gain: 0.45 }, ...[0, 1, 2, 3].map(k => ({ t: typeAt + k / 12, sfx: 'tick', gain: 0.3 })), { t: B[1] + fr(7), sfx: 'pop', gain: 0.55 },
        { t: followAt, sfx: 'click', gain: 0.7 }, { t: B[2] + fr(7), sfx: 'pop', gain: 0.5 }, { t: stopAt + fr(1), sfx: 'stamp', gain: 0.6 }, { t: winAt + fr(2), sfx: 'pop', gain: 0.7 }],
    };
  },

  // G12 Save tap (A06 avatar returns large + M10 slam + U-button press): the large avatar rises
  // back with an overshoot, the claim slams in word by word, and the Save button is pressed on
  // the word: it fills with the accent and its bookmark fills. The button is what the next
  // scene's comment field grows out of (data-morph "pill").
  saveTap(wrap, p, ctx) {
    const cam = stage(wrap);
    const words = String(p.title || 'Save this.').split(' ');
    const row = h('div', abs(0, p.titleY || 1112, 1080, 150, `display:flex;justify-content:center;gap:34px;font:900 ${p.titleSize || 136}px/1 ${DISPLAY};letter-spacing:-5px;color:${P.ink};white-space:nowrap`));
    const wEls = words.map(w => { const e = h('div', 'transform-origin:50% 70%', w); e.dataset.key = 'title'; row.append(e); return e; });
    const btn = h('div', abs(330, p.buttonY || 1300, 420, 112, `${paperCss(56)}display:flex;align-items:center;justify-content:center;gap:22px;font:800 50px/1 ${SANS};color:${P.ink}`));
    const icon = h('div', '', '<svg viewBox="0 0 40 52" width="40" height="52"><path class="bm" d="M5 4 H35 V48 L20 36 L5 48 Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>');
    const label = h('div', '', p.button || 'Save');
    btn.append(icon, label); btn.dataset.morph = 'pill'; btn.dataset.key = 'button';
    const rp = E.ripple(260); rp.el.style.left = '540px'; rp.el.style.top = `${(p.buttonY || 1300) + 56}px`;
    cam.append(row, btn, rp.el);
    const at = Math.max(beat(ctx, 0, 0.09), fr(4)), thisAt = Math.max(wordAt(ctx, 'this', 0, at + 0.33), at + fr(5)), pressAt = wordAt(ctx, 'edit', 0, at + 1.1);
    const bm = icon.querySelector('.bm');
    return {
      selfEnter: true,
      update(t) {
        wEls.forEach((el, i) => { const s = slam(t, i ? thisAt : at, { from: i ? 1.6 : 2.2, crash: 3, settle: 6 }); el.style.opacity = s.o; el.style.transform = `scale(${s.s.toFixed(4)})`; });
        const bq = prog(t, fr(3), fr(9));
        const on = t >= pressAt;
        btn.style.opacity = clamp(bq * 3).toFixed(3);
        btn.style.transform = `translateY(${(60 * (1 - outBack(bq, 1.5))).toFixed(1)}px) scale(${(1 - 0.08 * pulse(t, pressAt, fr(1), fr(4))).toFixed(4)})`;
        btn.style.background = on ? 'var(--accent)' : '';
        btn.style.color = on ? '#fffdf8' : P.ink;
        label.textContent = on ? (p.done || 'Saved') : (p.button || 'Save');
        bm.setAttribute('fill', on ? 'currentColor' : 'none');
        rp.update(prog(t, pressAt, fr(9)));
      },
      avatar: t => ({ bust: { x: 540, y: (p.avatarY || 820) + (1 - outBack(prog(t, -fr(1), fr(10)), 1.3)) * 120, w: 470, o: outCubic(prog(t, -fr(1), fr(4))), tilt: -4 * pulse(t, pressAt, fr(3), fr(8)) } }),
      lamp: () => ({ x: 540, y: 900, k: 1 }),
      cues: [{ t: slamHit(at), sfx: 'pop', gain: 0.6 }, { t: pressAt, sfx: 'click', gain: 0.8 }],
    };
  },
};
