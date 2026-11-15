// Reel engine. One page, one function: window.renderAt(t) draws the reel at time t.
// Nothing is remembered between calls, so any frame can be drawn alone and twice the same.
// Reads a timed reel spec (see reels/README.md), builds the scenes from scenes.js with the
// effect library in collection/lib, and exposes:
//   window.DURATION, window.FPS, window.CUES (sound cues from the same code that draws the
//   events), window.AUDIT() (boxes of the key elements, for the safe-zone check), window.READY.
import { FPS, fr, clamp, prog } from '../collection/lib/ease.js';
import { h, W, H, SAFE, background, contrast } from '../collection/lib/paper.js';
import { TRANSITIONS } from '../collection/lib/transitions.js';
import { captions, groupWords } from '../collection/lib/captions.js';
import { avatar, mixState } from '../collection/lib/avatar.js';
import { progress } from '../collection/lib/elements.js';
import { SCENES as FLAT } from './scenes.js';
import { SCENES3D } from './scenes3d.js';
const SCENES = { ...FLAT, ...SCENES3D };

export async function boot(specUrl) {
  const spec = await (await fetch(specUrl)).json();
  const stage = document.getElementById('stage');
  const accent = spec.accent || '#c2381d';
  stage.style.setProperty('--accent', accent);
  const layer = name => { const d = h('div', 'position:absolute;inset:0'); d.dataset.layer = name; stage.append(d); return d; };
  const under = layer('background'), sceneLayer = layer('scenes'), avLayer = layer('avatar'), ovLayer = layer('transition'),
    capLayer = layer('captions'), furn = layer('furniture'), over = layer('grain');
  const lamp = background(under, over);

  // Directional motion blur: a small pool of SVG filters, handed out afresh every frame.
  const defs = document.getElementById('defs'), pool = [];
  for (let i = 0; i < 8; i++) {
    defs.insertAdjacentHTML('beforeend', `<filter id="mb${i}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0 0"/></filter>`);
    pool.push(defs.lastElementChild.firstElementChild);
  }
  let used = 0;
  const blur = (el, sx, sy) => {
    if (sx < 0.6 && sy < 0.6) { el.style.filter = ''; return; }
    const i = used++ % pool.length;
    pool[i].setAttribute('stdDeviation', `${sx.toFixed(1)} ${sy.toFixed(1)}`);
    el.style.filter = `url(#mb${i})`;
  };
  const ctx = { accent, blur };

  const scenes = spec.scenes.map((s, i) => {
    const wrap = h('div', 'position:absolute;inset:0;display:none');
    sceneLayer.append(wrap);
    const make = i === 0 ? null : TRANSITIONS[s.in || 'cut'] || TRANSITIONS.cut;
    const tr = make ? make(ovLayer, ctx) : null;
    if (!SCENES[s.type]) throw new Error(`unknown scene type "${s.type}"`);
    const impl = SCENES[s.type](wrap, s.props || {}, { ...ctx, dur: s.end - s.start, beats: s.beats || [], pre: !!(tr && tr.both) });
    return { s, wrap, impl, tr };
  });

  const groups = spec.captions || groupWords(spec.words || []);
  const caps = captions(capLayer, groups, { accent });
  const av = avatar(avLayer, spec.avatar || '../brand/avatar/avatar.png', spec.heads === false ? null : '../brand/avatar/heads', spec.expressions === false ? null : '../brand/avatar/expressions');
  const spoken = groups.flatMap(g => g.words);
  const speakingAt = t => spoken.some(w => t >= w.s - 0.02 && t < w.e);
  const bar = progress(scenes.length);
  bar.el.style.cssText += 'position:absolute;left:0;right:0;top:196px';
  furn.append(bar.el);

  const indexAt = t => { let i = 0; scenes.forEach((sc, k) => { if (t >= sc.s.start - 1e-6) i = k; }); return i; };
  const local = (sc, t) => t - sc.s.start;

  window.renderAt = time => {
    used = 0;
    const t = clamp(time, 0, spec.duration - 1e-4), i = indexAt(t);
    let win = null;
    for (const j of [i, i + 1]) {
      const sc = scenes[j];
      if (!sc || !sc.tr || sc.tr.lead + sc.tr.settle === 0) continue;
      const a = sc.s.start - fr(sc.tr.lead), b = sc.s.start + fr(sc.tr.settle);
      if (t >= a - 1e-6 && t < b - 1e-6) { win = { j, p: (t - a) / (b - a) }; break; }
    }
    for (const sc of scenes) { sc.wrap.style.cssText = 'position:absolute;inset:0;display:none'; if (sc.tr) sc.tr.off(); }
    const show = (sc, tl, top) => { sc.wrap.style.display = 'block'; if (top) sc.wrap.style.zIndex = 2; sc.impl.update(tl); };
    let state, main;
    if (win) {
      const A = scenes[win.j - 1], B = scenes[win.j], after = t >= B.s.start - 1e-6;
      if (B.tr.both || !after) show(A, local(A, t), false);
      if (B.tr.both || after) show(B, Math.max(0, local(B, t)), true);
      B.tr.apply(win.p, A.wrap, B.wrap, B.s.at);
      const sa = A.impl.avatar ? A.impl.avatar(local(A, t)) : null, sb = B.impl.avatar ? B.impl.avatar(Math.max(0, local(B, t))) : null;
      main = after ? B : A;
      if (B.tr.both) state = mixState(sa, sb, win.p);
      else {
        // the scenes swap on one frame, so the avatar does too; only a chip present on both sides glides across
        state = { ...(after ? sb : sa) };
        if (sa && sb && sa.chip && sb.chip && (sb.chip.o ?? 1) > 0.5) state.chip = mixState({ chip: sa.chip }, { chip: sb.chip }, win.p).chip;
      }
    } else {
      main = scenes[i];
      show(main, local(main, t), false);
      state = main.impl.avatar ? main.impl.avatar(local(main, t)) : null;
    }
    av.update(state, t, speakingAt(t));
    const lp = main.impl.lamp ? main.impl.lamp(Math.max(0, local(main, t))) : null;
    lamp.update(lp ? lp.x : W / 2, lp ? lp.y : 900, lp ? lp.k : 0);
    caps.update(t);
    bar.update(i, prog(t, scenes[i].s.start, scenes[i].s.end - scenes[i].s.start));
    return true;
  };

  // Sound cues, absolute times, straight from the scenes and transitions.
  const cues = [];
  scenes.forEach(sc => {
    // each sound starts one frame before its picture event, as measured in the reference reels
    for (const c of sc.impl.cues || []) if (c.t >= -0.05 && sc.s.start + c.t < spec.duration) cues.push({ t: +(Math.max(0, sc.s.start + c.t - fr(1))).toFixed(3), sfx: c.sfx, gain: c.gain ?? 1 });
    if (sc.tr && sc.tr.sfx) cues.push({ t: +(Math.max(0, sc.s.start - fr(sc.tr.lead))).toFixed(3), sfx: sc.tr.sfx, gain: 0.9 });
  });
  window.CUES = cues.sort((a, b) => a.t - b.t);
  window.DURATION = spec.duration;
  window.FPS = spec.fps || FPS;
  window.INFO = { scenes: scenes.length, captionGroups: groups.length, wordsPerGroup: groups.map(g => g.words.length), accent, accentContrast: +contrast(accent, '#efeae0').toFixed(2), safe: SAFE,
    windows: scenes.filter(sc => sc.tr).map(sc => [+(sc.s.start - fr(sc.tr.lead) - 0.01).toFixed(3), +(sc.s.start + fr(sc.tr.settle) + 0.3).toFixed(3)]) };
  // Boxes of everything marked data-key that is on screen now, plus the caption line.
  window.AUDIT = () => {
    const out = [];
    // the tight box of what is drawn inside the element, not of its layout container
    const add = (el, name) => {
      const range = document.createRange(); range.selectNodeContents(el);
      const rs = [...range.getClientRects()].filter(r => r.width > 1 && r.height > 1);
      const r = el.children.length || !rs.length ? el.getBoundingClientRect() : { left: Math.min(...rs.map(q => q.left)), top: Math.min(...rs.map(q => q.top)), right: Math.max(...rs.map(q => q.right)), bottom: Math.max(...rs.map(q => q.bottom)), width: 2, height: 2 };
      if (r.width > 1 && r.height > 1) out.push({ name, x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom) });
    };
    stage.querySelectorAll('[data-key]').forEach(el => { if (el.offsetParent !== null && getComputedStyle(el).opacity > 0.5) add(el, el.dataset.key); });
    [...capLayer.children].forEach(el => {
      if (el.style.display === 'none') return;
      const rs = [...el.children].filter(w => +w.style.opacity > 0.5).map(w => w.getBoundingClientRect());
      if (rs.length) out.push({ name: 'caption', x0: Math.round(Math.min(...rs.map(r => r.left))), y0: Math.round(Math.min(...rs.map(r => r.top))), x1: Math.round(Math.max(...rs.map(r => r.right))), y1: Math.round(Math.max(...rs.map(r => r.bottom))) });
    });
    return out;
  };
  await document.fonts.ready;
  await Promise.all(['500 20px Inter', '700 20px Inter', '800 20px Inter', '900 20px Inter', '900 20px "Inter Display"', 'italic 700 20px Lora'].map(f => document.fonts.load(f)));
  await av.ready();
  window.renderAt(0);
  window.READY = true;
}
