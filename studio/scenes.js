// Scene types for the reel engine. Each is SCENES[type](wrap, props, ctx) and returns
// { update(t), avatar(t), lamp(t), cues } where t is seconds since the scene's start.
// ctx: { dur, beats, pre, accent }. beats are the moments (seconds into the scene) the
// planner took from the voice: each *keyword* in the scene's line is one beat.
import { fr, clamp, lerp, prog, outCubic, inOutCubic, outBack, pulse } from '../collection/lib/ease.js';
import { P, h, abs, card, cardCss } from '../collection/lib/paper.js';
import * as E from '../collection/lib/elements.js';
import { travel } from '../collection/lib/avatar.js';

const { DISPLAY, SANS, SERIF } = E;
const beat = (ctx, i, d) => (ctx.beats && ctx.beats[i] != null ? ctx.beats[i] : d);
// A scene that arrives by a hard cut is already mid-entrance on its first frame (T02).
const enter = (ctx, t, delay = 0) => (ctx.pre ? 1 : outCubic(prog(t, delay - fr(2), fr(7))));
const rise = (el, e, dy = 44) => { el.style.opacity = e.toFixed(3); el.style.transform = `translateY(${((1 - e) * dy).toFixed(1)}px)`; };
const kicker = text => h('div', `font:700 30px/1 ${SANS};letter-spacing:4px;text-transform:uppercase;color:${P.muted}`, text);
const ticks = (from, to, every = fr(2), gain = 0.35) => { const a = []; for (let t = from; t < to; t += every) a.push({ t, sfx: 'tick', gain }); return a; };

export const SCENES = {
  // H01 number already running + A01/A02 avatar opens large then becomes the cursor.
  hookCounter(wrap, p, ctx) {
    const c = E.counter({ from: p.from, to: p.to, dur: p.run || 1.3, prefix: p.prefix || '', suffix: p.suffix || '', digitW: p.digitW || 150, digitH: p.digitH || 216 });
    const box = h('div', abs(0, 620, 1080, 230, 'display:flex;justify-content:center;transform-origin:50% 100%'));
    box.append(c.el); c.el.dataset.key = 'counter';
    const label = h('div', abs(60, 880, 960, null, `text-align:center;font:900 76px/1.05 ${DISPLAY};letter-spacing:-1.5px;color:${P.ink}`), p.label || '');
    const sub = h('div', abs(60, 978, 960, null, `text-align:center;font:italic 600 46px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    const chips = h('div', abs(60, 1096, 960, null, 'display:flex;gap:22px;justify-content:center;flex-wrap:wrap'));
    const chipEls = (p.chips || []).map(tx => { const e = E.chip(tx, { dot: true, size: 40 }); chips.append(e); return e; });
    wrap.append(box, label, sub, chips);
    const shrinkAt = beat(ctx, 0, 1.1), chipAt = i => beat(ctx, i + 1, shrinkAt + 0.35 + i * 0.3);
    return {
      update(t) {
        c.update(t + 0.12);
        rise(label, outCubic(prog(t, fr(4), fr(8))), 30);
        rise(sub, outCubic(prog(t, fr(10), fr(8))), 30);
        chipEls.forEach((e, i) => { const q = prog(t, chipAt(i), fr(6)); e.style.opacity = clamp(q * 3); e.style.transform = `scale(${q <= 0 ? 0.5 : lerp(0.5, 1, outBack(q, 2.2)).toFixed(4)})`; });
      },
      avatar(t) {
        const m = inOutCubic(prog(t, shrinkAt, fr(10))), e = outCubic(prog(t, -fr(2), fr(8)));
        const bx = lerp(540, 132, m), by = lerp(1340 + (1 - e) * 60, 566, m);
        return {
          bust: { x: bx, y: by, w: lerp(430, 150, m), o: e * (1 - clamp((m - 0.35) / 0.4)) },
          chip: { x: bx, y: by - lerp(44, 0, m), size: lerp(360, 124, m), o: clamp((m - 0.3) / 0.4), ring: prog(t, shrinkAt + fr(10), fr(9)) },
        };
      },
      lamp: () => ({ x: 540, y: 760, k: 1 }),
      cues: [...ticks(0, (p.run || 1.3) - 0.2), { t: (p.run || 1.3) - 0.12, sfx: 'impact', gain: 0.8 }, { t: shrinkAt, sfx: 'swoosh', gain: 0.6 },
        ...chipEls.map((_, i) => ({ t: chipAt(i), sfx: 'pop', gain: 0.6 }))],
    };
  },

  // N02 sticky-note slam, or (note: false) a plain big statement with a pencil underline.
  bigWord(wrap, p, ctx) {
    const at = beat(ctx, 0, 0.12);
    const over = h('div', abs(80, 520, 920, null, `text-align:center;font:700 48px/1.2 ${SANS};color:${P.muted}`), p.over || '');
    wrap.append(over);
    let note = null, word = null, line = null;
    if (p.note === false) {
      word = h('div', abs(60, 700, 960, null, `text-align:center;font:900 ${p.font || 150}px/0.98 ${DISPLAY};letter-spacing:-4px;color:${P.ink}`), p.word);
      line = E.pencil(p.underline || 560, { seed: 5, width: 12, color: 'var(--accent)' });
      line.el.style.left = `${540 - (p.underline || 560) / 2}px`; line.el.style.top = `${p.underlineY || 1040}px`;
      word.dataset.key = 'word';
      wrap.append(word, line.el);
    } else {
      note = E.sticky(p.word, { size: p.size || 640, font: p.font || 128, sub: p.sub || '' });
      note.el.style.left = '540px'; note.el.style.top = '950px'; note.el.dataset.key = 'note';
      wrap.append(note.el);
    }
    return {
      update(t) {
        rise(over, enter(ctx, t), 24);
        if (note) note.update(t - at);
        else { const e = prog(t, at - fr(1), fr(6)); word.style.opacity = clamp(e * 2); word.style.transform = `scale(${lerp(1.5, 1, outCubic(e)).toFixed(4)})`; line.update(prog(t, at + fr(5), fr(6))); }
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 215, y: 1330 }, { t: at + fr(12), x: 250, y: 1290 }], 130) }),
      lamp: () => ({ x: 540, y: 940, k: 1 }),
      cues: [{ t: at, sfx: 'impact', gain: 0.9 }, ...(note ? [] : [{ t: at + fr(5), sfx: 'scratch', gain: 0.6 }])],
    };
  },

  // U01/U03/U11 rebuilt app card: rows that switch on, tick, count or fill, one highlight at a time.
  uiCard(wrap, p, ctx) {
    const rows = p.rows || [], RH = 156, HD = 128, X = 100, CW = 850, CH = HD + rows.length * RH + 22, Y = Math.round(clamp(1010 - CH / 2, 590, 720));
    const kick = kicker(p.kicker || ''); kick.style.cssText += abs(X + 8, Y - 70, CW, null);
    const c = card(X, Y, CW, CH); c.dataset.key = 'card';
    c.append(h('div', `height:${HD}px;display:flex;align-items:center;gap:14px;padding:0 44px;border-bottom:3px solid ${P.line};font:800 44px ${SANS};color:${P.ink}`,
      `<i style="width:20px;height:20px;border-radius:50%;background:var(--accent);display:block"></i><i style="width:20px;height:20px;border-radius:50%;background:${P.track};display:block"></i><i style="width:20px;height:20px;border-radius:50%;background:${P.track};display:block;margin-right:14px"></i>${p.title || ''}`));
    const hi = h('div', abs(14, 0, CW - 28, RH - 12, 'border-radius:24px;border:5px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,transparent);opacity:0'));
    c.append(hi);
    const at = i => beat(ctx, i, 0.55 + i * 0.7);
    const built = rows.map((r, i) => {
      const row = h('div', abs(0, HD + i * RH + 4, CW, RH, `display:flex;align-items:center;justify-content:space-between;padding:0 52px 0 132px;font:700 48px ${SANS};letter-spacing:-.5px;color:${P.ink};white-space:nowrap`));
      row.append(h('div', '', r.label));
      let ctl = null, upd = () => {};
      if (r.kind === 'toggle') { const g = E.toggle(150); ctl = g.el; upd = t => g.update(prog(t, at(i), fr(5))); }
      else if (r.kind === 'tick') { const b = E.badge('tick', 92); b.el.style.position = 'relative'; ctl = b.el; upd = t => b.update(prog(t, at(i), fr(6))); }
      else if (r.kind === 'bar') {
        ctl = h('div', `position:relative;width:300px;height:26px;border-radius:13px;background:${P.track};box-shadow:inset 2px 3px 6px rgba(70,52,25,.25);overflow:hidden`);
        const f = h('div', 'position:absolute;left:0;top:0;bottom:0;width:0;border-radius:13px;background:var(--accent)'); ctl.append(f);
        upd = t => { f.style.width = `${(100 * (r.v ?? 1) * outCubic(prog(t, at(i), fr(14)))).toFixed(1)}%`; };
      } else {
        ctl = h('div', `font:900 58px ${DISPLAY};letter-spacing:-1px;color:${P.ink};white-space:nowrap`);
        const num = typeof r.value === 'number';
        upd = t => { const q = prog(t, at(i), fr(num ? 12 : 5)); ctl.style.opacity = clamp(q * 4 + (num ? 0.35 : 0)); ctl.textContent = num ? Math.round(r.value * outCubic(q)).toLocaleString('en-US') + (r.unit || '') : r.value; ctl.style.color = t >= at(i) && t < at(i) + 0.5 ? 'var(--accent)' : P.ink; };
      }
      row.append(ctl); c.append(row);
      return { row, upd };
    });
    const st = p.stamp ? E.stamp(p.stamp.text, { size: p.stamp.size || 96, rot: -9 }) : null;
    const stAt = beat(ctx, rows.length, at(rows.length - 1) + 0.6);
    if (st) { st.el.style.left = `${X + CW - 290}px`; st.el.style.top = `${Y + CH + 86}px`; }
    wrap.append(kick, c); if (st) wrap.append(st.el);
    const rowY = i => Y + HD + i * RH + 4 + RH / 2;
    const cur = t => { let k = -1; rows.forEach((_, i) => { if (t >= at(i) - fr(6)) k = i; }); return k; };
    return {
      update(t) {
        const e = enter(ctx, t);
        rise(kick, e, 20); rise(c, e, 50);
        built.forEach((b, i) => { b.row.style.opacity = (ctx.pre ? 1 : outCubic(prog(t, fr(1 + i * 2), fr(6)))).toFixed(3); b.upd(t); });
        const k = cur(t);
        if (k < 0) hi.style.opacity = 0;
        else {
          const from = Math.max(0, k - 1), m = k === 0 ? 1 : inOutCubic(prog(t, at(k) - fr(6), fr(6)));
          hi.style.opacity = prog(t, at(0) - fr(6), fr(4)).toFixed(3);
          hi.style.transform = `translateY(${(HD + lerp(from, k, m) * RH + 10).toFixed(1)}px)`;
        }
        if (st) st.update(t - stAt);
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: X + 6, y: Y + 8 }, ...rows.map((_, i) => ({ t: at(i), x: X + 62, y: rowY(i) }))], 112) }),
      lamp(t) { const k = Math.max(0, cur(t)); return { x: 540, y: rowY(k), k: 1 }; },
      cues: [...rows.map((r, i) => ({ t: at(i), sfx: r.kind === 'toggle' ? 'click' : r.kind === 'bar' ? 'swoosh' : 'pop', gain: 0.7 })), ...(st ? [{ t: stAt, sfx: 'stamp', gain: 1 }] : [])],
    };
  },

  // P03 numbered step: ledger numeral (N15), step row (L06), lines that land on the beats, optional typed prompt.
  steps(wrap, p, ctx) {
    const numeral = E.ledgerNumeral(String(p.n).padStart(2, '0'), 640); numeral.style.left = '330px'; numeral.style.top = '440px';
    const row = h('div', abs(100, 500, 880, null, `font:800 32px/1 ${SANS};letter-spacing:5px;color:var(--accent)`), `STEP ${String(p.n).padStart(2, '0')}${p.of ? ' / ' + String(p.of).padStart(2, '0') : ''}`);
    const name = h('div', abs(100, 556, 860, null, `font:900 ${p.font || 86}px/1.02 ${DISPLAY};letter-spacing:-2.5px;color:${P.ink}`), p.name);
    name.dataset.key = 'name';
    const ul = E.pencil(p.underline || 420, { seed: 3 + (p.n || 0), width: 11, color: 'var(--accent)' });
    wrap.append(numeral, row, name, ul.el);
    const lines = p.lines || [], LH = 134, CY = p.cardY || 830, CH = 60 + lines.length * LH + (p.prompt ? 196 : 0);
    const c = card(100, CY, 850, CH); c.dataset.key = 'card';
    const at = i => beat(ctx, i + 1, 0.7 + i * 0.6);
    const els = lines.map((tx, i) => {
      const l = h('div', abs(0, 30 + i * LH, 850, LH, `display:flex;align-items:center;gap:26px;padding:0 40px 0 112px;font:700 46px/1.12 ${SANS};letter-spacing:-.5px;color:${P.ink}`),
        `<i style="flex:none;width:18px;height:18px;border-radius:50%;background:var(--accent);display:block"></i><span>${tx}</span>`);
      c.append(l); return l;
    });
    let ty = null, pAt = 0;
    if (p.prompt) {
      const boxp = h('div', abs(40, 30 + lines.length * LH + 10, 770, 156, `border-radius:28px;background:#fff;box-shadow:inset 3px 4px 10px rgba(70,52,25,.16);padding:0 36px;display:flex;align-items:center;font:500 40px/1.22 ${SANS};color:${P.graphite}`));
      ty = E.typer(p.prompt, { cps: 26 }); boxp.append(ty.el); c.append(boxp);
      pAt = beat(ctx, lines.length + 1, at(lines.length - 1) + 0.5);
    }
    wrap.append(c);
    const u0 = beat(ctx, 0, 0.25);
    return {
      update(t) {
        const e = enter(ctx, t);
        numeral.style.opacity = outCubic(prog(t, -fr(2), fr(8))).toFixed(3);
        rise(row, e, 20); rise(name, e, 30); rise(c, enter(ctx, t, fr(3)), 50);
        ul.el.style.left = '104px'; ul.el.style.top = `${(p.underlineY || 556 + (p.font || 86) * 1.06)}px`;
        ul.update(prog(t, u0, fr(6)));
        els.forEach((l, i) => { const q = outCubic(prog(t, at(i) - fr(2), fr(6))); l.style.opacity = q.toFixed(3); l.style.transform = `translateX(${((1 - q) * 30).toFixed(1)}px)`; });
        if (ty) ty.update(t - pAt);
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 108, y: CY - 4 }, ...lines.map((_, i) => ({ t: at(i), x: 150, y: CY + 30 + i * LH + LH / 2 }))], 108) }),
      lamp: () => ({ x: 480, y: CY + CH / 2, k: 1 }),
      cues: [{ t: u0, sfx: 'scratch', gain: 0.6 }, ...lines.map((_, i) => ({ t: at(i), sfx: 'pop', gain: 0.6 })), ...(ty ? ticks(pAt, pAt + Math.min(ty.dur, 1.6), fr(3), 0.3) : [])],
    };
  },

  // M13 tools joining a hub by drawn lines (U12, U13).
  network(wrap, p, ctx) {
    const title = h('div', abs(80, 478, 920, null, `text-align:center;font:900 68px/1.05 ${DISPLAY};letter-spacing:-2px;color:${P.ink}`), p.title || '');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', 1080); svg.setAttribute('height', 1920); svg.style.cssText = 'position:absolute;left:0;top:0';
    wrap.append(title, svg);
    const HX = 540, HY = 1000, tiles = p.tiles || [], n = tiles.length;
    const hub = E.tile(p.hub.name, { size: 240, logo: p.hub.logo, label: false }); hub.el.style.left = `${HX - 120}px`; hub.el.style.top = `${HY - 120}px`; hub.el.dataset.key = 'hub';
    const at = i => beat(ctx, i, 0.5 + i * 0.45);
    const items = tiles.map((tl, i) => {
      const a = -Math.PI / 2 + (i / n) * 2 * Math.PI + (n % 2 ? 0 : Math.PI / n), x = HX + 330 * Math.cos(a), y = HY + 40 + 300 * Math.sin(a);
      const tEl = E.tile(tl.name, { size: 172, logo: tl.logo, sub: tl.sub || '', above: y < HY - 40 }); tEl.el.style.left = `${x - 86}px`; tEl.el.style.top = `${y - 86}px`;
      const d = Math.hypot(HX - x, HY - y), ux = (HX - x) / d, uy = (HY - y) / d;
      const line = E.connector(svg, x + ux * 104, y + uy * 104, HX - ux * 140, HY - uy * 140, i % 2 ? 34 : -34);
      wrap.append(tEl.el);
      return { tEl, line };
    });
    wrap.append(hub.el);
    return {
      update(t) {
        rise(title, enter(ctx, t), 24);
        hub.update(ctx.pre ? 1 : prog(t, -fr(3), fr(8)));
        items.forEach((k, i) => { k.tEl.update(prog(t, at(i) - fr(5), fr(7))); k.line.update(prog(t, at(i) - fr(1), fr(7))); });
        hub.el.style.transform += ` scale(${(1 + 0.06 * Math.max(...items.map((_, i) => pulse(t, at(i) + fr(5), fr(1), fr(5))), 0)).toFixed(4)})`;
      },
      avatar: t => ({ chip: { x: HX + 112, y: HY - 112, size: 108, ring: null } }),
      lamp: () => ({ x: HX, y: HY, k: 1 }),
      cues: tiles.flatMap((_, i) => [{ t: at(i) - fr(5), sfx: 'pop', gain: 0.55 }, { t: at(i) + fr(5), sfx: 'click', gain: 0.5 }]),
    };
  },

  // M07 not this, this: one card is struck out, the other is ticked.
  compare(wrap, p, ctx) {
    const mk = (d, y) => {
      const c = card(100, y, 850, 390, 'transform-origin:50% 50%');
      c.append(h('div', `padding:44px 52px 0 96px;font:800 32px/1 ${SANS};letter-spacing:4px;text-transform:uppercase;color:${P.muted}`, d.tag || ''),
        h('div', `padding:16px 52px 0;font:900 70px/1.02 ${DISPLAY};letter-spacing:-2px;color:${P.ink}`, d.title),
        h('div', `padding:18px 52px 0;font:500 44px/1.3 ${SANS};color:${P.graphite}`, (d.lines || []).join('<br>')));
      return c;
    };
    const a = mk(p.a, 500), b = mk(p.b, 950); b.dataset.key = 'card';
    const strike = E.pencil(p.strikeW || 600, { seed: 21, width: 13, color: 'var(--accent)' }); strike.el.style.left = '44px'; strike.el.style.top = '128px'; a.append(strike.el);
    const x = E.badge('cross', 100), ok = E.badge('tick', 100);
    x.el.style.left = '900px'; x.el.style.top = '455px'; ok.el.style.left = '900px'; ok.el.style.top = '905px';
    wrap.append(a, b, x.el, ok.el);
    const t0 = beat(ctx, 0, 0.6), t1 = beat(ctx, 1, 1.5);
    return {
      update(t) {
        const e = enter(ctx, t), q = outCubic(prog(t, t0 + fr(4), fr(8))), r = outCubic(prog(t, t1, fr(8)));
        a.style.opacity = (e * (1 - 0.45 * q)).toFixed(3);
        a.style.transform = `translateY(${((1 - e) * 50).toFixed(1)}px) rotate(${(-1.6 * q).toFixed(2)}deg) scale(${(1 - 0.03 * q).toFixed(4)})`;
        const eb = enter(ctx, t, fr(3));
        b.style.opacity = eb.toFixed(3);
        b.style.transform = `translateY(${((1 - eb) * 50 - 14 * r).toFixed(1)}px) scale(${(1 + 0.03 * r).toFixed(4)})`;
        b.style.outline = r > 0 ? `${(6 * r).toFixed(1)}px solid var(--accent)` : 'none';
        strike.update(prog(t, t0, fr(6))); x.update(prog(t, t0 + fr(4), fr(6))); ok.update(prog(t, t1, fr(6)));
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 84, y: 540 }, { t: t1, x: 84, y: 968 }], 100) }),
      lamp: t => ({ x: 540, y: t < t1 - 0.2 ? 700 : 1140, k: 1 }),
      cues: [{ t: t0, sfx: 'scratch', gain: 0.8 }, { t: t0 + fr(4), sfx: 'click', gain: 0.6 }, { t: t1, sfx: 'pop', gain: 0.8 }],
    };
  },

  // M03 bar race inside a card, already moving on the first frame.
  chart(wrap, p, ctx) {
    const title = h('div', abs(100, 500, 860, null, `font:900 66px/1.05 ${DISPLAY};letter-spacing:-2px;color:${P.ink}`), p.title || '');
    const sub = h('div', abs(100, 500 + (p.titleLines || 1) * 72 + 8, 860, null, `font:italic 600 40px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    const items = p.bars || [], CY = 500 + (p.titleLines || 1) * 72 + 96, c = card(100, CY, 850, 96 + items.length * 152); c.dataset.key = 'card';
    const b = E.bars(items, { w: 700, dur: p.run || 1.5, rowH: 118, gap: 34, labelW: 236 }); b.el.style.cssText += 'position:absolute;left:112px;top:56px'; c.append(b.el);
    wrap.append(title, sub, c);
    const hero = Math.max(0, items.findIndex(i => i.hero));
    return {
      update(t) { rise(title, enter(ctx, t), 24); rise(sub, enter(ctx, t, fr(2)), 24); rise(c, enter(ctx, t, fr(1)), 50); b.update(t + 0.15); },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 106, y: CY + 8 }, { t: (p.run || 1.5) + 0.1, x: 150, y: CY + 56 + hero * 152 + 59 }], 108) }),
      lamp: () => ({ x: 540, y: CY + 200, k: 1 }),
      cues: [...ticks(0, (p.run || 1.5) - 0.3, fr(3), 0.3), { t: (p.run || 1.5) - 0.05, sfx: 'pop', gain: 0.7 }],
    };
  },

  // A06 the avatar comes back large for the save prompt.
  save(wrap, p, ctx) {
    const title = h('div', abs(60, 1170, 960, null, `text-align:center;font:900 132px/1 ${DISPLAY};letter-spacing:-4px;color:${P.ink}`), p.title || 'Save this.');
    title.dataset.key = 'title';
    const sub = h('div', abs(100, 1320, 880, null, `text-align:center;font:italic 600 48px/1.25 ${SERIF};color:${P.muted}`), p.sub || '');
    const bm = E.bookmark(140); bm.el.style.left = '770px'; bm.el.style.top = '560px';
    wrap.append(title, sub, bm.el);
    const at = beat(ctx, 0, 0.35);
    return {
      update(t) {
        const e = outCubic(prog(t, -fr(1), fr(6)));
        title.style.opacity = e.toFixed(3); title.style.transform = `scale(${lerp(1.25, 1, e).toFixed(4)})`;
        rise(sub, outCubic(prog(t, fr(6), fr(8))), 24);
        bm.el.style.opacity = outCubic(prog(t, 0, fr(5))).toFixed(3); bm.update(prog(t, at, fr(10)));
      },
      avatar: t => ({ bust: { x: 540, y: 850 + (1 - outBack(prog(t, -fr(2), fr(9)), 1.2)) * 90, w: 470, tilt: -3 * pulse(t, at, fr(4), fr(10)) } }),
      lamp: () => ({ x: 540, y: 860, k: 1 }),
      cues: [{ t: 0, sfx: 'swoosh', gain: 0.6 }, { t: at + fr(8), sfx: 'pop', gain: 0.8 }],
    };
  },

  // Outro (signature): keyword keys (U17), comment field (U18), then the sign-off card with Follow (M23).
  cta(wrap, p, ctx) {
    const word = (p.keyword || 'LINK').toUpperCase(), size = Math.min(140, Math.floor((900 - 16 * (word.length - 1)) / word.length));
    const head = h('div', abs(60, 500, 960, null, `text-align:center;font:900 92px/1 ${DISPLAY};letter-spacing:-3px;color:${P.ink}`), 'Comment');
    const keys = E.keycaps(word, { size }); const kb = h('div', abs(0, 632, 1080, size + 30)); kb.append(keys.el); keys.el.dataset.key = 'keyword';
    const field = card(100, 850, 850, 132, 'border-radius:66px;display:flex;align-items:center;padding:0 30px 0 52px');
    const ty = E.typer(word, { cps: 12 }); const tx = h('div', `flex:1;font:800 50px ${SANS};letter-spacing:2px;color:${P.ink}`); tx.append(ty.el);
    const send = h('div', `position:relative;flex:none;width:84px;height:84px;border-radius:50%;background:var(--accent);box-shadow:4px 6px 12px rgba(70,52,25,.35)`,
      '<svg viewBox="0 0 100 100" width="84" height="84"><path d="M50 72 V30 M32 46 L50 28 L68 46" fill="none" stroke="#fffdf8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    field.append(tx, send);
    const rp = E.ripple(190); rp.el.style.left = '878px'; rp.el.style.top = '916px';
    const promise = h('div', abs(80, 1016, 920, null, `text-align:center;font:700 46px/1.25 ${SANS};color:${P.graphite}`), `and I'll send you <b style="color:${P.ink};font-weight:900">${p.send || 'the links'}</b>`);
    const sign = card(100, 1160, 850, 290); sign.dataset.key = 'signoff';
    const so = h('div', abs(256, 50, 570, null, `font:italic 700 56px/1.05 ${SERIF};white-space:nowrap;color:${P.ink}`), p.signoff || 'This is your AI guy.');
    const ul = E.pencil(500, { seed: 13, width: 10, color: 'var(--accent)' }); ul.el.style.left = '258px'; ul.el.style.top = '114px';
    const fb = h('div', abs(256, 164, 190, 80, `border-radius:40px;display:flex;align-items:center;justify-content:center;font:800 34px ${SANS}`));
    const fr2 = E.ripple(200); fr2.el.style.left = '351px'; fr2.el.style.top = '204px';
    sign.append(so, ul.el, fb, fr2.el);
    wrap.append(head, kb, field, rp.el, promise, sign);
    const tType = beat(ctx, 0, 0.5), tSend = tType + ty.dur + fr(4), tSign = beat(ctx, 1, tSend + 0.7), tFollow = tSign + 0.75;
    return {
      update(t) {
        rise(head, enter(ctx, t), 24);
        keys.update(t - fr(2), tType);
        rise(field, enter(ctx, t, fr(4)), 40); ty.update(t - tType);
        send.style.transform = `scale(${(1 - 0.12 * pulse(t, tSend, fr(1), fr(4))).toFixed(4)})`;
        rp.update(prog(t, tSend, fr(9)));
        rise(promise, outCubic(prog(t, tSend + fr(2), fr(7))), 20);
        rise(sign, outCubic(prog(t, tSign - fr(5), fr(8))), 60);
        ul.update(prog(t, tSign + fr(6), fr(7)));
        const on = t >= tFollow;
        fb.textContent = on ? 'Following' : 'Follow';
        fb.style.width = on ? '230px' : '190px';
        fb.style.background = on ? 'transparent' : 'var(--accent)'; fb.style.color = on ? P.ink : '#fffdf8';
        fb.style.border = on ? `4px solid ${P.ink}` : '4px solid var(--accent)';
        fb.style.transform = `scale(${(1 - 0.1 * pulse(t, tFollow, fr(1), fr(4))).toFixed(4)})`;
        fr2.update(prog(t, tFollow, fr(9)));
      },
      avatar: t => ({ chip: { x: 232, y: 1305 + (1 - outCubic(prog(t, tSign - fr(5), fr(8)))) * 60, size: 190, o: prog(t, tSign - fr(5), fr(5)), ring: prog(t, tSign + fr(3), fr(9)) } }),
      lamp: t => ({ x: 540, y: t < tSign ? 800 : 1290, k: 1 }),
      cues: [...[...word].map((_, i) => ({ t: i * fr(2), sfx: 'click', gain: 0.5 })), ...ticks(tType, tType + ty.dur, 1 / 12, 0.35), { t: tSend, sfx: 'pop', gain: 0.8 },
        { t: tSign - fr(4), sfx: 'swoosh', gain: 0.5 }, { t: tSign + fr(6), sfx: 'scratch', gain: 0.6 }, { t: tFollow, sfx: 'click', gain: 0.8 }],
    };
  },
};
