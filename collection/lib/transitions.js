// Scene transitions. Each is make(overlay, ctx) -> { lead, settle, both, sfx, apply(p, out, inn), off() }.
// lead / settle are frames before and after the scene boundary (measured in the
// reference reels; see ../recipes/transitions.md). p runs 0..1 across the window.
// `both` = the two scenes are visible together (incoming on top); otherwise the
// engine swaps them at the boundary. ctx.blur(el, x, y) gives directional motion blur.
import { clamp, lerp, inCubic, outCubic, inOutCubic, outBack } from './ease.js';
import { P, h, tornLine, pts, W, H } from './paper.js';

const move = (el, x, y, extra = '') => { el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) ${extra}`; };

export const TRANSITIONS = {
  // T01 / T02: the swap happens on one frame; the new scene's own entrances are the settle.
  cut: () => ({ lead: 0, settle: 0, both: false, sfx: null, apply() {}, off() {} }),

  // N01 paper tear (our signature; timing from T03 and T04): a torn sheet crosses in 2-3
  // frames, covers the frame for 3, and clears in 2-3, with a strip of accent paper behind it.
  tear(ov, ctx) {
    const SK = 420, SW = 1700, y0 = -90, y1 = H + 90;
    const sheet = pts([...tornLine(SK, y0, 0, y1, 5, 16), ...tornLine(SW, y1, SW + SK, y0, 9, 16)]);
    const strip = pts([...tornLine(SK - 330, y0, -330, y1, 3, 12), ...tornLine(-190, y1, SK - 190, y0, 4, 12)]);
    const el = h('div', 'position:absolute;left:0;top:0;display:none',
      `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block"><defs>` +
      `<pattern id="fib" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-11)"><path d="M0 12 H46 M0 35 H30" stroke="rgba(110,82,36,.13)" stroke-width="2"/></pattern></defs>` +
      `<g class="g" style="filter:drop-shadow(-22px 12px 26px rgba(70,52,25,.4))">` +
      `<polygon points="${strip}" fill="var(--accent)"/>` +
      `<polygon points="${sheet}" fill="${P.card}" stroke="#ffffff" stroke-width="18" stroke-linejoin="round"/>` +
      `<polygon points="${sheet}" fill="${P.kraft}" opacity=".42"/><polygon points="${sheet}" fill="url(#fib)"/></g></svg>`);
    ov.append(el);
    const g = el.querySelector('.g');
    // frames 0-2 sweep in, 3-4 hold while the scenes swap underneath, 5-7 sweep out
    const X0 = -1950, XC = -520, X1 = 1000;
    const xAt = p => (p < 0.375 ? lerp(X0, XC, clamp((p + 0.125) / 0.375)) : p < 0.625 ? lerp(XC, XC + 40, (p - 0.375) / 0.25) : lerp(XC + 40, X1, clamp((p - 0.5) / 0.375)));
    return {
      lead: 4, settle: 4, both: false, sfx: 'tear',
      apply(p) {
        el.style.display = 'block';
        const x = xAt(p), speed = Math.abs(x - xAt(p - 0.125));
        g.setAttribute('transform', `translate(${x.toFixed(1)},0)`);
        ctx.blur(el, Math.min(14, speed * 0.022), 0);
      },
      off() { el.style.display = 'none'; },
    };
  },

  // N11 hole-punch iris (from T10): the next scene is seen through a hole that opens fast.
  iris(ov, ctx) {
    const ring = h('div', 'position:absolute;border-radius:50%;display:none;box-shadow:0 0 0 10px #fffdf8,inset 16px 20px 34px rgba(70,52,25,.4)');
    ov.append(ring);
    return {
      lead: 0, settle: 5, both: true, sfx: 'pop',
      apply(p, out, inn, at) {
        const [cx, cy] = at || [W / 2, 900], r = lerp(0, 2300, inCubic(clamp(p + 0.2)));
        inn.style.clipPath = `circle(${r.toFixed(1)}px at ${cx}px ${cy}px)`;
        out.style.webkitMaskImage = `radial-gradient(circle ${r.toFixed(1)}px at ${cx}px ${cy}px,transparent 99.6%,#000 100%)`;
        Object.assign(ring.style, { display: 'block', left: `${(cx - r).toFixed(1)}px`, top: `${(cy - r).toFixed(1)}px`, width: `${(2 * r).toFixed(1)}px`, height: `${(2 * r).toFixed(1)}px` });
      },
      off() { ring.style.display = 'none'; },
    };
  },

  // T17 page scroll: the whole canvas moves up to the next step, eased at both ends.
  railScroll(ov, ctx) {
    const e = p => inOutCubic(clamp(p + 1 / 17));
    return {
      lead: 8, settle: 9, both: true, sfx: 'whoosh',
      apply(p, out, inn) {
        const a = e(p), sp = Math.abs(a - e(p - 1 / 17)) * H;
        move(out, 0, -H * a); move(inn, 0, H * (1 - a));
        ctx.blur(out, 0, Math.min(26, sp * 0.07)); ctx.blur(inn, 0, Math.min(26, sp * 0.07));
      },
      off() {},
    };
  },

  // T12 whip: a fast sideways throw with blur; the new scene lands with a small overshoot.
  whip(ov, ctx) {
    const xo = p => -1250 * inCubic(clamp((p + 1 / 7) / 0.45));
    const xi = p => 1250 * (1 - outBack(clamp((p + 1 / 7 - 0.3) / 0.7), 1.1));
    return {
      lead: 3, settle: 4, both: true, sfx: 'swoosh',
      apply(p, out, inn) {
        move(out, xo(p), 0); move(inn, xi(p), 0);
        ctx.blur(out, Math.min(36, Math.abs(xo(p) - xo(p - 1 / 7)) * 0.06), 0);
        ctx.blur(inn, Math.min(36, Math.abs(xi(p) - xi(p - 1 / 7)) * 0.06), 0);
      },
      off() {},
    };
  },

  // T20 dissolve, for calm one-canvas reels.
  dissolve: () => ({
    lead: 3, settle: 4, both: true, sfx: null,
    apply(p, out, inn) { const a = clamp(p + 1 / 7); inn.style.opacity = a.toFixed(3); out.style.opacity = (1 - a).toFixed(3); },
    off() {},
  }),

  // N09 index-card shuffle (from T19): the old scene slips down and back, the new one comes off the top of the stack.
  shuffle: () => ({
    lead: 5, settle: 4, both: true, sfx: 'swoosh',
    apply(p, out, inn) {
      const q = clamp(p + 1 / 9), a = inCubic(clamp(q / 0.6)), b = outCubic(clamp((q - 0.15) / 0.85));
      move(out, -70 * a, 50 * a, `rotate(${(-5 * a).toFixed(2)}deg) scale(${(1 - 0.07 * a).toFixed(4)})`);
      out.style.opacity = (1 - clamp((q - 0.35) / 0.3)).toFixed(3);
      move(inn, 1150 * (1 - b), -90 * (1 - b), `rotate(${(7 * (1 - b)).toFixed(2)}deg)`);
    },
    off() {},
  }),

  // T05 ramp into cut: the old scene accelerates toward the camera, then a hard cut to stillness.
  rampCut: () => ({
    lead: 10, settle: 0, both: false, sfx: 'riser',
    apply(p, out) {
      const a = inCubic(clamp(p + 0.1));
      out.style.transformOrigin = '50% 45%';
      out.style.transform = `scale(${(1 + 0.45 * a).toFixed(4)})`;
      out.style.filter = `blur(${(7 * a).toFixed(1)}px)`;
    },
    off() {},
  }),

  // N04 lamp flicker (from T07): the light jumps for three frames either side of the swap.
  flicker(ov) {
    const flash = h('div', 'position:absolute;inset:0;background:#fffaf0;display:none');
    ov.append(flash);
    return {
      lead: 3, settle: 3, both: false, sfx: 'click',
      apply(p) { flash.style.display = 'block'; flash.style.opacity = (0.6 * (1 - Math.abs(2 * (p + 1 / 12) - 1))).toFixed(3); },
      off() { flash.style.display = 'none'; },
    };
  },
};
