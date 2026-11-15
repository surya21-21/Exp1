// Captions: 2 to 4 words at a time in the top fifth, each word arriving as it is
// spoken (C01), the keyword in italic serif on a strip of paper tape (N03, from S01).
import { fr, clamp, prog, outCubic } from './ease.js';
import { P, h, tint } from './paper.js';

// groups: [{ s, e, words: [{ w, s, e, kw }] }], times in seconds.
export function captions(layer, groups, { accent = '#c2381d', top = 250, size = 68 } = {}) {
  const tape = tint(accent, 0.3);
  const built = groups.map((g, gi) => {
    const el = h('div', `position:absolute;left:70px;right:70px;top:${top}px;text-align:center;font:800 ${size}px/1.16 "Inter",sans-serif;letter-spacing:-1px;color:${P.ink};display:none`);
    const words = g.words.map((w, wi) => {
      const sp = h('span', 'display:inline-block;position:relative;margin:0 .13em;opacity:0');
      let strip = null;
      if (w.kw) {
        const rot = ((gi * 7 + wi * 3) % 5) * 0.5 - 1;
        strip = h('i', `position:absolute;left:-.16em;right:-.16em;top:.1em;bottom:.02em;background:${tape};transform:rotate(${rot}deg);` +
          'clip-path:polygon(0 12%,1.5% 0,3% 14%,4.5% 2%,6% 10%,100% 0,98.5% 16%,100% 30%,98.5% 48%,100% 64%,98.5% 82%,100% 100%,3% 100%,1.5% 84%,3% 66%,0 50%,1.5% 30%);box-shadow:2px 3px 0 rgba(70,52,25,.12)');
        const txt = h('span', `position:relative;font:italic 700 ${Math.round(size * 1.04)}px/1.16 "Lora",serif;letter-spacing:0`, w.w);
        sp.append(strip, txt);
      } else sp.textContent = w.w;
      el.append(sp);
      return { w, sp, strip };
    });
    layer.append(el);
    const next = groups[gi + 1];
    return { g, el, words, hideAt: next ? Math.min(next.s, g.e + 0.6) : g.e + 0.5 };
  });
  return {
    update(t) {
      for (const b of built) {
        const on = t >= b.g.s - fr(1) && t < b.hideAt;
        b.el.style.display = on ? 'block' : 'none';
        if (!on) continue;
        const out = prog(t, b.hideAt - fr(3), fr(3));
        b.el.style.opacity = (1 - out).toFixed(3);
        b.el.style.transform = `translateY(${(-16 * out).toFixed(1)}px)`;
        for (const k of b.words) {
          const p = prog(t, k.w.s - fr(1), fr(3));
          k.sp.style.opacity = p.toFixed(3);
          k.sp.style.transform = `translateY(${((1 - outCubic(p)) * 16).toFixed(1)}px)`;
          // the tape unrolls left to right over 4 frames from the moment the word is spoken
          if (k.strip) k.strip.style.right = `calc(-.16em + ${(100 * (1 - outCubic(prog(t, k.w.s, fr(4))))).toFixed(1)}%)`;
        }
      }
    },
  };
}

// Split timed words into caption groups of 2-4 words, breaking at sentence ends and pauses.
export function groupWords(words, maxWords = 4, maxGap = 0.35) {
  const groups = [];
  let cur = [];
  const flush = () => { if (cur.length) groups.push({ s: cur[0].s, e: cur[cur.length - 1].e, words: cur }), cur = []; };
  for (const w of words) {
    if (cur.length) {
      const last = cur[cur.length - 1];
      if (cur.length >= maxWords || /[.?!]$/.test(last.w) || w.s - last.e > maxGap || (cur.length >= 2 && /[,;:]$/.test(last.w))) flush();
    }
    cur.push(w);
  }
  flush();
  return groups;
}
