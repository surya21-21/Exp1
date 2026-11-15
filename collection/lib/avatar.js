// The avatar in its two forms: the full bust (A01, A06) and the small round head
// chip that works as the cursor (A02-A04, A07; N05 adds the arrival ring).
// Both are cut from brand/avatar/avatar.png; nothing is redrawn.
import { fr, clamp, lerp, prog, outCubic, inOutCubic } from './ease.js';
import { h } from './paper.js';

const IMG_W = 536, IMG_H = 602, HEAD = { x: 272, y: 262, r: 232 };   // head circle inside the file

export function avatar(layer, src) {
  const bust = h('img', 'position:absolute;left:0;top:0;transform-origin:0 0;filter:drop-shadow(10px 16px 16px rgba(70,52,25,.28));display:none');
  bust.src = src;
  const chip = h('div', 'position:absolute;left:0;top:0;width:200px;height:200px;border-radius:50%;overflow:hidden;background:#f6f1e6;border:8px solid #fffdf8;box-sizing:border-box;box-shadow:6px 10px 18px rgba(70,52,25,.4);transform-origin:0 0;display:none');
  const k = 200 / (2 * HEAD.r), face = h('img', `position:absolute;width:${IMG_W * k}px;left:${100 - 8 - HEAD.x * k}px;top:${100 - 8 - HEAD.y * k}px`);
  face.src = src;
  chip.append(face);
  const ring = h('div', 'position:absolute;left:0;top:0;width:200px;height:200px;border-radius:50%;border:7px solid var(--accent);box-sizing:border-box;transform-origin:0 0;display:none');
  layer.append(ring, bust, chip);
  return {
    ready: () => Promise.all([bust.decode(), face.decode()]),
    // state: { bust: {x, y, w, o}, chip: {x, y, size, tilt, ring, o} }; x, y are centres. Either may be missing.
    update(state) {
      const b = state && state.bust, c = state && state.chip;
      if (b && (b.o ?? 1) > 0.01) {
        const s = b.w / IMG_W;
        bust.style.display = 'block';
        bust.style.opacity = (b.o ?? 1).toFixed(3);
        bust.style.transform = `translate(${(b.x - b.w / 2).toFixed(1)}px,${(b.y - (IMG_H * s) / 2).toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${(b.tilt || 0).toFixed(2)}deg)`;
      } else bust.style.display = 'none';
      if (c && (c.o ?? 1) > 0.01) {
        const s = c.size / 200;
        chip.style.display = 'block';
        chip.style.opacity = (c.o ?? 1).toFixed(3);
        chip.style.transform = `translate(${(c.x - c.size / 2).toFixed(1)}px,${(c.y - c.size / 2).toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${(c.tilt || 0).toFixed(2)}deg)`;
        const rp = c.ring;
        if (rp != null && rp > 0 && rp < 1) {
          const rs = s * lerp(1, 1.9, outCubic(rp)), size = 200 * rs;
          ring.style.display = 'block';
          ring.style.opacity = (1 - rp).toFixed(3);
          ring.style.transform = `translate(${(c.x - size / 2).toFixed(1)}px,${(c.y - size / 2).toFixed(1)}px) scale(${rs.toFixed(4)})`;
        } else ring.style.display = 'none';
      } else { chip.style.display = 'none'; ring.style.display = 'none'; }
    },
  };
}

// Cursor travel: stops = [{ t, x, y }] in time order. The chip leaves 9 frames before each
// stop and arrives on it, moving in a shallow arc and tilting into the move; a ring goes out on arrival.
export function travel(t, stops, size = 120) {
  let i = 0;
  while (i + 1 < stops.length && t >= stops[i + 1].t - fr(9)) i++;
  const cur = stops[i], prev = stops[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : prog(t, cur.t - fr(9), fr(9)), e = inOutCubic(p);
  const arc = Math.sin(Math.PI * p), dir = Math.sign(cur.x - prev.x) || 1;
  return {
    x: lerp(prev.x, cur.x, e), y: lerp(prev.y, cur.y, e) - 46 * arc * (i === 0 ? 0 : 1),
    size: cur.size || size, tilt: 9 * arc * dir * (i === 0 ? 0 : 1),
    ring: i === 0 ? null : prog(t, cur.t, fr(9)),
  };
}

// Blend two avatar states (used across a scene change).
export function mixState(a, b, p) {
  const e = inOutCubic(clamp(p)), out = {};
  for (const key of ['bust', 'chip']) {
    const x = a && a[key], y = b && b[key];
    if (x && y) {
      out[key] = {};
      for (const f of ['x', 'y', 'w', 'size', 'tilt']) if (x[f] != null || y[f] != null) out[key][f] = lerp(x[f] ?? y[f], y[f] ?? x[f], e);
      out[key].o = lerp(x.o ?? 1, y.o ?? 1, e);
    } else if (x) out[key] = { ...x, o: (x.o ?? 1) * (1 - clamp(p * 2)) };
    else if (y) out[key] = { ...y, o: (y.o ?? 1) * clamp(p * 2 - 1), ring: null };
  }
  return out;
}
