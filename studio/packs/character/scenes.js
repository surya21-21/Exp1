// Scene types of the character pack. Each is (wrap, props, ctx) => { update(t), character(t), lamp(t), cues }.
// character(t) is the puppet's pose at t (see act.js), computed from the same timeline as the scene.
import { fr, clamp, lerp, prog, outCubic, inOutCubic, outBack } from '../../../collection/lib/ease.js';
import { P, h, abs } from '../../../collection/lib/paper.js';
import { stand, idle, walk, walkPlan, hop, point, sit, react, look, face, armsTo, carry, push, haul, bigHead } from './act.js';

export const ADAPT = {};

export const SCENES = {
  // A test bench for the puppet: front pose, walk cycle, point, hop, sit and react, on the desk.
  charDemo(wrap, p, ctx) {
    const S = p.S || 230, Y = p.y || 1400;
    const ledge = h('div', abs(640, 1040, 330, 360, `border-radius:26px;background:linear-gradient(160deg,${P.card},${P.card2} 70%);box-shadow:4px 6px 12px ${P.shadowSoft},18px 44px 80px -24px ${P.shadowDeep}`));
    wrap.append(ledge);
    const W = walkPlan({ t0: 1.0, t1: 2.6, x0: 240, x1: 560, y0: Y, S });
    return {
      update() {},
      character(t) {
        const Q = stand(240, Y, S);
        idle(Q, t);
        walk(Q, t, W);
        point(Q, t, { t0: 3.0, t1: 3.7, hand: 0, at: [200, 700] });
        react(Q, t, { t0: 4.2, kind: 'leanBack', dur: 0.6, face: 'curious', dn: 1 });
        hop(Q, t, { t0: 5.3, dur: 0.42, x0: 560, y0: Y, x1: 800, y1: 1040, h: 90 });
        sit(Q, t, { t0: 5.9, seat: [800, 1040] });
        return Q;
      },
      lamp: () => ({ x: 540, y: 1100, k: 1 }),
      cues: [],
    };
  },
};
