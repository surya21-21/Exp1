#!/usr/bin/env python3
"""Quality checks on a rendered reel. Every line is a measured value and a pass
or fail; nothing is waved through. Checks that need a person's eye are listed
at the end as "look yourself".

  python scripts/check_reel.py --video build/final.mp4 --spec build/reel.timed.json \
      --audit build/audit.json --cues build/cues.json --out build/checks.md
"""
import argparse
import json
import re
import subprocess

import cv2
import numpy as np

SAFE = {"x0": 40, "x1": 1040, "y0": 230, "y1": 1490, "x1_low": 985}   # lower right is covered by the app's buttons


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path], text=True)
    return json.loads(out)


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", tail)
    p = re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail)
    return (float(i.group(1)) if i else None, float(p.group(1)) if p else None)


def motion(path):
    cap = cv2.VideoCapture(path)
    prev, diffs, first = None, [], None
    while True:
        ok, f = cap.read()
        if not ok:
            break
        g = cv2.cvtColor(cv2.resize(f, (144, 256), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
        if first is None:
            first = f
        if prev is not None:
            diffs.append(float(np.mean(np.abs(g - prev))))
        prev = g
    return np.array(diffs), first


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--audit")
    ap.add_argument("--cues")
    ap.add_argument("--out", default="build/checks.md")
    args = ap.parse_args()

    spec = json.load(open(args.spec))
    info = probe(args.video)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    fps = spec.get("fps", 30)
    rows = []

    def add(name, ok, value, note=""):
        rows.append((name, "pass" if ok else ("FAIL" if ok is False else "n/a"), value, note))

    dur = float(info["format"]["duration"])
    add("Size", (v["width"], v["height"]) == (1080, 1920), f'{v["width"]} x {v["height"]}')
    num, den = (int(x) for x in v["r_frame_rate"].split("/"))
    add("Frame rate", abs(num / den - fps) < 0.01, f"{num / den:.2f} fps")
    add("Length", abs(dur - spec["duration"]) <= 2.5 / fps, f'{dur:.2f} s (planned {spec["duration"]:.2f} s)')

    diffs, first = motion(args.video)
    paper = np.array([224, 234, 239], np.float32)                 # #efeae0 in BGR
    ink = float(np.mean(np.abs(first.astype(np.float32) - paper).max(axis=2) > 60))
    add("Frame zero is not empty", ink > 0.015, f"{ink * 100:.1f}% of the first frame is ink or objects",
        "readability of the promise: look yourself")
    still = diffs < 0.0006
    longest, run = 0, 0
    for s in still:
        run = run + 1 if s else 0
        longest = max(longest, run)
    add("Stillness", longest / fps <= 1.5, f"longest stretch with nothing changing: {longest / fps:.2f} s", "limit 1.5 s")
    th = max(2.5 * float(np.median(diffs)), 0.004)
    peaks = [i for i in range(1, len(diffs) - 1) if diffs[i] >= th and diffs[i] >= diffs[i - 1] and diffs[i] >= diffs[i + 1]]
    merged = [p for k, p in enumerate(peaks) if k == 0 or p - peaks[k - 1] >= 4]
    rate = len(merged) / max(dur, 1e-6)
    add("Rhythm", 0.5 <= rate <= 3.0, f"{rate:.2f} picture changes a second", "the 12 reference reels: 0.5 to 2.2")
    fast = float(diffs.max()) if len(diffs) else 0
    add("Transitions present", fast > 0.05, f"largest frame-to-frame change {fast:.3f}", "a hard change means a cut or wipe was drawn")

    sizes = [len(g["words"]) for g in spec.get("captions", [])]
    lone = [" ".join(w["w"] for w in g["words"]) for g in spec.get("captions", []) if len(g["words"]) == 1]
    add("Caption size", bool(sizes) and max(sizes) <= 4, f"{len(sizes)} groups, largest {max(sizes) if sizes else 0} words, one-word groups: {len(lone)}",
        "one-word groups are whole one-word sentences" if lone else "")
    first_cap = spec["captions"][0]["s"] if spec.get("captions") else None
    add("Words from the first frame", first_cap is not None and first_cap <= 0.1, f"first caption at {first_cap} s")

    if args.audit:
        audit = json.load(open(args.audit))
        bad = []
        wins = audit["info"].get("windows", [])
        for b in audit["boxes"]:
            if any(w[0] <= b["t"] <= w[1] for w in wins):      # mid-transition, things are meant to be moving through
                continue
            lim_x1 = SAFE["x1_low"] if b["y1"] > 1000 else SAFE["x1"]
            if b["x0"] < SAFE["x0"] or b["x1"] > lim_x1 or b["y0"] < SAFE["y0"] or b["y1"] > SAFE["y1"]:
                bad.append(b)
        names = sorted({b["name"] for b in bad})
        add("Safe zone", not bad, f'{len(audit["boxes"])} boxes checked, {len(bad)} outside' + (f' ({", ".join(names)})' if names else ""),
            "key elements and captions, 5 times a second, outside transitions")
        c = audit["info"]["accentContrast"]
        add("Accent contrast on paper", c >= 4.5, f'{c} to 1 for {audit["info"]["accent"]}', "needs 4.5 to 1")
        zero = [b for b in audit["boxes"] if b["t"] == 0 and b["name"] != "caption"]
        add("Something on screen at frame zero", bool(zero), ", ".join(sorted({b["name"] for b in zero})) or "nothing marked")

    if args.cues:
        cues = json.load(open(args.cues))
        frames = {}
        for cu in cues:
            frames.setdefault(round(cu["t"] * fps), []).append(cu["sfx"])
        clash = {k: x for k, x in frames.items() if len(x) > 1}
        add("One effect a frame", not clash, f"{len(cues)} cues, {len(clash)} frames with two")

    if a is None:
        add("Sound", False, "no audio track")
    else:
        lufs, peak = loudness(args.video)
        if spec.get("voice"):
            add("Loudness", lufs is not None and -16.5 <= lufs <= -13, f"{lufs} LUFS", "target -14 to -16")
        else:
            add("Loudness", None, f"{lufs} LUFS (effects only)", "BLOCKED: no voice yet, so the mix cannot be judged")
        add("Peak", peak is not None and peak <= -1.0, f"{peak} dBFS", "limit -1")
    add("Voice", True if spec.get("voice") else None, "present" if spec.get("voice") else "none",
        "" if spec.get("voice") else "BLOCKED: ELEVENLABS_API_KEY is not set and no voiceover.mp3 was supplied")

    last = spec["scenes"][-1]
    add("Signature outro", last["type"] == "cta", f'last scene: {last["type"]}', '"Comment KEYWORD ... This is your AI guy."')

    look = ["Frame zero: is the promise readable with the sound off?",
            "Does each scene carry something across the change (avatar, caption, progress tabs)?",
            "Facts: does every number match the fact table and its source?",
            "Truth: is every \"I\" statement true for you?",
            "Licences: voice, music and logos recorded?"]
    fails = [r for r in rows if r[1] == "FAIL"]
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(f'# Checks: {spec.get("title", "")}\n\n')
        f.write(f"{len(rows) - len(fails)} of {len(rows)} lines are pass or not applicable; **{len(fails)} fail**.\n\n")
        f.write("| Check | Result | Measured | Note |\n| --- | --- | --- | --- |\n")
        for r in rows:
            f.write(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} |\n")
        f.write("\n## Look yourself\n\n" + "\n".join(f"- {x}" for x in look) + "\n")
    print(open(args.out, encoding="utf-8").read())


if __name__ == "__main__":
    main()
