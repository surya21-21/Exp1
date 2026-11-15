// Screen elements, all drawn in Paper Studio materials. Each builder returns
// { el, update(...) }. update() sets every style from the time it is given and
// keeps no memory, so frames can be drawn in any order.
import { fr, clamp, lerp, prog, inCubic, outCubic, outExpo, outBack, spring, pulse, rng } from './ease.js';
import { P, h, cardCss, pencilPath } from './paper.js';

const DISPLAY = '"Inter Display","Inter",sans-serif';
const SANS = '"Inter",sans-serif';
const SERIF = '"Lora",serif';

// N06 paper counter (from M01, M02). Starts already running; each digit is a
// small card with a fold line; cards give a small bounce when the number lands.
export function counter({ from = 0, to, dur = 1.3, prefix = '', suffix = '', digitW = 128, digitH = 188, gap = 12 }) {
  const finalStr = Math.round(to).toLocaleString('en-US');
  const el = h('div', `display:flex;align-items:flex-end;justify-content:center;gap:${gap}px;width:fit-content;margin:0 auto`);
  const sym = `font:900 ${digitH * 0.62}px/${digitH}px ${DISPLAY};color:${P.ink}`;
  const cells = [];
  if (prefix) el.append(h('div', sym, prefix));
  let place = finalStr.replace(/\D/g, '').length - 1;
  for (const ch of finalStr) {
    if (/\d/.test(ch)) {
      const c = h('div', `position:relative;width:${digitW}px;height:${digitH}px;overflow:hidden;${cardCss(20)}`);
      const strip = h('div', `position:absolute;left:0;top:0;width:100%;text-align:center;color:${P.ink};font:900 ${digitH * 0.8}px/${digitH}px ${DISPLAY};letter-spacing:-2px`);
      const a = h('div', `height:${digitH}px`), b = h('div', `height:${digitH}px`);
      strip.append(a, b);
      c.append(strip, h('div', 'position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(70,52,25,.12)'));
      el.append(c);
      cells.push({ c, strip, a, b, unit: Math.pow(10, place--) });
    } else {
      el.append(h('div', `${sym};margin:0 -4px`, ch));
    }
  }
  if (suffix) el.append(h('div', sym, suffix));
  const value = t => from + (to - from) * outExpo(prog(t, 0, dur));
  return {
    el, landAt: dur, value,
    update(t) {
      const v = value(t), speedAll = Math.abs(value(t + fr(1)) - v);
      for (const k of cells) {
        const raw = v / k.unit, cur = Math.floor(raw + 1e-9) % 10, f = raw - Math.floor(raw + 1e-9);
        const roll = t >= dur ? 0 : k.unit === 1 ? f : Math.pow(f, 6);
        k.a.textContent = cur;
        k.b.textContent = (cur + 1) % 10;
        k.strip.style.transform = `translateY(${(-roll * digitH).toFixed(1)}px)`;
        const speed = speedAll / k.unit;                      // digits a frame
        k.strip.style.filter = speed > 0.6 ? `blur(${Math.min(5, speed * 1.2).toFixed(1)}px)` : 'none';
        k.c.style.transform = `scale(${(1 + 0.07 * pulse(t, dur, fr(1), fr(6))).toFixed(4)})`;
      }
    },
  };
}

// M05 switch. p = 0 off, 1 on.
export function toggle(w = 132) {
  const hh = Math.round(w * 0.56), k = hh - 16;
  const el = h('div', `position:relative;flex:none;width:${w}px;height:${hh}px;border-radius:${hh}px;background:${P.track};box-shadow:inset 3px 4px 8px rgba(70,52,25,.28)`);
  const fill = h('div', `position:absolute;inset:0;border-radius:${hh}px;background:var(--accent);box-shadow:inset 3px 4px 8px rgba(70,20,5,.3);opacity:0`);
  const knob = h('div', `position:absolute;left:8px;top:8px;width:${k}px;height:${k}px;border-radius:50%;background:linear-gradient(160deg,#fff,#efe9dc);box-shadow:3px 4px 8px rgba(70,52,25,.35)`);
  el.append(fill, knob);
  return {
    el,
    update(p) {
      const e = p <= 0 ? 0 : p >= 1 ? 1 : outBack(p, 1.3);
      knob.style.transform = `translateX(${(e * (w - k - 16)).toFixed(1)}px)`;
      fill.style.opacity = clamp(p * 1.5);
    },
  };
}

// N08 rubber stamp (from M08). Place with left/top = its centre. t = seconds since it lands.
export function stamp(text, { size = 92, rot = -8 } = {}) {
  const b = Math.max(6, Math.round(size * 0.09));
  const el = h('div', `position:absolute;white-space:nowrap;font:900 ${size}px/1 ${SANS};letter-spacing:${(size * 0.05).toFixed(1)}px;color:var(--accent);` +
    `padding:${(size * 0.24).toFixed(0)}px ${(size * 0.42).toFixed(0)}px ${(size * 0.2).toFixed(0)}px;border:${b}px solid var(--accent);border-radius:${(size * 0.22).toFixed(0)}px;` +
    `outline:${Math.max(3, Math.round(size * 0.035))}px solid var(--accent);outline-offset:${(size * 0.09).toFixed(0)}px;mix-blend-mode:multiply;opacity:0`, text);
  return {
    el,
    update(t) {
      if (t < 0) { el.style.opacity = 0; return; }
      const p = prog(t, 0, fr(3)), s = lerp(1.45, 1, inCubic(p)), q = 1 - 0.08 * pulse(t, fr(3), fr(1), fr(4));
      el.style.opacity = (clamp(0.3 + p) * 0.9).toFixed(3);
      el.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(${(s * (2 - q)).toFixed(4)},${(s * q).toFixed(4)})`;
    },
  };
}

// N10 pencil line: underline or strike-through. p = 0..1 drawn.
export function pencil(len, { seed = 7, width = 8, color = P.graphite } = {}) {
  const el = h('div', `position:absolute;width:${len}px;height:24px;opacity:0`,
    `<svg width="${len}" height="24" viewBox="0 -12 ${len} 24" style="overflow:visible;display:block"><path d="${pencilPath(len, seed)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`);
  const path = el.querySelector('path');
  return {
    el,
    update(p) {
      el.style.opacity = p <= 0 ? 0 : 1;
      path.setAttribute('stroke-dashoffset', (1 - clamp(p)).toFixed(4));
    },
  };
}

// Tick or cross badge (M07). p = 0..1 pop.
export function badge(kind = 'tick', size = 96) {
  const mark = kind === 'tick'
    ? '<path d="M26 50 L43 67 L74 33" fill="none" stroke="#fffdf8" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<path d="M32 32 L68 68 M68 32 L32 68" fill="none" stroke="#fffdf8" stroke-width="11" stroke-linecap="round"/>';
  const el = h('div', `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${kind === 'tick' ? P.ink : 'var(--accent)'};box-shadow:4px 6px 12px rgba(70,52,25,.35);opacity:0`,
    `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${mark}</svg>`);
  return {
    el,
    update(p) {
      el.style.opacity = p <= 0 ? 0 : 1;
      el.style.transform = `scale(${p <= 0 ? 0 : outBack(clamp(p), 2.2).toFixed(4)})`;
    },
  };
}

// M14 typing. t = seconds since typing starts.
export function typer(text, { cps = 14 } = {}) {
  const el = h('span'), body = h('span');
  const caret = h('span', 'display:inline-block;width:.07em;height:.95em;background:var(--accent);margin-left:.06em;vertical-align:-.1em');
  el.append(body, caret);
  return {
    el, dur: text.length / cps,
    update(t) {
      const n = clamp(Math.floor(t * cps), 0, text.length);
      body.textContent = text.slice(0, n);
      caret.style.opacity = t < 0 ? 0 : n < text.length || Math.floor(t * 2) % 2 === 0 ? 1 : 0;
    },
  };
}

// U12 tool tile. Logos are only ever official files; without one the tile shows the name's first letter.
export function tile(name, { size = 170, logo = null, sub = '', above = false, label = true } = {}) {
  const el = h('div', `position:absolute;width:${size}px;height:${size}px;opacity:0`);
  const box = h('div', `width:${size}px;height:${size}px;${cardCss(Math.round(size * 0.24))}display:flex;align-items:center;justify-content:center;font:900 ${Math.round(size * 0.46)}px ${DISPLAY};color:${P.ink}`);
  if (logo) box.innerHTML = `<img src="${logo}" style="width:62%;height:62%;object-fit:contain">`;
  else box.textContent = name.slice(0, 1).toUpperCase();
  el.append(box);
  if (label) {
    const cap = h('div', `position:absolute;left:-70px;right:-70px;${above ? 'bottom:100%;padding-bottom:12px' : 'top:100%;padding-top:12px'};text-align:center`);
    cap.append(h('div', `font:800 36px/1.1 ${SANS};letter-spacing:-.5px;color:${P.ink}`, name));
    if (sub) cap.append(h('div', `margin-top:2px;font:500 28px/1.15 ${SANS};color:${P.muted}`, sub));
    el.append(cap);
  }
  return {
    el,
    update(p) {
      el.style.opacity = clamp(p * 3);
      el.style.transform = `scale(${p <= 0 ? 0.6 : p >= 1 ? 1 : lerp(0.6, 1, outBack(p, 2)).toFixed(4)})`;
    },
  };
}

// M13 connecting line inside an <svg>. p = 0..1 drawn. bend = how far the curve bows.
export function connector(svg, x1, y1, x2, y2, bend = 60) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1);
  const cx = mx - ((y2 - y1) / len) * bend, cy = my + ((x2 - x1) / len) * bend;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`);
  for (const [k, v] of Object.entries({ fill: 'none', stroke: P.graphite, 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, opacity: 0 })) path.setAttribute(k, v);
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  for (const [k, v] of Object.entries({ cx: x2, cy: y2, r: 0, fill: 'var(--accent)' })) dot.setAttribute(k, v);
  svg.append(path, dot);
  return {
    update(p) {
      path.setAttribute('opacity', p <= 0 ? 0 : 1);
      path.setAttribute('stroke-dashoffset', (1 - outCubic(clamp(p))).toFixed(4));
      dot.setAttribute('r', (11 * clamp((p - 0.85) / 0.15)).toFixed(2));
    },
  };
}

// M03 bar race. items: [{label, v, text}]. t = seconds since it starts.
export function bars(items, { w = 820, rowH = 92, gap = 28, dur = 1.6, labelW = 250 } = {}) {
  const max = Math.max(...items.map(i => i.v)), trackW = w - labelW - 200, r = rng(11);
  const el = h('div', `width:${w}px`);
  const rows = items.map((it, i) => {
    const row = h('div', `position:relative;height:${rowH}px;margin-bottom:${gap}px`);
    const bar = h('div', `position:absolute;left:${labelW}px;top:14px;height:${rowH - 28}px;width:0;border-radius:14px;background:${it.hero ? 'var(--accent)' : P.graphite};box-shadow:4px 6px 12px rgba(70,52,25,.28)`);
    const val = h('div', `position:absolute;top:0;left:${labelW}px;font:900 58px/${rowH}px ${DISPLAY};letter-spacing:-1px;color:${P.ink};white-space:nowrap`);
    row.append(h('div', `position:absolute;left:0;top:0;width:${labelW - 24}px;font:700 44px/${rowH}px ${SANS};letter-spacing:-.5px;color:${P.ink};white-space:nowrap;overflow:hidden`, it.label), bar, val);
    el.append(row);
    return { it, bar, val, slow: 0.65 + 0.35 * r(), delay: i * fr(2) };
  });
  return {
    el,
    update(t) {
      for (const k of rows) {
        const p = outCubic(prog(t, k.delay, dur * k.slow)), bw = (k.it.v / max) * trackW * p;
        k.bar.style.width = `${bw.toFixed(1)}px`;
        k.val.style.transform = `translateX(${(bw + 18).toFixed(1)}px)`;
        k.val.textContent = p >= 1 && k.it.text ? k.it.text : (k.it.dec ? (k.it.v * p).toFixed(k.it.dec) : Math.round(k.it.v * p).toLocaleString('en-US')) + (k.it.unit || '');
      }
    },
  };
}

// M06 click ring. Place with left/top = its centre. p = 0..1.
export function ripple(size = 160) {
  const el = h('div', `position:absolute;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;border:6px solid var(--accent);opacity:0`);
  return {
    el,
    update(p) {
      el.style.opacity = p <= 0 || p >= 1 ? 0 : (1 - p).toFixed(3);
      el.style.transform = `scale(${lerp(0.3, 1.5, outCubic(clamp(p))).toFixed(4)})`;
    },
  };
}

export function chip(text, { dot = false, size = 32 } = {}) {
  return h('div', `display:inline-flex;align-items:center;gap:12px;padding:${size * 0.42}px ${size * 0.8}px;border-radius:99px;${cardCss(99)}font:700 ${size}px/1 ${SANS};color:${P.ink};white-space:nowrap`,
    (dot ? '<i style="width:14px;height:14px;border-radius:50%;background:var(--accent);display:block"></i>' : '') + text);
}

// N02 sticky-note slam (from M10). Place with left/top = its centre. t = seconds since it lands.
export function sticky(text, { size = 560, rot = -5, font = 120, sub = '' } = {}) {
  const el = h('div', `position:absolute;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;opacity:0;filter:drop-shadow(14px 30px 30px rgba(70,52,25,.38))`);
  const paper = h('div', `position:absolute;inset:0;background:linear-gradient(165deg,#fbe58f,${P.note} 55%,#eecb5c);clip-path:polygon(0 0,100% 0,100% 82%,82% 100%,0 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 ${size * 0.08}px`);
  paper.append(h('div', `font:900 ${font}px/0.98 ${DISPLAY};letter-spacing:-2px;color:${P.ink}`, text));
  if (sub) paper.append(h('div', `margin-top:${size * 0.04}px;font:italic 600 ${Math.round(font * 0.36)}px/1.2 ${SERIF};color:${P.graphite}`, sub));
  const curl = h('div', `position:absolute;right:0;bottom:0;width:18%;height:18%;background:linear-gradient(135deg,#d9b446 0%,#f4dc83 60%);clip-path:polygon(0 0,100% 0,0 100%);box-shadow:-4px -4px 8px rgba(70,52,25,.2)`);
  const strip = h('div', `position:absolute;left:0;right:0;top:0;height:11%;background:rgba(150,110,20,.10)`);
  el.append(paper, strip, curl);
  return {
    el,
    update(t) {
      if (t < 0) { el.style.opacity = 0; return; }
      const p = prog(t, 0, fr(8)), s = lerp(1.6, 1, spring(p, 1, 6));
      el.style.opacity = clamp(prog(t, 0, fr(2)));
      el.style.transform = `rotate(${(rot + 9 * (1 - outCubic(p))).toFixed(2)}deg) scale(${s.toFixed(4)})`;
    },
  };
}

// U17 keycaps for the comment keyword. t = seconds since the first key lands.
export function keycaps(word, { size = 132, gap = 16 } = {}) {
  const el = h('div', `display:flex;gap:${gap}px;justify-content:center;width:fit-content;margin:0 auto`);
  const keys = [...word].map(ch => {
    const k = h('div', `width:${size}px;height:${size}px;border-radius:${size * 0.2}px;background:linear-gradient(160deg,#fffdf8,#f1ebdf);box-shadow:inset 2px 2px 0 #fff,0 ${size * 0.09}px 0 #cdc3b0,6px ${size * 0.2}px 22px rgba(70,52,25,.35);display:flex;align-items:center;justify-content:center;font:900 ${Math.round(size * 0.58)}px ${DISPLAY};color:${P.ink};opacity:0`, ch);
    el.append(k);
    return k;
  });
  return {
    el, dur: fr(2) * keys.length + fr(6),
    update(t, pressAt = 1e9) {
      keys.forEach((k, i) => {
        const p = prog(t, i * fr(2), fr(6)), press = pulse(t, pressAt + i * fr(2), fr(1), fr(3));
        k.style.opacity = clamp(p * 3);
        k.style.transform = `translateY(${((1 - outBack(p, 2.4)) * -60 + press * size * 0.07).toFixed(1)}px)`;
        k.style.color = t >= pressAt + i * fr(2) ? 'var(--accent)' : P.ink;
      });
    },
  };
}

// N14 paper-tab progress (from L05). index = current step, p = how far through it.
export function progress(n) {
  const el = h('div', 'display:flex;gap:14px;justify-content:center');
  const tabs = Array.from({ length: n }, () => {
    const t = h('div', `position:relative;width:${Math.min(96, Math.floor(700 / n))}px;height:16px;border-radius:8px;background:${P.track};overflow:hidden;box-shadow:inset 2px 2px 4px rgba(70,52,25,.22)`);
    const f = h('div', 'position:absolute;left:0;top:0;bottom:0;width:0;background:var(--accent);border-radius:8px');
    t.append(f);
    el.append(t);
    return f;
  });
  return {
    el,
    update(index, p) {
      tabs.forEach((f, i) => { f.style.width = `${(i < index ? 100 : i === index ? clamp(p) * 100 : 0).toFixed(1)}%`; });
    },
  };
}

// N15 ledger numeral (from L04): the step number printed huge and faint on the paper.
export function ledgerNumeral(text, size = 620) {
  return h('div', `position:absolute;font:900 ${size}px/0.8 ${DISPLAY};letter-spacing:-20px;color:rgba(70,52,25,.075);white-space:nowrap`, text);
}

// Simple bookmark glyph for "Save this". p = 0..1 filled.
export function bookmark(size = 150) {
  const el = h('div', `position:absolute;width:${size}px;height:${size * 1.3}px`,
    `<svg viewBox="0 0 100 130" width="${size}" height="${size * 1.3}" style="overflow:visible;filter:drop-shadow(6px 10px 10px rgba(70,52,25,.3))"><defs><clipPath id="bmk"><path d="M10 6 H90 V124 L50 92 L10 124 Z"/></clipPath></defs><path d="M10 6 H90 V124 L50 92 L10 124 Z" fill="#fffdf8" stroke="${P.ink}" stroke-width="7" stroke-linejoin="round"/><rect class="f" x="0" y="130" width="100" height="130" fill="var(--accent)" clip-path="url(#bmk)"/><path d="M10 6 H90 V124 L50 92 L10 124 Z" fill="none" stroke="${P.ink}" stroke-width="7" stroke-linejoin="round"/></svg>`);
  const f = el.querySelector('.f');
  return {
    el,
    update(p) {
      f.setAttribute('y', (130 * (1 - outCubic(clamp(p)))).toFixed(1));
      el.style.transform = `scale(${(1 + 0.12 * pulse(p, 0.9, 0.05, 0.3)).toFixed(4)})`;
    },
  };
}

export { DISPLAY, SANS, SERIF };
