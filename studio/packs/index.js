// The packs the engine loads. Each pack is one file (plus a folder of its own if it needs
// more) that adds scene types, transitions and whole-reel layers. See README.md here.
import * as camera from './camera.js';
import * as motion from './motion.js';
import * as character from './character.js';

export const PACKS = { camera, motion, character };
