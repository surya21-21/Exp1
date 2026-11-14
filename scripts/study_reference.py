#!/usr/bin/env python3
"""Study a reference video frame by frame (ffmpeg + numpy only).

Samples by motion, not by the clock: every frame is measured, and every frame
is kept around cuts and motion peaks ("bursts") so fast transitions and
effects can be read as strips of consecutive frames.

Writes into --out-dir:
  study.json      - fps, duration, cuts, shot lengths, motion peaks, bursts
  diff_curve.csv  - frame, time, frame-to-frame difference (0..1)
  onsets.csv      - time, strength of each sound onset
  strips/         - burst strips (10 consecutive frames per row) and a calm
                    2-frames-a-second overview sheet
  report.md       - short summary of the numbers
"""
import argparse
import json
import math
import os
import subprocess

import numpy as np

W, H = 72, 128  # analysis size (portrait); only used for the difference curve


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def probe(path):
    out = sh([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,avg_frame_rate:format=duration",
        "-of", "json", path,
    ]).stdout
    info = json.loads(out)
    st = info["streams"][0]
    num, den = st["avg_frame_rate"].split("/")
    fps = float(num) / float(den) if float(den) else 30.0
    return {
        "width": st["width"], "height": st["height"],
        "fps": fps, "duration": float(info["format"]["duration"]),
    }


def diff_curve(path, fps):
    raw = sh([
        "ffmpeg", "-v", "error", "-i", path,
        "-vf", f"fps={fps},scale={W}:{H},format=gray", "-f", "rawvideo", "-",
    ]).stdout
    n = len(raw) // (W * H)
    frames = np.frombuffer(raw[: n * W * H], dtype=np.uint8).reshape(n, H, W).astype(np.int16)
    d = np.zeros(n, dtype=np.float64)
    if n > 1:
        d[1:] = np.abs(frames[1:] - frames[:-1]).mean(axis=(1, 2)) / 255.0
    return d


def find_cuts_and_peaks(d, fps):
    n = len(d)
    cuts, peaks = [], []
    if n < 5:
        return cuts, peaks
    thr_cut = max(0.06, d.mean() + 3 * d.std())
    for i in range(1, n - 1):
        if d[i] < thr_cut or d[i] < d[i - 1] or d[i] < d[i + 1]:
            continue
        before = d[max(1, i - 3): i].mean() if i > 1 else 0.0
        after = d[i + 1: i + 4].mean()
        # a hard cut is a one-frame spike; a wipe or fast move stays high for several frames
        if d[i] > 2.5 * max(before, after, 1e-4):
            if not cuts or i - cuts[-1] > 2:
                cuts.append(i)
    k = 5
    sm = np.convolve(d, np.ones(k) / k, mode="same")
    thr_pk = sm.mean() + sm.std()
    gap = max(1, int(0.4 * fps))
    for i in range(1, n - 1):
        if sm[i] < thr_pk or sm[i] < sm[i - 1] or sm[i] < sm[i + 1]:
            continue
        if any(abs(i - c) <= 2 for c in cuts):
            continue
        if peaks and i - peaks[-1] < gap:
            if sm[i] > sm[peaks[-1]]:
                peaks[-1] = i
            continue
        peaks.append(i)
    return cuts, peaks


def audio_onsets(path, sr=22050, frame=1024, hop=256):
    try:
        raw = sh(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1",
                  "-ar", str(sr), "-f", "f32le", "-"]).stdout
    except subprocess.CalledProcessError:
        return []
    x = np.frombuffer(raw, dtype=np.float32)
    if len(x) < frame * 2:
        return []
    nfr = 1 + (len(x) - frame) // hop
    idx = np.arange(frame)[None, :] + hop * np.arange(nfr)[:, None]
    mag = np.abs(np.fft.rfft(x[idx] * np.hanning(frame), axis=1))
    logm = np.log1p(100 * mag)
    flux = np.maximum(0, logm[1:] - logm[:-1]).sum(axis=1)
    flux = np.concatenate([[0.0], flux])
    med = np.median(flux)
    mad = max(float(np.median(np.abs(flux - med))), 0.05 * float(med), 1e-6)
    thr = med + 4 * mad
    min_gap = int(0.08 * sr / hop)
    out, last = [], -min_gap
    for i in range(1, len(flux) - 1):
        if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]:
            if i - last >= min_gap:
                out.append((i * hop / sr, float((flux[i] - med) / mad)))
                last = i
            elif out and (flux[i] - med) / mad > out[-1][1]:
                out[-1] = (i * hop / sr, float((flux[i] - med) / mad))
                last = i
    return out


def merge(windows):
    windows = sorted(windows)
    out = []
    for a, b in windows:
        if out and a <= out[-1][1] + 0.05:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def strip(path, start, dur, fps, out, width=216):
    n = max(1, int(round(dur * fps)))
    rows = math.ceil(n / 10)
    sh(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", path,
        "-vf", f"fps={fps},scale={width}:-2,tile=10x{rows}:padding=4:margin=4",
        "-frames:v", "1", "-q:v", "3", out])
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out-dir", default="ref")
    ap.add_argument("--max-strips", type=int, default=80)
    a = ap.parse_args()

    os.makedirs(os.path.join(a.out_dir, "strips"), exist_ok=True)
    info = probe(a.video)
    fps = int(min(60, max(1, round(info["fps"]))))
    dur = info["duration"]

    d = diff_curve(a.video, fps)
    cuts, peaks = find_cuts_and_peaks(d, fps)
    onsets = audio_onsets(a.video)

    with open(os.path.join(a.out_dir, "diff_curve.csv"), "w") as f:
        f.write("frame,time,diff\n")
        for i, v in enumerate(d):
            f.write(f"{i},{i / fps:.3f},{v:.5f}\n")
    with open(os.path.join(a.out_dir, "onsets.csv"), "w") as f:
        f.write("time,strength\n")
        for t, s in onsets:
            f.write(f"{t:.3f},{s:.2f}\n")

    # bursts: every frame of the first 3 s, and 0.5 s either side of each cut and motion peak
    windows = [(0.0, min(3.0, dur))]
    for i in cuts + peaks:
        t = i / fps
        windows.append((max(0.0, t - 0.5), min(dur, t + 0.5)))
    bursts, made = [], 0
    chunk = 40 / fps  # at most 40 frames (4 rows of 10) per strip image
    for w0, w1 in merge(windows):
        t = w0
        while t < w1 - 1e-3 and made < a.max_strips:
            length = min(chunk, w1 - t)
            name = f"burst_{made:03d}_t{t:07.3f}.jpg"
            n = strip(a.video, t, length, fps, os.path.join(a.out_dir, "strips", name))
            bursts.append({"file": name, "start": round(t, 3), "frames": n,
                           "seconds_per_frame": round(1 / fps, 4)})
            made += 1
            t += length

    # calm overview: 2 frames a second
    rows = max(1, math.ceil(dur * 2 / 10))
    sh(["ffmpeg", "-v", "error", "-y", "-i", a.video,
        "-vf", f"fps=2,scale=162:-2,tile=10x{rows}:padding=4:margin=4",
        "-frames:v", "1", "-q:v", "4", os.path.join(a.out_dir, "strips", "overview_2fps.jpg")])

    bounds = [0] + cuts + [len(d)]
    shots = [round((bounds[i + 1] - bounds[i]) / fps, 3) for i in range(len(bounds) - 1)]
    still = float((d < 0.002).mean()) if len(d) else 0.0
    study = {
        "source": {**info, "analysis_fps": fps, "frames": int(len(d))},
        "cuts": [round(i / fps, 3) for i in cuts],
        "motion_peaks": [round(i / fps, 3) for i in peaks],
        "shot_lengths": shots,
        "still_share": round(still, 3),
        "sound_onsets": len(onsets),
        "bursts": bursts,
        "limits": "Nothing shorter than one source frame can be seen; compression smears fast motion.",
    }
    with open(os.path.join(a.out_dir, "study.json"), "w") as f:
        json.dump(study, f, indent=2)

    med = float(np.median(shots)) if shots else 0.0
    with open(os.path.join(a.out_dir, "report.md"), "w") as f:
        f.write("# Reference study\n\n")
        f.write(f"- Source: {info['width']}x{info['height']}, {info['fps']:.2f} fps, {dur:.2f} s; analysed at {fps} fps ({len(d)} frames)\n")
        f.write(f"- Hard cuts: {len(cuts)}; motion peaks (wipes, fast moves, pops): {len(peaks)}\n")
        if shots:
            f.write(f"- Shot length: median {med:.2f} s, shortest {min(shots):.2f} s, longest {max(shots):.2f} s\n")
        f.write(f"- Share of frames with nothing changing: {still * 100:.1f}%\n")
        f.write(f"- Sound onsets found: {len(onsets)}\n")
        f.write(f"- Burst strips written: {len(bursts)} (10 consecutive frames per row, left to right, top to bottom)\n")
        if made >= a.max_strips:
            f.write(f"- Strip limit of {a.max_strips} reached; later bursts were not drawn\n")
        f.write("\nLimits: nothing shorter than one source frame can be seen, and compression smears fast motion.\n")
    print(open(os.path.join(a.out_dir, "report.md")).read())


if __name__ == "__main__":
    main()
