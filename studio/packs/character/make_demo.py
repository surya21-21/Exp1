#!/usr/bin/env python3
"""Demo pictures of the character pack (collection/demo/character/).

  python3 studio/packs/character/make_demo.py build/reel.timed.json

r01-puppet.jpg is drawn from the charDemo test bench; every other picture is a strip of
consecutive or evenly spaced frames from the timed reel spec given (our own reel, our own
drawing). Uses studio/render.py, so the pictures are exactly what the engine draws.
"""
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT = os.path.join(ROOT, "collection", "demo", "character")
FONT = os.path.join(ROOT, "studio", "fonts", "Inter-Bold.otf")


def render(spec, times, tmp):
    d = tempfile.mkdtemp(dir=tmp)
    subprocess.run([sys.executable, os.path.join(ROOT, "studio", "render.py"), spec, "--stills", d, "--times", ",".join(f"{t:.4f}" for t in times)],
                   check=True, stdout=subprocess.DEVNULL)
    return [Image.open(os.path.join(d, f"t{float(f'{t:.4f}'):07.3f}.png")).convert("RGB") for t in times]


def puppet_box(im):
    """Centre of the puppet: the dark outline and hair pixels below the caption band."""
    g = im.convert("L").crop((0, 470, 1080, 1500))
    px = g.load()
    xs, ys = [], []
    for y in range(0, g.height, 4):
        for x in range(0, g.width, 4):
            if px[x, y] < 50:
                xs.append(x); ys.append(y + 470)
    if not xs:
        return 540, 1100
    xs.sort(); ys.sort()
    return xs[len(xs) // 2], ys[len(ys) // 2]


def sheet(cells, cols, w, h, path, title=None):
    font = ImageFont.truetype(FONT, 22)
    rows = -(-len(cells) // cols)
    top = 40 if title else 0
    im = Image.new("RGB", (cols * (w + 8) + 8, top + rows * (h + 36) + 8), "white")
    dr = ImageDraw.Draw(im)
    if title:
        dr.text((10, 8), title, fill="black", font=ImageFont.truetype(FONT, 26))
    for i, (label, c) in enumerate(cells):
        x, y = 8 + (i % cols) * (w + 8), top + 8 + (i // cols) * (h + 36)
        dr.text((x + 2, y), label, fill="black", font=font)
        im.paste(c.resize((w, h), Image.LANCZOS), (x, y + 30))
    im.save(path, quality=86)
    print(path)


def main():
    spec = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "build", "reel.timed.json")
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(ROOT, "build", "demo_tmp")
    os.makedirs(tmp, exist_ok=True)
    # R01: the puppet test bench
    demo = os.path.join(tmp, "demo.timed.json")
    json.dump({"title": "puppet demo", "accent": "#c2381d", "fps": 30, "duration": 8, "voice": False, "layers": ["puppet"],
               "scenes": [{"type": "charDemo", "props": {}, "start": 0, "end": 8, "beats": []}], "captions": []}, open(demo, "w"))
    shots = [("front pose", 0.5)] + [(f"walk {k + 1}", 1.4 + k * 0.05) for k in range(8)] + \
            [("point: pull back", 2.95), ("point: overshoot", 3.1), ("point: settled", 3.4), ("react: lean back", 4.4),
             ("hop: crouch", 5.22), ("hop: air", 5.45), ("land: squash", 5.72), ("sit, legs swing", 6.6), ("sit", 7.0)]
    ims = render(demo, [t for _, t in shots], tmp)
    cells = []
    for (label, _), im in zip(shots, ims):
        cx, cy = puppet_box(im)
        cells.append((label, im.crop((cx - 200, cy - 300, cx + 200, cy + 300))))
    sheet(cells, 9, 220, 330, os.path.join(OUT, "r01-puppet.jpg"), "R01 paper puppet: front pose, one walk stride (8 frames), point, react, hop, land, sit")

    s = json.load(open(spec))
    start = {sc["type"]: sc["start"] for sc in s["scenes"]}
    trans = {sc.get("in"): sc["start"] for sc in s["scenes"][1:]}
    beats = {sc["type"]: sc["beats"] for sc in s["scenes"]}
    f = 1 / 30
    strips = {
        "r02-char-hook": [start["charHook"] + t for t in (0, 1.30, 1.42, 1.54, 1.66, 1.78, 1.95, 4.45)],
        "r03-char-deal": [start["charDeal"] + beats["charDeal"][0] + k * 2 * f for k in range(-1, 7)],
        "r04-char-underline": [start["charUnderline"] + t for t in (0.4, 1.7, 2.1, 2.5, 2.9, 3.72, 4.4, 4.78)],
        "r05-char-measure": [start["charMeasure"] + t for t in (0.6, 1.0, 1.4, 2.3, 2.45, 2.6, 3.2, 4.8)],
        "r06-char-mute": [start["charMute"] + t for t in (1.0, 1.7, 2.3, 2.45, 2.55, 2.8, 3.9, 5.7)],
        "r07-char-sort": [start["charSort"] + t for t in (1.3, 1.95, 2.1, 2.3, 2.9, 5.2, 6.6, 7.3)],
        "r08-char-save": [start["charSave"] + t for t in (0.0, 0.1, 0.2, 0.35, 0.6, 1.0, 1.15, 1.6)],
        "r09-tally": [start["charHook"] + t for t in (0.0, 0.5, 1.0, 1.9, 2.6, 3.4, 4.47, 4.6)],
    }
    lead = {"charTear": 10, "charThrow": 6, "charLift": 8, "charHole": 12, "charWhip": 4, "charPush": 10}
    settle = {"charTear": 8, "charThrow": 8, "charLift": 10, "charHole": 12, "charWhip": 10, "charPush": 0}
    ids = {"charTear": "r10", "charThrow": "r11", "charLift": "r12", "charHole": "r13", "charWhip": "r14", "charPush": "r15"}
    for name, b in trans.items():
        if name in lead:
            n = lead[name] + settle[name]
            strips[f"{ids[name]}-{name.lower().replace('char', 'char-')}"] = [b + (-lead[name] + round(k * n / 7)) * f for k in range(8)]
    for name, times in strips.items():
        ims = render(spec, times, tmp)
        sheet([(f"{t:.2f}s", im) for t, im in zip(times, ims)], 8, 216, 384, os.path.join(OUT, f"{name}.jpg"))


if __name__ == "__main__":
    main()
