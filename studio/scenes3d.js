// 3D hero scenes (one or two a reel). Real depth with three.js: paper cards with
// thickness, a warm key light from the top-left casting soft shadows onto the desk,
// and a moving camera. Every value is a function of t, like the rest of the engine.
// The desk itself is the Paper Studio background behind a transparent canvas; only
// the shadows are drawn onto it.
import * as THREE from './vendor/three.module.min.js';
import { fr, clamp, lerp, prog, inCubic, outCubic, inOutCubic, outBack, spring, rng } from '../collection/lib/ease.js';
import { P, h, abs } from '../collection/lib/paper.js';
import * as E from '../collection/lib/elements.js';
import { travel } from '../collection/lib/avatar.js';

const { DISPLAY, SANS, SERIF } = E;
const beat = (ctx, i, d) => (ctx.beats && ctx.beats[i] != null ? ctx.beats[i] : d);
const rise = (el, e, dy = 44) => { el.style.opacity = e.toFixed(3); el.style.transform = `translateY(${((1 - e) * dy).toFixed(1)}px)`; };

function stage3d(wrap, accent) {
  const canvas = h('canvas', 'position:absolute;left:0;top:0;width:1080px;height:1920px');
  wrap.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1080, 1920, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xd9cdb6, 1.55));
  const key = new THREE.DirectionalLight(0xfff3e0, 2.1);       // light from the top-left, as on the paper
  key.position.set(-4.5, 7.5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 30 });
  scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x46341a, opacity: 0.26 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  return { renderer, scene, camera, accent, render: () => {
    scene.traverse(o => o.userData.paint && o.userData.paint());
    renderer.render(scene, camera);
  } };
}

// A card with real thickness and rounded corners; `draw(ctx2d, W, H)` paints its face.
export function paperCard(w, hgt, depth, draw, { res = 512, edge = '#e8e0cf' } = {}) {
  const r = Math.min(w, hgt) * 0.09, s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -hgt / 2);
  s.lineTo(w / 2 - r, -hgt / 2); s.quadraticCurveTo(w / 2, -hgt / 2, w / 2, -hgt / 2 + r);
  s.lineTo(w / 2, hgt / 2 - r); s.quadraticCurveTo(w / 2, hgt / 2, w / 2 - r, hgt / 2);
  s.lineTo(-w / 2 + r, hgt / 2); s.quadraticCurveTo(-w / 2, hgt / 2, -w / 2, hgt / 2 - r);
  s.lineTo(-w / 2, -hgt / 2 + r); s.quadraticCurveTo(-w / 2, -hgt / 2, -w / 2 + r, -hgt / 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: depth * 0.25, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -depth / 2);
  const cv = document.createElement('canvas');
  cv.width = res; cv.height = Math.round(res * hgt / w);
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(1 / w, 1 / hgt);
  tex.offset.set(0.5, 0.5);
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 });
  const side = new THREE.MeshStandardMaterial({ color: edge, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, [face, side]);
  mesh.rotation.order = 'YXZ';                 // tilt in the card's own frame, then turn
  // the face is painted on first use, once the fonts have loaded
  mesh.userData.paint = () => { if (!mesh.userData.painted) { draw(g, cv.width, cv.height); tex.needsUpdate = true; mesh.userData.painted = true; } };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export const rr = (g, x, y, w, hh, r) => { g.beginPath(); g.roundRect(x, y, w, hh, r); };

// Face of one studied reel: our own generic drawing of a phone screen, never a creator's frame.
export function reelFace(i, accent) {
  const R = rng(100 + i);
  return (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#fffdf8'); grd.addColorStop(1, '#efe8da');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const dark = i % 3 === 1;
    rr(g, W * 0.08, H * 0.05, W * 0.84, H * 0.9, W * 0.08);
    g.fillStyle = dark ? '#2a2723' : '#f7f2e8'; g.fill();
    g.fillStyle = dark ? '#f3ede2' : '#2a2723';
    g.font = `800 ${Math.round(W * 0.075)}px Inter`;
    g.fillText(['HOOK', 'WIPE', 'CUT', 'SLAM', 'SCROLL', 'COUNT'][i % 6], W * 0.15, H * 0.15);
    for (let k = 0; k < 3; k++) {                        // caption lines
      rr(g, W * 0.15, H * (0.19 + k * 0.045), W * (0.35 + 0.35 * R()), H * 0.022, H * 0.011);
      g.fillStyle = dark ? 'rgba(243,237,226,.35)' : 'rgba(42,39,35,.22)'; g.fill();
    }
    rr(g, W * 0.15, H * 0.36, W * 0.7, H * 0.3, W * 0.05);   // the card in the middle of the reel
    g.fillStyle = i % 2 ? accent : (dark ? '#4a463f' : '#d9d2c3'); g.fill();
    g.fillStyle = '#fffdf8';
    g.beginPath(); const cx = W * 0.5, cy = H * 0.51, s = W * 0.09;
    g.moveTo(cx - s * 0.6, cy - s); g.lineTo(cx + s, cy); g.lineTo(cx - s * 0.6, cy + s); g.closePath(); g.fill();
    g.fillStyle = dark ? '#f3ede2' : '#2a2723';
    g.font = `900 ${Math.round(W * 0.2)}px "Inter Display"`;
    g.fillText(String(i + 1).padStart(2, '0'), W * 0.15, H * 0.86);
    g.beginPath(); g.arc(W * 0.78, H * 0.81, W * 0.06, 0, 7);  // avatar-cursor dot
    g.fillStyle = accent; g.fill();
  };
}

export const SCENES3D = {
  // Hero 1 (H01 in 3D): twelve reels stand up from the desk in an arc while the camera
  // rises and swings round; the frame counter is already running in front of them.
  hook3d(wrap, p, ctx) {
    const st = stage3d(wrap, ctx.accent);
    const n = p.count || 12, cards = [], CW = 0.82, CH = 1.46;
    for (let i = 0; i < n; i++) {
      const c = paperCard(CW, CH, 0.045, reelFace(i, ctx.accent));
      st.scene.add(c);
      cards.push({ c, k: n === 1 ? 0 : i / (n - 1) - 0.5 });
    }
    const counter = E.counter({ from: p.from, to: p.to, dur: p.run || 1.3, digitW: 132, digitH: 192 });
    const box = h('div', abs(0, 400, 1080, 200, 'display:flex;justify-content:center')); box.append(counter.el); counter.el.dataset.key = 'counter';
    const label = h('div', abs(60, 618, 960, null, `text-align:center;font:900 70px/1.05 ${DISPLAY};letter-spacing:-1.5px;color:${P.ink}`), p.label || '');
    const sub = h('div', abs(60, 704, 960, null, `text-align:center;font:italic 600 44px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    const chips = h('div', abs(60, 1388, 960, null, 'display:flex;gap:22px;justify-content:center;flex-wrap:wrap'));
    const chipEls = (p.chips || []).map(tx => { const e = E.chip(tx, { dot: true, size: 40 }); chips.append(e); return e; });
    wrap.append(box, label, sub, chips);
    const shrinkAt = beat(ctx, 0, 1.1);
    const chipT = []; (p.chips || []).forEach((_, i) => chipT.push(Math.max(beat(ctx, i + 1, 0), (i ? chipT[i - 1] : shrinkAt) + 0.3)));
    const chipAt = i => chipT[i];
    return {
      update(t) {
        // a hand of cards standing on the desk fans open from a stack (already moving on
        // frame 0), each card turning about the same point at its foot
        const open = spring(prog(t, -0.45, 1.25), 0.9, 5.5);
        cards.forEach((k, i) => {
          const rz = -k.k * 1.75 * open, lean = -0.16 - 0.05 * Math.abs(k.k) * open;
          // after the counter lands, a wave runs through the fan: each card lifts and settles in turn
          const wave = Math.sin(Math.PI * clamp((t - (p.run || 1.3) - 0.1 - i * 0.09) / 0.45));
          const lift = 0.04 * Math.sin(t * 2.4 + i * 0.7) * open + 0.22 * wave;
          const px = 0, py = 0.02, pz = -i * 0.035;
          // centre = pivot + (rotate the card's half-height up-vector by lean, then by rz)
          const ux = -Math.sin(rz) * Math.cos(lean), uy = Math.cos(rz) * Math.cos(lean), uz = Math.sin(lean) * -1;
          k.c.position.set(px + ux * (CH / 2 + 0.05), py + uy * (CH / 2 + 0.05) + lift, pz + uz * (CH / 2) * -1);
          k.c.rotation.order = 'ZXY';
          k.c.rotation.set(lean, 0.25 * k.k * open, rz);
        });
        const m = inOutCubic(prog(t, 0, Math.max(2.4, ctx.dur)));
        const ang = lerp(-0.32, 0.22, m), rad = lerp(11.8, 9.2, m), hgt = lerp(1.9, 3.2, m);
        st.camera.position.set(Math.sin(ang) * rad, hgt, Math.cos(ang) * rad);
        st.camera.lookAt(0, 1.55, 0);
        st.render();
        counter.update(t + 0.12);
        rise(label, outCubic(prog(t, fr(4), fr(8))), 30);
        rise(sub, outCubic(prog(t, fr(10), fr(8))), 30);
        chipEls.forEach((e, i) => { const q = prog(t, chipAt(i), fr(6)); e.style.opacity = clamp(q * 3); e.style.transform = `scale(${q <= 0 ? 0.5 : lerp(0.5, 1, outBack(q, 2.2)).toFixed(4)})`; });
      },
      avatar(t) {
        const m = inOutCubic(prog(t, shrinkAt, fr(10))), e = outCubic(prog(t, -fr(2), fr(8)));
        const bx = lerp(540, 128, m), by = lerp(1250 + (1 - e) * 60, 500, m);
        return {
          bust: { x: bx, y: by, w: lerp(360, 150, m), o: e * (1 - clamp((m - 0.35) / 0.4)) },
          chip: { x: bx, y: by - lerp(44, 0, m), size: lerp(340, 116, m), o: clamp((m - 0.3) / 0.4), ring: prog(t, shrinkAt + fr(10), fr(9)) },
        };
      },
      lamp: () => ({ x: 540, y: 1000, k: 0.8 }),
      cues: [...Array.from({ length: Math.round(((p.run || 1.3) - 0.2) / fr(2)) }, (_, i) => ({ t: i * fr(2), sfx: 'tick', gain: 0.3 })),
        { t: (p.run || 1.3) - 0.12, sfx: 'impact', gain: 0.8 }, { t: shrinkAt, sfx: 'swoosh', gain: 0.6 },
        ...chipEls.map((_, i) => ({ t: chipAt(i), sfx: 'pop', gain: 0.6 }))],
    };
  },

  // Hero 2: thick index cards drop onto the desk in a stack, then fan out towards the
  // camera, one finding per card, while the camera tilts from above to eye level.
  cards3d(wrap, p, ctx) {
    const st = stage3d(wrap, ctx.accent);
    const items = p.items || [], n = items.length;
    const title = h('div', abs(60, 470, 960, null, `text-align:center;font:900 92px/1 ${DISPLAY};letter-spacing:-3px;color:${P.ink}`), p.title || '');
    const sub = h('div', abs(60, 574, 960, null, `text-align:center;font:italic 600 46px/1.2 ${SERIF};color:${P.muted}`), p.sub || '');
    title.dataset.key = 'title';
    wrap.append(title, sub);
    const cards = items.map((tx, i) => {
      const c = paperCard(1.5, 2.05, 0.09, (g, W, H) => {
        const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#fffdf8'); grd.addColorStop(1, '#f1ebdf');
        g.fillStyle = grd; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(194,56,29,.22)'; g.lineWidth = W * 0.006;   // index-card rules
        g.beginPath(); g.moveTo(0, H * 0.27); g.lineTo(W, H * 0.27); g.stroke();
        g.strokeStyle = 'rgba(90,120,170,.16)';
        for (let k = 1; k < 7; k++) { g.beginPath(); g.moveTo(0, H * (0.27 + k * 0.1)); g.lineTo(W, H * (0.27 + k * 0.1)); g.stroke(); }
        g.fillStyle = ctx.accent; g.font = `900 ${Math.round(W * 0.3)}px "Inter Display"`;
        g.fillText(String(i + 1), W * 0.09, H * 0.23);
        g.fillStyle = '#1b1a17'; g.font = `800 ${Math.round(W * 0.098)}px Inter`;
        const words = tx.split(' '); let line = '', y = H * 0.43;
        for (const w of words) {
          const test = line ? line + ' ' + w : w;
          if (g.measureText(test).width > W * 0.82 && line) { g.fillText(line, W * 0.09, y); line = w; y += H * 0.1; } else line = test;
        }
        g.fillText(line, W * 0.09, y);
      }, { res: 600 });
      st.scene.add(c);
      return c;
    });
    const fanAt = beat(ctx, 0, 0.75);
    return {
      update(t) {
        const e = outCubic(prog(t, -fr(2), fr(8)));
        rise(title, e, 30); rise(sub, outCubic(prog(t, fr(4), fr(8))), 24);
        const f = inOutCubic(prog(t, fanAt, fr(16)));
        cards.forEach((c, i) => {
          const d = prog(t, -fr(4) + i * fr(4), fr(9)), land = outBack(d, 1.2);
          const sx = (i - (n - 1) / 2) * 0.1, sy = 0.06 + i * 0.1, sr = (i % 2 ? 1 : -1) * 0.12 + i * 0.05;
          const col = i % 2, row = Math.floor(i / 2);
          const gx = (col - 0.5) * 1.66, gy = 1.2 + (0.5 - row) * 2.22 + 0.9, gz = row * 0.15;
          c.position.set(lerp(sx, gx, f), lerp(lerp(3.2, sy, land), gy, f), lerp(0, gz, f));
          c.rotation.set(lerp(-Math.PI / 2, -0.08, f), lerp(0, (col - 0.5) * -0.22, f), lerp(sr + (1 - land) * 0.6, (col - 0.5) * -0.06, f));
          c.visible = d > 0;
        });
        const m = inOutCubic(prog(t, 0, Math.max(2, ctx.dur)));
        st.camera.position.set(lerp(0.3, -0.35, m), lerp(17, 3.4, f), lerp(3.0, 18.5, f));
        st.camera.lookAt(0, lerp(0.2, 2.62, f), 0);
        st.render();
      },
      avatar: t => ({ chip: travel(t, [{ t: 0, x: 150, y: 1400 }, { t: fanAt + 0.6, x: 150, y: 560 }], 112) }),
      lamp: () => ({ x: 540, y: 1150, k: 0.8 }),
      cues: [...cards.map((_, i) => ({ t: -fr(4) + i * fr(4) + fr(8), sfx: 'pop', gain: 0.5 })).filter(c => c.t >= 0),
        { t: fanAt, sfx: 'swoosh', gain: 0.8 }],
    };
  },
};
