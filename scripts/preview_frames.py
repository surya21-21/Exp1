#!/usr/bin/env python3
"""Pick 8 frame numbers that show each scene at its most telling moment."""
import json
import sys

p = json.load(open(sys.argv[1]))
fps, total = p["fps"], p["durationInFrames"]
beats = json.load(open("src/beats.json"))
picks = []
for s in p.get("sections", []):
    if s["type"] == "hook":
        picks += [s["start"] + 0.6, s["start"] + beats["hook"]["free"] + 0.3]
    elif s["type"] == "repo":
        picks += [s["start"] + beats["repo"]["strike"] + 0.4]
    elif s["type"] == "cta":
        picks += [s["start"] + beats["cta"]["keyword"] + 0.4]
    else:
        picks += [s["start"] + 0.8]
if not picks:
    picks = [total / fps * k / 8 for k in range(8)]
if len(picks) > 8:   # keep the first two, last one, and spread the rest
    keep = picks[:2] + [picks[2 + round(i * (len(picks) - 3) / 4)] for i in range(5)] + picks[-1:]
    picks = keep
frames = sorted({min(total - 1, max(0, round(t * fps))) for t in picks})
print(" ".join(str(f) for f in frames))
