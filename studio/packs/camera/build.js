// Camera pack: builders for the paper world. Cards with real thickness and painted faces,
// stacks of sheets, sound tokens, trays, the paper odometer, desk props and contact shadows.
// Everything is paper or card under one warm key light; faces are painted once, on the first
// frame drawn (after the fonts have loaded), so any frame can be drawn alone.
import * as THREE from '../../vendor/three.module.min.js';
import { rng } from '../../../collection/lib/ease.js';
import { rr } from '../../scenes3d.js';

export { rr };
export const INK = '#1b1a17', MUTED = '#7c766a', CARD = '#fffdf8', CARD2 = '#f2ede3', KRAFT = '#d8c4a0', EDGE = '#e8e0cf', GRAPHITE = '#4a463f', PAPER = '#efeae0';
export const DISPLAY = '"Inter Display","Inter",sans-serif', SANS = '"Inter",sans-serif', SERIF = '"Lora",serif';

// Textures waiting for their first paint (fonts are ready by the first frame).
const PENDING = [];
export function paintPending() { while (PENDING.length) PENDING.shift()(); }

// A canvas texture painted once by draw(g, w, h).
export function painted(wpx, hpx, draw) {
  const cv = document.createElement('canvas');
  cv.width = wpx; cv.height = hpx;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  PENDING.push(() => { draw(cv.getContext('2d'), wpx, hpx); tex.needsUpdate = true; });
  return tex;
}

export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });

function roundedRect(w, hgt, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -hgt / 2);
  s.lineTo(w / 2 - r, -hgt / 2); s.quadraticCurveTo(w / 2, -hgt / 2, w / 2, -hgt / 2 + r);
  s.lineTo(w / 2, hgt / 2 - r); s.quadraticCurveTo(w / 2, hgt / 2, w / 2 - r, hgt / 2);
  s.lineTo(-w / 2 + r, hgt / 2); s.quadraticCurveTo(-w / 2, hgt / 2, -w / 2, hgt / 2 - r);
  s.lineTo(-w / 2, -hgt / 2 + r); s.quadraticCurveTo(-w / 2, -hgt / 2, -w / 2 + r, -hgt / 2);
  return s;
}

// Extrude a shape into a slab of `depth`, centred on z = 0, with three material groups:
// 0 the front face (+z), 1 the edges, 2 the back face. ExtrudeGeometry puts both lids in
// group 0, back lid first; they are split here so a card can have two different faces.
export function slab(shape, depth, bevel = 0.25, curveSegments = 5) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * bevel, bevelSize: depth * bevel, bevelSegments: 2, curveSegments });
  geo.translate(0, 0, -depth / 2);
  const [lids, sides] = geo.groups, half = lids.count / 2;
  geo.clearGroups();
  geo.addGroup(lids.start + half, half, 0);
  geo.addGroup(sides.start, sides.count, 1);
  geo.addGroup(lids.start, half, 2);
  return geo;
}

// Map a texture onto a lid whose UVs are shape coordinates (x in -w/2..w/2, y in -h/2..h/2).
function fit(tex, w, hgt, mirror = false) {
  tex.repeat.set((mirror ? -1 : 1) / w, 1 / hgt);
  tex.offset.set(0.5, 0.5);
  return tex;
}

// A card with real thickness and rounded corners. front/back: (g, W, H) => paint, or a colour.
export function card(w, hgt, depth, { front = CARD, back = CARD2, edge = EDGE, res = 512, radius = null, shadow = true } = {}) {
  const geo = slab(roundedRect(w, hgt, radius ?? Math.min(w, hgt) * 0.08), depth);
  const face = (f, mirror) => {
    if (typeof f !== 'function') return mat(f);
    const tex = fit(painted(res, Math.max(2, Math.round(res * hgt / w)), f), w, hgt, mirror);
    return mat('#ffffff', { map: tex });
  };
  const m = new THREE.Mesh(geo, [face(front, false), mat(edge), face(back, true)]);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}

// A flat painted label lying on (or standing against) something: a thin card with no edge to speak of.
export function label(w, hgt, draw, { res = 512, depth = 0.008 } = {}) {
  return card(w, hgt, depth, { front: draw, back: CARD2, res, radius: Math.min(w, hgt) * 0.06 });
}

// Soft contact shadow: a warm blob under an object, darkest where it meets the desk (Gurney: occlusion).
let blobTex = null;
export function contact(w, d, opacity = 0.5) {
  if (!blobTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.45, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x46341a, alphaMap: blobTex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  m.scale.set(w, d, 1);
  m.renderOrder = -1;
  return m;
}

// A stack of paper sheets (one box): the edges show the sheets as fine lines.
const sheetTex = {};
export function stack(w, d, hgt, color = CARD) {
  if (!sheetTex[color]) sheetTex[color] = painted(64, 512, (g, W, H) => {
    g.fillStyle = color; g.fillRect(0, 0, W, H);
    const r = rng(9);
    for (let y = 0; y < H; y += 6) { g.fillStyle = `rgba(70,52,25,${(0.08 + 0.1 * r()).toFixed(3)})`; g.fillRect(0, y, W, 1.4); }
  });
  const side = sheetTex[color].clone();
  side.wrapS = side.wrapT = THREE.RepeatWrapping;
  side.repeat.set(1, hgt * 3.2);
  side.needsUpdate = true;
  const top = mat(color), sideM = mat('#ffffff', { map: side });
  const geo = new THREE.BoxGeometry(w, hgt, d);
  geo.translate(0, hgt / 2, 0);
  const m = new THREE.Mesh(geo, [sideM, sideM, top, top, sideM, sideM]);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// Sound tokens: round paper discs, one face in the accent with a speaker mark, the other plain.
// One InstancedMesh for all of them; groups: 0 side, 1 top (lit), 2 bottom (unlit).
export function tokens(n, r, th, accent) {
  const geo = new THREE.CylinderGeometry(r, r, th, 28, 1);
  const lit = painted(256, 256, (g, W) => {
    g.fillStyle = accent; g.fillRect(0, 0, W, W);
    g.strokeStyle = '#fffdf8'; g.fillStyle = '#fffdf8'; g.lineWidth = W * 0.05; g.lineCap = 'round';
    const c = W / 2;
    g.beginPath(); g.moveTo(c - W * 0.2, c - W * 0.08); g.lineTo(c - W * 0.1, c - W * 0.08); g.lineTo(c + W * 0.02, c - W * 0.19);
    g.lineTo(c + W * 0.02, c + W * 0.19); g.lineTo(c - W * 0.1, c + W * 0.08); g.lineTo(c - W * 0.2, c + W * 0.08); g.closePath(); g.fill();
    for (const k of [0.12, 0.22]) { g.beginPath(); g.arc(c + W * 0.04, c, W * k, -0.75, 0.75); g.stroke(); }
  });
  const plain = painted(256, 256, (g, W) => {
    g.fillStyle = '#f4efe5'; g.fillRect(0, 0, W, W);
    g.strokeStyle = 'rgba(124,118,106,.55)'; g.lineWidth = W * 0.035;
    g.beginPath(); g.arc(W / 2, W / 2, W * 0.3, 0, 7); g.stroke();
  });
  const m = new THREE.InstancedMesh(geo, [mat('#e9e1d2'), mat('#ffffff', { map: lit }), mat('#ffffff', { map: plain })], n);
  m.castShadow = true; m.receiveShadow = true;
  m.frustumCulled = false;
  return m;
}

// An open tray of kraft card: a base and four low walls.
export function tray(w, d, wall = 0.16, th = 0.035, color = KRAFT) {
  const g = new THREE.Group(), m = mat(color);
  const add = (sx, sy, sz, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); };
  add(w, th, d, 0, th / 2, 0);
  add(w, wall, th, 0, wall / 2, d / 2 - th / 2); add(w, wall, th, 0, wall / 2, -d / 2 + th / 2);
  add(th, wall, d, w / 2 - th / 2, wall / 2, 0); add(th, wall, d, -w / 2 + th / 2, wall / 2, 0);
  return g;
}

// A pencil lying on the desk (desk prop for the near layer): hexagonal body, wood cone, graphite tip, eraser.
export function pencil(len = 2.2, r = 0.05, color = '#cbb48d') {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat(color));
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, 0.012, r * 4, 6), mat('#e8c9a0'));
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.001, r * 1.1, 6), mat('#2a2723'));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, r * 1.6, 12), mat('#b9b2a5', { roughness: 0.5 }));
  const rub = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 1.6, 12), mat('#c2381d'));
  wood.position.y = len / 2 + r * 2; tip.position.y = len / 2 + r * 4 + r * 0.5;
  band.position.y = -len / 2 - r * 0.8; rub.position.y = -len / 2 - r * 2.4;
  for (const m of [body, wood, tip, band, rub]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  g.rotation.z = Math.PI / 2;
  const holder = new THREE.Group(); holder.add(g); g.position.y = r;
  return holder;
}

// A roll of paper tape standing on its side.
export function tapeRoll(R = 0.34, r = 0.22, w = 0.2, color = '#e9dcc0') {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 24 });
  geo.translate(0, 0, -w / 2);
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); m.position.y = R + 0.01;
  return g;
}

// A rubber eraser block.
export function eraser(w = 0.5, hgt = 0.16, d = 0.26) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), [mat('#efe4d6'), mat('#efe4d6'), mat('#f4ebdf'), mat('#d9c9b6'), mat('#c2381d'), mat('#efe4d6')]);
  m.position.y = hgt / 2; m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  return g;
}

// Text helper for painters: fit one line into a width.
export function fitText(g, text, x, y, maxW, font, size, align = 'left') {
  let s = size;
  g.font = font.replace('{s}', s);
  while (g.measureText(text).width > maxW && s > 8) { s -= 2; g.font = font.replace('{s}', s); }
  g.textAlign = align;
  g.fillText(text, x, y);
  return s;
}

// K02 paper odometer: folded-paper drums (ten flat faces each) behind a window in a card
// housing. update(v, speed) turns each drum to its digit of v; digits roll up from below, the
// higher drums only near a carry (as on a real counter, and as the flat N06 counter does).
// While a drum spins faster than about half a digit a frame it shows a vertically smeared set
// of digits (motion blur in the direction of travel).
export function odometer({ accent = '#c2381d', top = '', bottom = '', places = 5, commaAfter = 2 } = {}) {
  const R = 0.42, DW = 0.24, GAP = 0.035, CG = 0.1, FH = 2 * R * Math.sin(Math.PI / 10);
  const slot = 256;
  const atlas = smear => painted(slot, slot * 10, (g, Wd) => {
    for (let k = 0; k < 10; k++) {
      const y0 = k * slot;
      const grd = g.createLinearGradient(0, y0, 0, y0 + slot);
      grd.addColorStop(0, '#fffdf8'); grd.addColorStop(1, '#efe8da');
      g.fillStyle = grd; g.fillRect(0, y0, Wd, slot);
      g.fillStyle = 'rgba(70,52,25,.16)'; g.fillRect(0, y0, Wd, 4);
      g.save(); g.beginPath(); g.rect(0, y0, Wd, slot); g.clip();
      g.fillStyle = INK; g.font = `900 228px ${DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (smear) { g.globalAlpha = 0.16; for (let o = -72; o <= 72; o += 12) g.fillText(String(k), Wd / 2, y0 + slot / 2 + 10 + o); }
      else { g.setTransform(0.9, 0, 0, 1, Wd * 0.05, 0); g.fillText(String(k), Wd / 2, y0 + slot / 2 + 10); }
      g.restore();
    }
  });
  const sharp = atlas(false), smeared = atlas(true);
  // one drum: ten quads round the x axis; face k is centred at -36k degrees (0 = facing +z)
  const pos = [], uv = [];
  for (let k = 0; k < 10; k++) {
    const a0 = (-k * 36 - 18) * Math.PI / 180, a1 = (-k * 36 + 18) * Math.PI / 180;
    const P = (x, a) => [x, R * Math.sin(a), R * Math.cos(a)];
    const bl = P(-DW / 2, a0), br = P(DW / 2, a0), tr = P(DW / 2, a1), tl = P(-DW / 2, a1);
    const vb = 1 - (k + 1) / 10 + 0.002, vt = 1 - k / 10 - 0.002;
    pos.push(...bl, ...br, ...tr, ...bl, ...tr, ...tl);
    uv.push(0, vb, 1, vb, 1, vt, 0, vb, 1, vt, 0, vt);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const group = new THREE.Group();
  const winW = places * DW + (places - 1) * GAP + CG + 0.12, winH = FH * 1.12, cy = 0.5, PW = winW + 0.3, PH = 0.95, TILT = 14 * Math.PI / 180;
  // housing: front plate with a window, and the box behind it
  const plateShape = new THREE.Shape();
  plateShape.moveTo(-PW / 2, -PH / 2); plateShape.lineTo(PW / 2, -PH / 2); plateShape.lineTo(PW / 2, PH / 2); plateShape.lineTo(-PW / 2, PH / 2); plateShape.closePath();
  const hole = new THREE.Path(), hy = cy - PH / 2;
  hole.moveTo(-winW / 2, hy - winH / 2); hole.lineTo(-winW / 2, hy + winH / 2); hole.lineTo(winW / 2, hy + winH / 2); hole.lineTo(winW / 2, hy - winH / 2); hole.closePath();
  plateShape.holes.push(hole);
  const plateTex = fit(painted(1024, Math.round(1024 * PH / PW), (g, Wd, Ht) => {
    const grd = g.createLinearGradient(0, 0, Wd, Ht); grd.addColorStop(0, '#fffdf8'); grd.addColorStop(1, '#efe7d8');
    g.fillStyle = grd; g.fillRect(0, 0, Wd, Ht);
    g.strokeStyle = accent; g.lineWidth = 6; g.strokeRect(14, 14, Wd - 28, Ht - 28);
    const s = Wd / PW, wy0 = (PH / 2 - hy - winH / 2) * s, wy1 = (PH / 2 - hy + winH / 2) * s;
    g.fillStyle = accent; g.font = `800 ${Math.round(0.1 * s)}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (top) { g.save(); g.letterSpacing = '6px'; g.fillText(top, Wd / 2, wy0 / 2 + 8); g.restore(); }
    g.fillStyle = INK; g.font = `900 ${Math.round(0.13 * s)}px ${DISPLAY}`;
    if (bottom) { g.save(); g.letterSpacing = '4px'; g.fillText(bottom, Wd / 2, (wy1 + Ht) / 2 - 6); g.restore(); }
  }), PW, PH);
  const plate = new THREE.Mesh(slab(plateShape, 0.04, 0.2, 2), [mat('#ffffff', { map: plateTex }), mat(EDGE), mat(CARD2)]);
  plate.position.set(0, PH / 2, 0.02);
  plate.castShadow = true; plate.receiveShadow = true;
  group.add(plate);
  const D = 0.98, inner = mat('#3b352d'), shell = mat(CARD2);
  const box = (sx, sy, sz, x, y, z, m = shell) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; group.add(b); return b; };
  box(PW, 0.04, D, 0, PH - 0.02, -D / 2);
  box(0.04, PH, D, -PW / 2 + 0.02, PH / 2, -D / 2); box(0.04, PH, D, PW / 2 - 0.02, PH / 2, -D / 2);
  box(PW, PH, 0.04, 0, PH / 2, -D + 0.02);
  box(winW + 0.02, winH + 0.3, 0.02, 0, cy, -D + 0.08, inner);          // dark inside, seen between the drums
  const drums = [];
  let x = -winW / 2 + 0.06 + DW / 2;
  for (let i = 0; i < places; i++) {
    const m = new THREE.Mesh(geo, mat('#ffffff', { map: sharp }));
    m.position.set(x, cy - R * Math.cos(Math.PI / 10) * Math.sin(TILT), -0.035 - R * Math.cos(Math.PI / 10) * Math.cos(TILT));
    m.castShadow = false; m.receiveShadow = true;
    group.add(m);
    drums.push({ m, unit: Math.pow(10, places - 1 - i) });
    x += DW + GAP + (i === commaAfter - 1 ? CG : 0);
    if (i === commaAfter - 1) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.09, 0.03), mat(INK));
      c.position.set(x - GAP - CG / 2 - 0.0, cy - FH * 0.36, -0.03); c.rotation.z = -0.3;
      group.add(c);
    }
  }
  return {
    group, R, DW, winW, winH, cy, PW, PH,
    // v: the value now; speed: how far v moves in one frame
    update(v, speed = 0, landed = false) {
      for (const d of drums) {
        const raw = v / d.unit, cur = Math.floor(raw + 1e-9) % 10, f = raw - Math.floor(raw + 1e-9);
        const roll = landed ? 0 : d.unit === 1 ? f : Math.pow(f, 6);
        d.m.rotation.x = -(cur + roll) * Math.PI / 5 - TILT;
        const fast = !landed && speed / d.unit > 0.45;
        d.m.material.map = fast ? smeared : sharp;
      }
    },
  };
}
