// Camera pack: one continuous 3D paper world; the camera travels between scenes.
// The contract is in README.md in this folder. Names must be unique across the whole engine.

// type -> (wrap, props, ctx) => { update(t), avatar(t), lamp(t), cues }
export const SCENES = {};

// name -> (overlay, ctx, info) => { lead, settle, both, sfx, gain, apply(p, out, inn, at, win), off() }
export const TRANSITIONS = {};

// [{ name, z: 'under' | 'over' | 'front', make(el, spec, ctx) => { update(frame), cues, ready() } }]
export const LAYERS = [];
