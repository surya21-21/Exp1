// Character pack: the avatar drives the story with a body, props and reactions.
// The contract is in README.md in this folder. Names must be unique across the whole engine,
// so every name here starts with "char" (scene types, transitions) or is "puppet" (the layer).
//
// How it fits together:
//   - the layer "puppet" (R01) draws one paper puppet over every scene, for the whole reel;
//   - each scene type here has character(t): the puppet's pose at t, from the same timeline
//     that drives the scene, so what he does and what happens on the card are one event;
//   - each transition here may have character(p, win, A, B): his pose across the change;
//   - while he is on screen the engine's own bust and cursor chip are hidden (frame.state = null),
//     so there are never two of him.
import { fr, clamp, lerp } from '../../collection/lib/ease.js';
import { h } from '../../collection/lib/paper.js';
import { makeRig } from './character/rig.js';
import { resolve } from './character/act.js';
import { SCENES as CHAR_SCENES, ADAPT } from './character/scenes.js';
import { TRANSITIONS as CHAR_TRANSITIONS } from './character/transitions.js';

export const SCENES = { ...CHAR_SCENES };
export const TRANSITIONS = { ...CHAR_TRANSITIONS };

export const LAYERS = [{
  name: 'puppet',
  z: 'front',
  make(el, spec, ctx) {
    const opt = (spec.options && spec.options.puppet) || {};
    const under = h('div', 'position:absolute;inset:0'), mid = h('div', 'position:absolute;inset:0'), over = h('div', 'position:absolute;inset:0');
    el.append(under, mid, over);
    const rig = makeRig(mid, { heads: opt.heads || '../brand/avatar/heads', exprs: opt.expressions || '../brand/avatar/expressions' });
    rig.el.dataset.proxy = 'rig';                     // text in props is set in real px by hand (34 px and up)
    // the audit cannot see inside the SVG: an empty box marked data-key follows him
    const proxy = h('div', 'position:absolute;left:0;top:0;width:0;height:0;display:none');
    proxy.dataset.key = 'avatar'; proxy.dataset.proxy = 'puppet';
    el.append(proxy);
    // fg(index): a layer in front of the puppet for one scene's foreground (a desk he stands behind).
    // It shows and moves exactly as that scene's own layer does, transitions included.
    const fgs = [];
    const fg = index => { const d = h('div', 'position:absolute;inset:0;display:none'); over.append(d); fgs.push({ index, d }); return d; };
    const shared = ctx.shared.puppet = { rig, under, over, transitions: {}, el, fg, throwFrom: {}, rect: {} };
    const COPY = ['display', 'transform', 'transformOrigin', 'opacity', 'clipPath', 'webkitMaskImage', 'filter', 'zIndex'];
    return {
      update(frame) {
        for (const f of fgs) { const ws = frame.scenes[f.index].wrap.style; for (const k of COPY) f.d.style[k] = ws[k]; }
        const w = frame.win, tr = w ? shared.transitions[w.to] : null;
        const poseOf = (sc, local) => {
          if (!sc) return null;
          if (sc.impl.character) return sc.impl.character(local);
          if (ADAPT[sc.type]) return ADAPT[sc.type](local, sc, frame);
          return null;
        };
        let Q;
        if (tr && tr.character) {
          const A = frame.scenes[w.from], B = frame.scenes[w.to];
          Q = tr.character(w.p, w, poseOf(A, frame.t - A.start), poseOf(B, Math.max(0, frame.t - B.start)), frame);
        } else Q = poseOf(frame.main, frame.local);
        const drawn = Q ? rig.draw(resolve(Q), frame.t, frame.speaking) : rig.draw(null);
        if (Q && Q.blur) ctx.blur(rig.el, Q.blur[0], Q.blur[1]); else rig.el.style.filter = '';
        if (drawn && (Q.o ?? 1) > 0.01) {
          frame.state = null;                         // hide the engine's avatar: he is already here
          const b = drawn.box;
          let y1 = b.y1;
          if (Q.clipY != null) y1 = Math.min(y1, Q.clipY);
          const show = (Q.o ?? 1) > 0.5 && y1 - b.y0 > 8 && !Q.noKey;
          proxy.style.display = show ? 'block' : 'none';
          if (show) Object.assign(proxy.style, { left: `${b.x0.toFixed(0)}px`, top: `${b.y0.toFixed(0)}px`, width: `${(b.x1 - b.x0).toFixed(0)}px`, height: `${(y1 - b.y0).toFixed(0)}px` });
        } else proxy.style.display = 'none';
        shared.last = drawn;
      },
      cues: [],
      ready: () => rig.ready(),
    };
  },
}];

export { fr, clamp, lerp };
