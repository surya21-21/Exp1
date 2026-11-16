// Camera pack: one continuous 3D paper world; the camera travels between scenes (no cuts),
// with depth in every scene. The contract is in README.md in this folder; the pack's scene
// types, transitions and layer are listed in camera.md. Recipe cards: collection/recipes/pack-camera.md.
import { makeWorld } from './camera/world.js';
import { SCENES as STATIONS } from './camera/stations.js';
import { TRANSITIONS as TRAVELS } from './camera/travels.js';

// type -> (wrap, props, ctx) => { update(t), avatar(t), lamp(t), cues }
export const SCENES = { ...STATIONS };

// name -> (overlay, ctx, info) => { lead, settle, both, sfx, gain, apply(p, out, inn, at, win), off() }
export const TRANSITIONS = { ...TRAVELS };

// [{ name, z: 'under' | 'over' | 'front', make(el, spec, ctx) => { update(frame), cues, ready() } }]
export const LAYERS = [{ name: 'deskWorld', z: 'under', make: makeWorld }];
