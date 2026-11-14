#!/usr/bin/env python3
"""Label the sound effects of a reference video.

Takes the sound onsets found by study_reference.py, cuts a short clip around
each one, and names it two ways:
  - LAION-CLAP: best match from our own editing word list (zero-shot)
  - PANNs: the strongest everyday-sound classes at that moment (AudioSet)
Each model is optional: if one fails to load, the other still runs and the
report says which ran. Labels are a first pass; spot-check them by ear.

Writes into --out-dir:
  sfx-map.csv    - time, label, score, margin, unsure, panns, loudness, visual event
  sfx-report.md  - which sound lands on which visual event, and how often
"""
import argparse
import csv
import json
import os
import subprocess
from collections import Counter

import numpy as np

# word -> the sentence CLAP is asked about
LABELS = {
    "whoosh": "a fast whoosh transition sound effect",
    "swoosh": "a soft swoosh of air sound effect",
    "pop": "a short bubbly pop sound effect",
    "click": "a single click sound effect",
    "tick": "rapid ticking of a counter",
    "impact": "a deep bass impact hit sound effect",
    "riser": "a rising tension riser sound effect",
    "glitch": "a digital glitch sound effect",
    "stamp": "a rubber stamp thud",
    "slash": "a marker pen slash on paper",
    "chime": "a bright chime or bell notification",
    "typing": "keyboard typing",
    "shatter": "glass shattering",
    "servo": "a mechanical servo whir",
    "speech": "a person speaking",
    "music": "background music with no sound effect",
}
NOT_SFX = {"speech", "music"}


def load_audio(path, sr):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1",
                          "-ar", str(sr), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def clips_at(x, sr, times, before=0.1, after=0.6):
    n = int((before + after) * sr)
    out = np.zeros((len(times), n), dtype=np.float32)
    for k, t in enumerate(times):
        a = max(0, int((t - before) * sr))
        seg = x[a: a + n]
        out[k, : len(seg)] = seg
    return out


def run_clap(video, times):
    import laion_clap
    import torch

    model = laion_clap.CLAP_Module(enable_fusion=False)
    model.load_ckpt()
    x = load_audio(video, 48000)
    words = list(LABELS)
    with torch.no_grad():
        te = model.get_text_embedding([LABELS[w] for w in words], use_tensor=False)
        embs = []
        for i in range(0, len(times), 32):
            batch = clips_at(x, 48000, times[i: i + 32])
            embs.append(model.get_audio_embedding_from_data(x=batch, use_tensor=False))
    ae = np.concatenate(embs, axis=0)
    ae /= np.linalg.norm(ae, axis=1, keepdims=True) + 1e-9
    te = te / (np.linalg.norm(te, axis=1, keepdims=True) + 1e-9)
    sim = ae @ te.T
    res = []
    for row in sim:
        order = np.argsort(-row)
        res.append((words[order[0]], float(row[order[0]]), float(row[order[0]] - row[order[1]])))
    return res


def run_panns(video, times):
    from panns_inference import SoundEventDetection, labels

    x = load_audio(video, 32000)
    sed = SoundEventDetection(checkpoint_path=None, device="cpu")
    frame = sed.inference(x[None, :])[0]  # (time steps, 527 classes)
    fps = frame.shape[0] / (len(x) / 32000)
    res = []
    for t in times:
        a = max(0, int((t - 0.05) * fps))
        b = min(frame.shape[0], int((t + 0.4) * fps) + 1)
        m = frame[a:b].max(axis=0) if b > a else frame[-1]
        top = np.argsort(-m)[:3]
        res.append("; ".join(f"{labels[i]} {m[i]:.2f}" for i in top))
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out-dir", default="ref")
    ap.add_argument("--max-onsets", type=int, default=300)
    ap.add_argument("--margin", type=float, default=0.03,
                    help="below this lead over the second label, mark the label unsure")
    a = ap.parse_args()

    onsets = []
    with open(os.path.join(a.out_dir, "onsets.csv")) as f:
        for r in csv.DictReader(f):
            onsets.append((float(r["time"]), float(r["strength"])))
    onsets = sorted(sorted(onsets, key=lambda o: -o[1])[: a.max_onsets])
    times = [t for t, _ in onsets]
    study = json.load(open(os.path.join(a.out_dir, "study.json")))
    fps = study["source"]["analysis_fps"]
    events = [(t, "cut") for t in study["cuts"]] + [(t, "motion peak") for t in study["motion_peaks"]]

    notes, clap, panns = [], None, None
    if times:
        try:
            clap = run_clap(a.video, times)
            notes.append("LAION-CLAP ran.")
        except Exception as e:  # noqa: BLE001 - report and carry on with the other model
            notes.append(f"LAION-CLAP did not run: {type(e).__name__}: {e}")
        try:
            panns = run_panns(a.video, times)
            notes.append("PANNs ran.")
        except Exception as e:  # noqa: BLE001
            notes.append(f"PANNs did not run: {type(e).__name__}: {e}")
    else:
        notes.append("No sound onsets were found, so nothing was labelled.")

    x = load_audio(a.video, 22050) if times else np.zeros(1, dtype=np.float32)
    overall = float(np.sqrt((x ** 2).mean()) + 1e-9)
    seg = clips_at(x, 22050, times) if times else np.zeros((0, 1), dtype=np.float32)

    rows, pairs = [], Counter()
    for k, t in enumerate(times):
        label, score, margin = clap[k] if clap else ("", 0.0, 0.0)
        near = min(events, key=lambda e: abs(e[0] - t)) if events else None
        visual = near[1] if near and abs(near[0] - t) <= 2.5 / fps else ""
        rms = float(np.sqrt((seg[k] ** 2).mean()) + 1e-9)
        unsure = bool(clap) and margin < a.margin
        rows.append({
            "time": f"{t:.3f}", "label": label, "score": f"{score:.3f}", "margin": f"{margin:.3f}",
            "unsure": "yes" if unsure else "", "panns_top3": panns[k] if panns else "",
            "loudness_db_vs_track": f"{20 * np.log10(rms / overall):.1f}", "visual_event": visual,
        })
        if label and label not in NOT_SFX and not unsure:
            pairs[(label, visual or "no visual event")] += 1

    cols = ["time", "label", "score", "margin", "unsure", "panns_top3", "loudness_db_vs_track", "visual_event"]
    with open(os.path.join(a.out_dir, "sfx-map.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    with open(os.path.join(a.out_dir, "sfx-report.md"), "w") as f:
        f.write("# Sound map\n\n")
        for n in notes:
            f.write(f"- {n}\n")
        f.write(f"- Onsets labelled: {len(rows)}\n\n")
        if pairs:
            f.write("| Sound | Lands on | Times |\n| --- | --- | --- |\n")
            for (label, visual), c in pairs.most_common():
                f.write(f"| {label} | {visual} | {c} |\n")
        f.write("\nThese labels are a first pass by a model. Confirm at least 10 by ear before trusting the map.\n")
    print(open(os.path.join(a.out_dir, "sfx-report.md")).read())


if __name__ == "__main__":
    main()
