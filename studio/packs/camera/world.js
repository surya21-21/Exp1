// Camera pack, K01 "desk world": one continuous 3D paper world under the whole reel.
// One renderer, one scene graph, one camera. Each scene of the pack is a station on one big
// paper desk; the camera rests at a station while its scene plays and travels to the next
// across each scene change. The camera's pose is one function of the reel's time, so any
// frame can be drawn alone. House style from studio/scenes3d.js: paper with real thickness,
// a warm key light from the top-left of the screen, shadows on a shadow-only floor over the
// Paper Studio background, no tone mapping, a transparent canvas.
import * as THREE from '../../vendor/three.module.min.js';
import { fr, clamp, lerp } from '../../../collection/lib/ease.js';
import { h } from '../../../collection/lib/paper.js';
import { mixState } from '../../../collection/lib/avatar.js';
import { paintPending } from './build.js';

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  mix: (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
};
const { add, sub, mul, norm, cross, len } = v3;

// A station's frame on the desk: `at` = [x, z], `yaw` in degrees (0 = the camera looks along -z).
export function frame(at = [0, 0], yawDeg = 0) {
  const a = (yawDeg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return {
    at, yaw: a,
    // local [x, y, z] -> world
    p: q => [at[0] + q[0] * c + q[2] * s, q[1], at[1] - q[0] * s + q[2] * c],
    dir: q => [q[0] * c + q[2] * s, q[1], -q[0] * s + q[2] * c],
  };
}

// Camera pose: { eye, look, fov, roll }. Blend two poses (each part with its own progress).
export const mixPose = (A, B, pe, pl = pe, pf = pe) => ({ eye: v3.mix(A.eye, B.eye, pe), look: v3.mix(A.look, B.look, pl), fov: lerp(A.fov, B.fov, pf), roll: lerp(A.roll || 0, B.roll || 0, pf) });

export function applyPose(cam, P) {
  cam.position.set(P.eye[0], P.eye[1], P.eye[2]);
  const f = norm(sub(P.look, P.eye));
  let rt = cross(f, [0, 1, 0]);
  rt = len(rt) < 1e-5 ? [1, 0, 0] : norm(rt);
  let up = cross(rt, f);
  if (P.roll) { const c = Math.cos(P.roll), s = Math.sin(P.roll); up = add(mul(up, c), mul(rt, s)); }
  cam.up.set(up[0], up[1], up[2]);
  cam.lookAt(P.look[0], P.look[1], P.look[2]);
  cam.fov = P.fov;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
}

const tmpV = new THREE.Vector3();
export function projectWith(cam, p) {
  tmpV.set(p[0], p[1], p[2]).project(cam);
  return [(tmpV.x + 1) * 540, (1 - tmpV.y) * 960, tmpV.z];
}

export function makeWorld(el, spec, ctx) {
  const opt = { fov: 38, light: 2.1, ambient: 1.55, shadow: 0.26, ...((spec.options || {}).world || {}) };
  const canvas = h('canvas', 'position:absolute;left:0;top:0;width:1080px;height:1920px');
  el.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1080, 1920, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color('#efeae0'), 10, 40);     // atmospheric perspective: farther is lighter (Gurney)
  const camera = new THREE.PerspectiveCamera(opt.fov, 1080 / 1920, 0.05, 300);
  const tmpCam = camera.clone();
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xd9cdb6, opt.ambient));
  const key = new THREE.DirectionalLight(0xfff3e0, opt.light);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);                                    // the one shadow map
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.012;
  scene.add(key, key.target);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ color: 0x46341a, opacity: opt.shadow }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const S = spec.scenes;
  const indexAt = t => { let i = 0; S.forEach((sc, k) => { if (t >= sc.start - 1e-6) i = k; }); return i; };

  const W = {
    THREE, scene, camera, renderer, canvas, spec, ctx, now: 0,
    stations: {},   // scene index -> { update(tl), view(tl), avatar(tl), dom: [...] }
    travels: {},    // scene index -> the camera travel into that scene { kind, lead, settle, path(PA, PB, p, t), update(t), ... }
    station(index, def) { W.stations[index] = { index, dom: [], ...def }; return W.stations[index]; },
    travel(index, def) { W.travels[index] = def; return def; },
    // The travel window that contains t, if any.
    windowAt(t) {
      for (const j in W.travels) {
        const tr = W.travels[j], s = S[j].start, a = s - fr(tr.lead), b = s + fr(tr.settle);
        if (t >= a - 1e-6 && t < b - 1e-6) return { j: +j, tr, a, b, p: (t - a) / (b - a) };
      }
      return null;
    },
    // Where the camera is at reel time t (null when no station is in view).
    poseAt(t) {
      const w = W.windowAt(t);
      if (w) {
        const A = W.stations[w.j - 1], B = W.stations[w.j];
        const PA = A ? A.view(t - S[w.j - 1].start) : w.tr.from ? w.tr.from(t) : null;
        const PB = B ? B.view(t - S[w.j].start) : w.tr.to ? w.tr.to(t) : null;
        if (PA && PB) return w.tr.path(PA, PB, w.p, t, w);
        return PA || PB;
      }
      const i = indexAt(t), St = W.stations[i];
      return St ? St.view(t - S[i].start) : null;
    },
    project: p => projectWith(camera, p),
    projectAt(t, p) { const P = W.poseAt(t); if (!P) return null; applyPose(tmpCam, P); return projectWith(tmpCam, p); },
    // A box on screen around world points (for proxies and for keeping things in frame).
    box(pts) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of pts) { const q = projectWith(camera, p); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
      return [x0, y0, x1, y1];
    },
    // An empty div over a 3D thing, so the safe-zone audit can see it (data-key, data-proxy).
    proxy(stationIndex, wrap, key, pts) {
      const d = h('div', 'position:absolute;display:none');
      d.dataset.key = key; d.dataset.proxy = '1';
      wrap.append(d);
      W.stations[stationIndex].dom.push({ el: d, pts });
      return d;
    },
  };
  ctx.shared.world = W;

  // The key light follows the camera's heading, so it always comes from the top-left of the
  // screen and every shadow falls to the right and towards the viewer.
  function rig(P) {
    const f = norm(sub(P.look, P.eye));
    let hd = [f[0], 0, f[2]];
    hd = len(hd) < 1e-4 ? [0, 0, -1] : norm(hd);
    const rt = [-hd[2], 0, hd[0]];
    const L = norm(add(add(mul(rt, -0.56), mul(hd, 0.16)), [0, 0.81, 0]));
    const d = len(sub(P.look, P.eye)), eyeDesk = [P.eye[0], 0, P.eye[2]], lookDesk = [P.look[0], 0, P.look[2]];
    const tgt = v3.mix(eyeDesk, lookDesk, 0.62), R = clamp(0.5 * d + 2, 3, 20);
    key.target.position.set(tgt[0], 0, tgt[2]);
    key.position.set(tgt[0] + L[0] * 40, L[1] * 40, tgt[2] + L[2] * 40);
    Object.assign(key.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 10, far: 80 });
    key.shadow.camera.updateProjectionMatrix();
    scene.fog.near = d * 1.3 + 2;
    scene.fog.far = d * 4.5 + 12;
  }

  function avatarOf(frame, i, t) {
    const St = W.stations[i], sc = frame.scenes[i], tr = W.travels[i];
    let st = null;
    if (St && St.avatar) st = St.avatar(t - S[i].start);
    else if (sc && sc.impl.avatar) st = sc.impl.avatar(Math.max(0, t - S[i].start));
    if (!St && tr && tr.avatarAfter) st = tr.avatarAfter(t - S[i].start, st, sc);
    if (!st) return null;
    const out = {};
    for (const k of ['bust', 'chip']) {
      const s = st[k];
      if (!s) continue;
      if (s.at) {
        const q = projectWith(camera, s.at);
        out[k] = { ...s, x: q[0] + (s.dx || 0), y: q[1] + (s.dy || 0) };
        delete out[k].at;
      } else out[k] = s;
    }
    return out;
  }

  const inst = {
    ready: () => null,
    update(frame) {
      const t = frame.t;
      W.now = t;
      for (const k in W.stations) W.stations[k].update(t - S[k].start);
      for (const k in W.travels) if (W.travels[k].update) W.travels[k].update(t);
      const P = W.poseAt(t);
      W.pose = P;
      if (!P) { canvas.style.display = 'none'; ctx.blur(canvas, 0, 0); }
      else {
        canvas.style.display = 'block';
        applyPose(camera, P);
        rig(P);
        paintPending();
        renderer.render(scene, camera);
        // motion blur in the direction of travel (T12, T17): where the last frame's centre lands now
        const Q = W.poseAt(t - fr(1));
        let bx = 0, by = 0;
        if (Q) { const q = projectWith(camera, Q.look); bx = Math.abs(q[0] - 540); by = Math.abs(q[1] - 960); }
        const k = P.blurK ?? 0.3;
        ctx.blur(canvas, Math.min(32, bx * k), Math.min(32, by * k));
        // proxies of the scenes on screen
        const shown = new Set([frame.index]);
        if (frame.win) { shown.add(frame.win.from); shown.add(frame.win.to); }
        for (const i of shown) {
          const St = W.stations[i];
          if (!St) continue;
          for (const d of St.dom) {
            const pts = d.pts(t - S[i].start);
            if (!pts) { d.el.style.display = 'none'; continue; }
            const [x0, y0, x1, y1] = W.box(pts);
            d.el.style.cssText = `position:absolute;left:${x0.toFixed(1)}px;top:${y0.toFixed(1)}px;width:${(x1 - x0).toFixed(1)}px;height:${(y1 - y0).toFixed(1)}px`;
          }
        }
      }
      // The brand avatar: stations give 3D anchors, resolved with this frame's camera. A flat
      // scene reached by a world travel (the outro) may also have its avatar shaped by that travel.
      const mine = i => W.stations[i] || (W.travels[i] && W.travels[i].avatarAfter);
      if (frame.win && (mine(frame.win.from) || mine(frame.win.to))) {
        const sa = avatarOf(frame, frame.win.from, t), sb = avatarOf(frame, frame.win.to, t);
        frame.state = mixState(sa, sb, frame.win.p);
      } else if (!frame.win && mine(frame.index)) frame.state = avatarOf(frame, frame.index, t);
    },
  };
  return inst;
}
