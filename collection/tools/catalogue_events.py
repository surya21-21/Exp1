#!/usr/bin/env python3
"""Catalogue every cut, transition and fast move in a video, frame by frame.

Every frame is measured (difference, changed area, brightness, sharpness and the
global motion between consecutive frames: shift, zoom, rotation). Each cut and
motion peak is grown into an event with a start, an end and a length in frames,
then described: kind, direction, zoom, speed curve, blur, flash, background
before and after, and the nearest sound onset.

Usage: catalogue_events.py VIDEO --study STUDY_JSON --onsets ONSETS_CSV --out DIR --id r01
Writes DIR/events.csv, DIR/events-summary.json and returns frames for strips.
"""
import argparse
import csv
import json
import math
import os
import subprocess

import cv2
import numpy as np

GW, GH = 144, 256      # analysis size
CW, CH = 140, 249      # strip frame size


def decode(path, fps, w, h, pix):
    ch = 1 if pix == "gray" else 3
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h}",
                          "-pix_fmt", pix, "-f", "rawvideo", "-"], check=True, capture_output=True).stdout
    n = len(raw) // (w * h * ch)
    a = np.frombuffer(raw[: n * w * h * ch], dtype=np.uint8)
    return a.reshape(n, h, w) if ch == 1 else a.reshape(n, h, w, 3)


def motion(prev, cur):
    p0 = cv2.goodFeaturesToTrack(prev, 150, 0.01, 6)
    if p0 is None or len(p0) < 12:
        return None
    p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, p0, None, winSize=(17, 17), maxLevel=2)
    ok = st.ravel() == 1
    if ok.sum() < 10:
        return None
    M, inl = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
    if M is None:
        return None
    a, b = M[0, 0], M[1, 0]
    s = math.hypot(a, b)
    rot = math.degrees(math.atan2(b, a))
    cx, cy = GW / 2, GH / 2
    tx = M[0, 0] * cx + M[0, 1] * cy + M[0, 2] - cx
    ty = M[1, 0] * cx + M[1, 1] * cy + M[1, 2] - cy
    return tx, ty, s, rot, float(inl.sum()) / max(1, ok.sum())


def border_colour(img):
    h, w, _ = img.shape
    m = max(2, int(0.08 * w))
    ring = np.concatenate([img[:m].reshape(-1, 3), img[-m:].reshape(-1, 3),
                           img[:, :m].reshape(-1, 3), img[:, -m:].reshape(-1, 3)])
    c = np.median(ring, axis=0).astype(int)
    return "#%02x%02x%02x" % tuple(c), float(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])


def analyse(video, study, onsets_csv, rid):
    fps = int(study["source"]["analysis_fps"])
    g = decode(video, fps, GW, GH, "gray")
    col = decode(video, fps, CW, CH, "rgb24")
    n = min(len(g), len(col))
    g, col = g[:n], col[:n]
    gi = g.astype(np.int16)
    d = np.zeros(n)
    cf = np.zeros(n)
    ad = np.abs(gi[1:] - gi[:-1])
    d[1:] = ad.mean(axis=(1, 2)) / 255.0
    cf[1:] = (ad > 12).mean(axis=(1, 2))
    ys = np.arange(GH)[None, :, None]
    cy = np.zeros(n)
    msk = ad > 12
    tot = msk.sum(axis=(1, 2))
    cy[1:] = np.where(tot > 0, (msk * ys).sum(axis=(1, 2)) / np.maximum(tot, 1) / GH, 0.5)
    L = g.mean(axis=(1, 2))
    sharp = np.array([cv2.Laplacian(f, cv2.CV_64F).var() for f in g])
    mot = [None] * n
    for i in range(1, n):
        if d[i] > 0.0015:
            mot[i] = motion(g[i - 1], g[i])

    onsets = []
    if onsets_csv and os.path.exists(onsets_csv):
        for r in csv.DictReader(open(onsets_csv)):
            onsets.append(float(r["time"]))
    onsets = np.array(onsets)

    cut_f = sorted(set(int(round(t * fps)) for t in study.get("cuts", [])))
    peak_f = sorted(set(int(round(t * fps)) for t in study.get("motion_peaks", [])))
    base = float(np.median(d))
    th = max(2.5 * base, 0.006)

    def grow(s, step):
        f, gap = s, 0
        while 0 < f + step < n and abs(f + step - s) < 12:
            if d[f + step] > th:
                f, gap = f + step, 0
            else:
                gap += 1
                # stepped animation repeats frames, so allow short gaps
                if gap > 2 or not (0 < f + step * (gap + 1) < n):
                    break
                if d[f + step * (gap + 1)] <= th and gap >= 2:
                    break
                step_to = f + step * (gap + 1)
                if d[step_to] > th:
                    f, gap = step_to, 0
        return f

    spans = []
    for seed, is_cut in [(f, True) for f in cut_f] + [(f, False) for f in peak_f]:
        if seed <= 0 or seed >= n:
            continue
        lo, hi = max(1, seed - 3), min(n - 1, seed + 3)
        s = seed if is_cut else lo + int(np.argmax(d[lo:hi + 1]))
        spans.append([grow(s, -1), grow(s, 1), is_cut, s])
    spans.sort(key=lambda v: v[3])
    merged = []
    for f0, f1, c, seed in spans:
        if merged and f0 <= merged[-1][1] + 1:
            prev = merged[-1]
            if seed - prev[3] <= 8:
                prev[1] = max(prev[1], f1)
                prev[2] = prev[2] or c
                prev[3] = seed
                continue
            mid = (prev[3] + seed) // 2
            prev[1] = min(prev[1], mid)
            f0 = max(f0, mid + 1)
        merged.append([f0, f1, c, seed])
    merged = [m[:3] for m in merged if m[1] >= m[0]]

    events = []
    for k, (f0, f1, has_cut) in enumerate(merged):
        nfr = f1 - f0 + 1
        ms = [(i, mot[i]) for i in range(f0, f1 + 1) if mot[i] is not None and mot[i][4] >= 0.5]
        coh = [(i, m) for i, m in ms if abs(m[0]) + abs(m[1]) > 0.4 or abs(m[2] - 1) > 0.004 or abs(m[3]) > 0.25]
        tx = sum(m[0] for _, m in coh) / GW * 100
        ty = sum(m[1] for _, m in coh) / GH * 100
        sc = float(np.prod([m[2] for _, m in coh])) if coh else 1.0
        rot = sum(m[3] for _, m in coh)
        ease = ""
        if len(coh) >= 3:
            mag = np.array([math.hypot(m[0], m[1]) + 100 * abs(m[2] - 1) + abs(m[3]) for _, m in coh])
            cum = np.cumsum(mag) / max(mag.sum(), 1e-9)
            half = cum[len(cum) // 2 - 1] if len(cum) >= 2 else 0.5
            ease = "ease-out" if half > 0.65 else ("ease-in" if half < 0.35 else "even")
        pre = L[max(0, f0 - 3):f0].mean() if f0 > 0 else L[f0]
        post = L[f1 + 1:f1 + 4].mean() if f1 + 1 < n else L[f1]
        inside = L[f0:f1 + 1]
        flash = ""
        if inside.max() - max(pre, post) > 30:
            flash = "white flash"
        elif min(pre, post) - inside.min() > 30:
            flash = "dip to dark"
        ref = np.median(sharp[max(0, f0 - 8):max(1, f0)])
        blur = bool(ref > 1 and sharp[f0:f1 + 1].min() / ref < 0.45)
        cb, lb = border_colour(col[max(0, f0 - 2)])
        ca, la = border_colour(col[min(n - 1, f1 + 2)])
        flip = "light to dark" if lb - la > 60 else ("dark to light" if la - lb > 60 else "")
        pk = f0 + int(np.argmax(d[f0:f1 + 1]))
        lead, settle = pk - f0, f1 - pk
        prof = d[f0:f1 + 1]
        big = np.where(prof > 0.45 * prof.max())[0]
        two_step = bool(len(big) >= 2 and (np.diff(big) > 1).any() and prof.max() > 0.08)
        ramp_in = bool(lead >= 3 and d[pk - 1] > 2.0 * max(d[f0], 1e-6) and d[pk - 1] > 0.02)
        motion_kind = ""
        if len(coh) >= max(3, 0.4 * nfr):
            if abs(math.log(max(sc, 1e-6))) > 0.06:
                motion_kind = "push-in" if sc > 1 else "pull-out"
            elif abs(rot) > 6:
                motion_kind = "spin or roll"
            elif math.hypot(tx, ty) > 6:
                if abs(tx) > abs(ty):
                    motion_kind = "slide, content moves " + ("right" if tx > 0 else "left")
                else:
                    motion_kind = "slide, content moves " + ("down" if ty > 0 else "up")
            else:
                motion_kind = "small camera move"
        if has_cut:
            if two_step:
                kind = "two-step transition"
            elif ramp_in:
                kind = "ramp into cut"
            elif lead <= 1 and settle <= 1:
                kind = "hard cut"
            elif lead <= 1:
                kind = "cut, then settle"
            else:
                kind = "lead-in, cut, settle"
            if motion_kind:
                kind += " (" + motion_kind + ")"
        else:
            kind = motion_kind or "in-place build or element move"
        t_peak = (f0 + int(np.argmax(d[f0:f1 + 1]))) / fps
        snd = ""
        if len(onsets):
            j = int(np.argmin(np.abs(onsets - pk / fps)))
            snd = round((onsets[j] - pk / fps) * fps, 1)
        events.append({
            "reel": rid, "n": k, "t0": round(f0 / fps, 3), "t1": round((f1 + 1) / fps, 3), "frames": nfr,
            "kind": kind, "has_cut": int(has_cut), "peak_diff": round(float(d[f0:f1 + 1].max()), 4),
            "changed_area": round(float(cf[f0:f1 + 1].max()), 3),
            "shift_x_pct": round(tx, 1), "shift_y_pct": round(ty, 1), "zoom": round(sc, 3), "rotation_deg": round(rot, 1),
            "speed_curve": ease, "flash": flash, "blur": int(blur),
            "bg_before": cb, "bg_after": ca, "bg_flip": flip,
            "lead_frames": lead, "settle_frames": settle,
            "profile_x1000": " ".join(str(int(round(v * 1000))) for v in prof[:40]),
            "sound_onset_frames_from_peak": snd, "f0": f0, "f1": f1, "t_peak": round(t_peak, 3),
        })

    # micro events: every local bump in the difference curve outside the events above
    inside = np.zeros(n, bool)
    for e in events:
        inside[max(0, e["f0"] - 1): e["f1"] + 2] = True
    sm = np.convolve(d, np.ones(3) / 3, mode="same")
    med = float(np.median(sm))
    mad = max(float(np.median(np.abs(sm - med))), 1e-5)
    thr = med + 2.5 * mad
    micro = [i for i in range(1, n - 1) if not inside[i] and sm[i] > thr and sm[i] >= sm[i - 1] and sm[i] > sm[i + 1]]
    zones = {"top": 0, "middle": 0, "bottom": 0}
    for i in micro:
        zones["top" if cy[i] < 0.33 else ("middle" if cy[i] < 0.66 else "bottom")] += 1
    moving = d > 0.0015
    still_runs, run = [], 0
    for v in moving[1:]:
        if not v:
            run += 1
        else:
            if run:
                still_runs.append(run)
            run = 0
    if run:
        still_runs.append(run)
    dur = n / fps
    near = np.convolve(moving.astype(float), np.ones(7), mode="same") > 0
    eff = float(moving[near].mean()) * fps if near.any() else 0.0
    summary = {
        "animation_rate_while_moving_fps": round(eff, 1),
        "reel": rid, "duration": round(dur, 2), "frames": int(n), "events": len(events),
        "small_changes": len(micro), "small_changes_per_second": round(len(micro) / dur, 2),
        "small_change_zones": zones,
        "frames_with_no_change_share": round(float((~moving[1:]).mean()), 3),
        "longest_still_seconds": round(max(still_runs) / fps, 2) if still_runs else 0,
        "median_gap_between_changes_frames": float(np.median(np.diff(sorted(micro + [e["f0"] for e in events])))) if len(micro) + len(events) > 2 else None,
    }
    return events, summary, col, fps


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--study", required=True)
    ap.add_argument("--onsets", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--id", default="reel")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    ev, summ, col, fps = analyse(a.video, json.load(open(a.study)), a.onsets, a.id)
    if ev:
        with open(os.path.join(a.out, "events.csv"), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=[k for k in ev[0] if k not in ("f0", "f1")], extrasaction="ignore")
            w.writeheader()
            w.writerows(ev)
    json.dump(summ, open(os.path.join(a.out, "events-summary.json"), "w"), indent=1)
    np.save(os.path.join(a.out, "_frames.npy"), col)
    json.dump(ev, open(os.path.join(a.out, "_events.json"), "w"))
    print(json.dumps(summ))
