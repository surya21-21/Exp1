#!/usr/bin/env python3
"""Render the demo sheets in collection/demo from our own code.

  python collection/tools/make_demo.py

Plans reels/engine-test, asks the engine for chosen frames and lays them out
with labels. Run it again after changing anything in collection/lib or studio.
"""
import glob
import json
import os
import shutil
import subprocess

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
os.makedirs("build", exist_ok=True)
subprocess.run(["python3", "scripts/plan_reel.py", "reels/engine-test/reel.json", "--out", "build/demo.timed.json"], check=True)
spec = json.load(open("build/demo.timed.json"))
st = {s["type"]: s for s in spec["scenes"]}
F = 1 / 30


def sheet(name, items, w=250, cols=None):
    d = f"build/demo_{name}"
    shutil.rmtree(d, ignore_errors=True)
    times = ",".join(f"{t:.4f}" for t, _ in items)
    subprocess.run(["python3", "studio/render.py", "build/demo.timed.json", "--stills", d, "--times", times], check=True,
                   stdout=subprocess.DEVNULL)
    files = sorted(glob.glob(d + "/*.png"))
    order = sorted(range(len(items)), key=lambda i: items[i][0])          # stills come back in time order
    cols = cols or len(files)
    rows, hh = -(-len(files) // cols), int(w * 1920 / 1080)
    im = Image.new("RGB", (cols * (w + 8) - 8, rows * (hh + 30)), "white")
    draw = ImageDraw.Draw(im)
    for pos, i in enumerate(range(len(items))):
        f = files[order.index(i)]
        x, y = (pos % cols) * (w + 8), (pos // cols) * (hh + 30)
        draw.text((x + 4, y + 8), items[i][1], fill="black")
        im.paste(Image.open(f).convert("RGB").resize((w, hh), Image.LANCZOS), (x, y + 26))
    im.save(f"collection/demo/{name}.jpg", quality=86)
    print(name, im.size)


b, u, n, s2, c, ch, sv, ct = (st[k] for k in ("bigWord", "uiCard", "network", "steps", "compare", "chart", "save", "cta"))
sheet("n01-paper-tear", [(b["start"] + (k - 4) * F, f"frame {k + 1} of 8") for k in range(8)], w=230)
sheet("transitions", [
    (u["start"] - 2 * F, "N09 shuffle 1"), (u["start"] + 1 * F, "N09 shuffle 2"),
    (n["start"] + 1 * F, "N11 hole punch 1"), (n["start"] + 3 * F, "N11 hole punch 2"),
    (s2["start"] - 2 * F, "T17 page scroll 1"), (s2["start"] + 2 * F, "T17 page scroll 2"),
    (c["start"] - 1 * F, "T12 whip 1"), (c["start"] + 1 * F, "T12 whip 2"),
    (ch["start"] - 1 * F, "N04 lamp flicker"), (sv["start"] - 2 * F, "T05 ramp into cut")], w=210, cols=5)
sheet("elements", [
    (0.2, "N06 counter running"), (st["hookCounter"]["beats"][0] + 0.45, "N05 avatar cursor + ring"),
    (b["start"] + b["beats"][0] + 0.5, "N02 sticky-note slam"), (u["start"] + u["beats"][1] + 0.1, "M05 switch, tick, highlight"),
    (u["end"] - 0.25, "N08 stamp"), (n["end"] - 0.3, "M13 lines to a hub"),
    (s2["end"] - 0.4, "N15 numeral, N10 underline, M14 typing"), (c["end"] - 0.3, "M07 struck and ticked"),
    (ch["end"] - 0.3, "M03 bar race"), (sv["end"] - 0.2, "A06 save prompt"),
    (ct["start"] + ct["beats"][0] + 0.9, "U17 keys, U18 comment"), (ct["end"] - 0.2, "Outro: sign-off, Follow")], w=210, cols=6)
