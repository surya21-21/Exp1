// Transitions of the motion pack. Each one carries: any data-morph pairs fly across on top
// of it (G01), so something of the old scene always becomes something of the new one.
// Contract: name -> (overlay, ctx, info) => { lead, settle, both, sfx, gain, apply(p, out, inn, at, win), off() }.
// Options come from the incoming scene's props: "carry": { lead, settle, stagger }, "wipe": "WORD".
import { FPS, fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack } from '../../../collection/lib/ease.js';
import { P, h, W, H } from '../../../collection/lib/paper.js';
import { DISPLAY, blurrer } from './kit.js';
import { morpher, packSlot, stageOrigin, rectOf, sceneClone, leave, arrive } from './morph.js';

const opts = info => (info && info.to && info.to.props) || {};
const cover = (x, y) => Math.hypot(Math.max(x, W - x), Math.max(y, H - y));

export const TRANSITIONS = {
  // G01 shared-element morph. The carried elements travel; the rest of the old scene sinks
  // back and fades in the first 60% of the window, the new scene builds itself around them.
  morphCarry(ov, ctx, info) {
    const o = opts(info).carry || {};
    const lead = o.lead ?? 6, settle = o.settle ?? 10, pb = lead / (lead + settle);
    const M = morpher(packSlot(ov), ctx, { lead, settle, stagger: o.stagger ?? 2, bend: o.bend ?? 0.16 });
    return {
      lead, settle, both: true, sfx: 'swoosh', gain: 0.55,
      apply(p, out, inn, at, win) {
        M.measure(out, inn, opts(info));
        leave(out, win, p / Math.min(1, pb + 0.25));
        arrive(inn, win, prog(p, pb - 0.05, 0.5), p >= pb - 1e-6);
        M.draw(p);
      },
      off() { M.off(); },
    };
  },

  // G04 dot zoom (from T10 iris, T05 ramp, T18 card becomes background): the camera dives into
  // the full stop marked data-zoom in the old scene; the dot swells until the frame is inside
  // it, then shrinks onto the element marked data-zoom in the new scene (a badge, a card),
  // overshooting and settling, while the new scene pulls back out around it.
  dotZoom(ov, ctx, info) {
    const o = opts(info).carry || {};
    const lead = o.lead ?? 8, settle = o.settle ?? 10, N = lead + settle, pb = lead / N;
    const slot = packSlot(ov);
    const disc = h('div', 'position:absolute;left:0;top:0;border-radius:50%;display:none');
    slot.append(disc);
    const M = morpher(slot, ctx, { lead, settle, stagger: 2 });
    const blurOut = blurrer();
    let touched = [];
    return {
      lead, settle, both: true, sfx: 'whoosh', gain: 0.6,
      apply(p, out, inn, at, win) {
        const og = stageOrigin(out);
        const a = out.querySelector('[data-zoom]'), b = inn.querySelector('[data-zoom]');
        const ra = a ? rectOf(a, og) : { x: 520, y: 940, w: 40, h: 40 }, rb = b ? rectOf(b, og) : { x: 520, y: 940, w: 40, h: 40 };
        const colA = a ? getComputedStyle(a).backgroundColor : P.ink, colB = b ? getComputedStyle(b).backgroundColor : colA;
        M.measure(out, inn, opts(info));
        for (const el of [a, b]) if (el) { el.style.visibility = 'hidden'; touched.push(el); }
        inn.style.zIndex = '';
        const cx = ra.x + ra.w / 2, cy = ra.y + ra.h / 2;
        let x, y, r, col;
        if (p < pb) {
          // the camera pushes in on the dot, speeding up (a ramp), and the dot swells faster still
          const k = p / pb, e = inCubic(k), s = 1 + 1.8 * e;
          const tx = (540 - cx) * 0.55 * e, ty = (960 - cy) * 0.55 * e;
          out.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
          out.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
          blurOut(out, 9 * e * e, 9 * e * e);
          inn.style.visibility = 'hidden';
          x = cx + tx; y = cy + ty;
          r = lerp((ra.w / 2) * s, cover(x, y) * 1.02, inCubic(prog(k, 0.3, 0.7)));
          col = colA;
        } else {
          // the frame is inside the dot; it shrinks onto the new scene's badge
          const k = (p - pb) / (1 - pb), e = outBack(k, 1.25), m = outCubic(k);
          out.style.visibility = 'hidden';
          const bx = rb.x + rb.w / 2, by = rb.y + rb.h / 2;
          x = lerp(540, bx, m); y = lerp(960, by, m);
          r = Math.max(rb.w / 2 * 0.5, lerp(cover(540, 960) * 1.02, rb.w / 2, e));
          const s = lerp(1.14, 1, m);
          inn.style.transformOrigin = `${bx.toFixed(1)}px ${by.toFixed(1)}px`;
          inn.style.transform = `scale(${s.toFixed(4)})`;
          col = colB;
        }
        disc.style.cssText = `position:absolute;left:0;top:0;width:${(2 * r).toFixed(1)}px;height:${(2 * r).toFixed(1)}px;border-radius:50%;background:${col};` +
          `transform:translate(${(x - r).toFixed(1)}px,${(y - r).toFixed(1)}px);box-shadow:inset ${(-0.04 * r).toFixed(1)}px ${(-0.05 * r).toFixed(1)}px ${(0.12 * r).toFixed(1)}px rgba(60,15,5,.22),${(0.03 * r + 4).toFixed(1)}px ${(0.05 * r + 6).toFixed(1)}px ${(0.06 * r + 10).toFixed(1)}px rgba(70,52,25,.3)`;
        M.draw(p);
      },
      off() { disc.style.display = 'none'; for (const el of touched) el.style.visibility = ''; touched = []; M.off(); },
    };
  },

  // G02 type wipe (from C06 oversize moving type, T09 highlight grows into background): a giant
  // word with a paper cut edge slides in fast from the right, blurred, and slows as it crosses;
  // the next scene is seen inside its letters. Then the camera dives into one letter until the
  // new scene fills the frame. The word comes from "wipe" in the incoming scene's props;
  // "wipeAt": [letter, fx, fy] picks the point inside a letter the dive goes through.
  typeWipe(ov, ctx, info) {
    const pr = opts(info), word = String(pr.wipe || 'NEXT').toUpperCase(), at = pr.wipeAt || [0, 0.5, 0.62];
    const o = pr.carry || {};
    const lead = o.lead ?? 4, settle = o.settle ?? 15, N = lead + settle, pb = lead / N;
    const id = `mgwipe${info.index}`, SIZE = 600;
    const slot = packSlot(ov);
    const svg = h('div', 'position:absolute;left:0;top:0;width:1080px;height:1920px;display:none;pointer-events:none',
      `<svg width="1080" height="1920" viewBox="0 0 1080 1920" style="overflow:visible;display:block"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse">` +
      `<text class="c" x="0" y="0" font-family="Inter Display, Inter, sans-serif" font-weight="900" font-size="${SIZE}" letter-spacing="-18">${word}</text></clipPath></defs>` +
      `<text class="e" x="0" y="0" font-family="Inter Display, Inter, sans-serif" font-weight="900" font-size="${SIZE}" letter-spacing="-18" fill="none" stroke="#fffdf8" stroke-linejoin="round" style="filter:drop-shadow(8px 14px 12px rgba(70,52,25,.38))">${word}</text></svg>`);
    slot.append(svg);
    const M = morpher(slot, ctx, { lead, settle, stagger: 2 });
    const tc = svg.querySelector('.c'), te = svg.querySelector('.e'), blurW = blurrer();
    let geo = null;
    return {
      lead, settle, both: true, sfx: 'whoosh', gain: 0.6,
      apply(p, out, inn, at2, win) {
        svg.style.display = 'block';
        if (!geo) {                                          // measured once, after the fonts are in
          const bb = te.getBBox(), ch = te.getExtentOfChar(Math.min(at[0], word.length - 1));
          geo = { x: bb.x, w: bb.width, top: bb.y, hgt: bb.height, px: ch.x + ch.width * at[1], py: bb.y + bb.height * at[2] };
        }
        M.measure(out, inn, pr);
        inn.style.zIndex = '';
        // slide: from off the right edge to centred, decelerating; then a dive into one letter
        const slideK = clamp(p / 0.42), sx = lerp(W + 40, (W - geo.w) / 2 - geo.x, outCubic(slideK)) - 30 * slideK;
        const baseY = 960 - (geo.top + geo.hgt / 2);
        const k2 = prog(p, 0.42, 0.58), s = Math.exp(Math.log(28) * inCubic(k2));
        // the dive keeps the chosen point of the letter fixed on screen while the word grows
        const fx = sx + geo.px, fy = baseY + geo.py;
        const tf = `translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${s.toFixed(4)}) translate(${(-fx).toFixed(1)} ${(-fy).toFixed(1)}) translate(${sx.toFixed(1)} ${baseY.toFixed(1)})`;
        tc.setAttribute('transform', tf);
        te.setAttribute('transform', tf);
        te.setAttribute('stroke-width', (16 / s).toFixed(2));
        te.style.opacity = (1 - prog(k2, 0.55, 0.45)).toFixed(3);
        inn.style.clipPath = p >= 1 ? '' : `url(#${id})`;
        // the old scene drifts left more slowly than the word (parallax) and dims a little
        out.style.transform = `translateX(${(-60 * outCubic(slideK)).toFixed(1)}px)`;
        out.style.opacity = (1 - 0.15 * slideK).toFixed(3);
        blurW(svg, Math.abs(outCubic(slideK) - outCubic(clamp((p - 1 / N) / 0.42))) * (W + 40 - (W - geo.w) / 2) * 0.05, 0);
        M.draw(p);
      },
      off() { svg.style.display = 'none'; M.off(); },
    };
  },

  // G03 blind flip (from T11 blind wipe, T04 two-step timing): the frame breaks into vertical
  // strips of paper that turn over one after another, left to right, 1 frame apart; each strip
  // carries a slice of the old scene on its front and of the new one on its back. Strips lift
  // toward the camera as they turn and cast a shadow down and to the right; the face turning
  // away from the light darkens (form shading).
  blindFlip(ov, ctx, info) {
    const o = opts(info).carry || {};
    const n = o.strips ?? 6, lead = o.lead ?? 6, settle = o.settle ?? 10, N = lead + settle, turn = o.turn ?? 9;
    const gap = (N - turn) / Math.max(1, n - 1), SW = W / n;
    const slot = packSlot(ov);
    const box = h('div', 'position:absolute;inset:0;perspective:2600px;perspective-origin:50% 45%;display:none;pointer-events:none');
    slot.append(box);
    const strips = Array.from({ length: n }, (_, k) => {
      const shadow = h('div', `position:absolute;left:${k * SW}px;top:0;width:${SW}px;height:${H}px;background:rgba(70,52,25,.5);filter:blur(18px);opacity:0`);
      const s = h('div', `position:absolute;left:${k * SW}px;top:0;width:${SW}px;height:${H}px;transform-style:preserve-3d;transform-origin:50% 50%`);
      const face = back => h('div', `position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;${back ? 'transform:rotateY(180deg);' : ''}`);
      const f = face(false), b = face(true);
      const fs = h('div', 'position:absolute;inset:0;pointer-events:none'), bs = h('div', 'position:absolute;inset:0;pointer-events:none');
      const fh = h('div', 'position:absolute;inset:0'), bh = h('div', 'position:absolute;inset:0');
      f.append(fh, fs); b.append(bh, bs); s.append(f, b);
      box.append(shadow, s);
      return { s, shadow, fh, bh, fs, bs };
    });
    const M = morpher(slot, ctx, { lead, settle, stagger: 2 });
    return {
      lead, settle, both: true, sfx: 'swoosh', gain: 0.6,
      apply(p, out, inn, at, win) {
        M.measure(out, inn, opts(info));
        box.style.display = 'block';
        strips.forEach((st, k) => {
          const q = clamp((p * N - k * gap) / turn), e = inOutCubic(q), th = 180 * e, sn = Math.sin(Math.PI * e);
          st.fh.replaceChildren(sceneClone(out, -k * SW, 0));
          st.bh.replaceChildren(sceneClone(inn, -k * SW, 0));
          st.s.style.transform = `translateZ(${(70 * sn).toFixed(1)}px) rotateY(${(-th).toFixed(2)}deg)`;
          // the face swinging away from the top-left light darkens; the other side stays lit
          // mid-turn each strip is a slat of paper (transparent at rest, so the hand-over is exact)
          const dark = `rgba(70,52,25,${(0.42 * sn).toFixed(3)})`, slat = `rgba(244,239,229,${sn.toFixed(3)})`;
          st.fh.parentNode.style.background = slat; st.bh.parentNode.style.background = slat;
          st.fs.style.background = `linear-gradient(90deg,rgba(255,250,235,${(0.18 * sn).toFixed(3)}),${dark})`;
          st.bs.style.background = `linear-gradient(90deg,${dark},rgba(255,250,235,${(0.1 * sn).toFixed(3)}))`;
          st.shadow.style.opacity = (0.55 * sn).toFixed(3);
          st.shadow.style.transform = `translate(${(18 * sn).toFixed(1)}px,${(30 * sn).toFixed(1)}px) scaleX(${(0.25 + 0.75 * Math.abs(Math.cos(Math.PI * e))).toFixed(3)})`;
        });
        out.style.visibility = 'hidden'; inn.style.visibility = 'hidden'; inn.style.zIndex = '';
        M.draw(p);
      },
      off() { box.style.display = 'none'; for (const st of strips) { st.fh.replaceChildren(); st.bh.replaceChildren(); } M.off(); },
    };
  },
};
