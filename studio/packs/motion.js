// Motion-graphics pack: kinetic type and UI; elements carry and morph from scene to scene.
// The contract is in README.md in this folder; the scene types, transitions and the layer are
// listed in motion.md, and each has a recipe card (G01-G15) in collection/recipes/pack-motion.md.
import { stepped } from '../../collection/lib/ease.js';
import { SCENES as A } from './motion/scenes-a.js';
import { SCENES as B } from './motion/scenes-b.js';
import { TRANSITIONS as T } from './motion/transitions.js';

// G13 on twos (M24): any scene of this pack drawn at 15 (or "stepped") drawings a second for
// the whole scene, never for part of it. Time is held for two frames; boiling lines take the
// next drawing on each step. Sound cues keep their own times.
const onTwos = make => (wrap, p, ctx) => {
  const s = make(wrap, p, ctx);
  if (!p.stepped) return s;
  const F = p.stepped === true ? 15 : +p.stepped, q = t => stepped(t, F);
  return { ...s, update: t => s.update(q(t)), avatar: s.avatar && (t => s.avatar(q(t))), lamp: s.lamp && (t => s.lamp(q(t))),
    // a cue lands on the frame its drawing first appears
    cues: (s.cues || []).map(c => ({ ...c, t: Math.ceil(c.t * F - 1e-6) / F })) };
};

// type -> (wrap, props, ctx) => { update(t), avatar(t), lamp(t), cues, selfEnter, exit(k) }
export const SCENES = Object.fromEntries(Object.entries({ ...A, ...B }).map(([k, v]) => [k, onTwos(v)]));

// name -> (overlay, ctx, info) => { lead, settle, both, sfx, gain, apply(p, out, inn, at, win), off() }
export const TRANSITIONS = { ...T };

// [{ name, z: 'under' | 'over' | 'front', make(el, spec, ctx) => { update(frame), cues, ready() } }]
// G14 word clock: draws nothing; it hands every spoken word (absolute seconds) to the scenes in
// ctx.shared.words, so a move can land on any word, not only on the *keyword* beats.
export const LAYERS = [{
  name: 'wordClock', z: 'under',
  make(el, spec, ctx) {
    ctx.shared.words = (spec.captions || []).flatMap(g => g.words.map(w => ({ w: w.w, s: w.s, e: w.e, kw: !!w.kw })));
    return { update() {}, cues: [] };
  },
}];
