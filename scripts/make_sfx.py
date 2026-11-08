#!/usr/bin/env python3
"""Synthesize the sound-effect track from build/sfx_cues.json.

Every sound is generated from noise and sine waves here, so there is
nothing to license. Sounds: whoosh, swoosh, pop, click, tick, impact, riser.
Output: one mono 44.1kHz WAV the length of the video, ready to mix.
Standard library only.
"""
import argparse
import json
import math
import random
import struct
import wave

SR = 44100


def env(n, attack, release_shape=3.0):
    a = max(1, int(n * attack))
    return [(i / a) if i < a else (1 - (i - a) / max(1, n - a)) ** release_shape for i in range(n)]


def filtered_noise(n, cutoff_from, cutoff_to, seed):
    rnd = random.Random(seed)
    out, y1, y2 = [], 0.0, 0.0
    for i in range(n):
        fc = cutoff_from + (cutoff_to - cutoff_from) * (i / n)
        a = 1 - math.exp(-2 * math.pi * fc / SR)
        x = rnd.uniform(-1, 1)
        y1 += a * (x - y1)          # two one-pole low-passes = smoother
        y2 += a * (y1 - y2)
        out.append(y2)
    peak = max(1e-6, max(abs(v) for v in out))
    return [v / peak for v in out]


def sweep(n, f0, f1, curve=1.0):
    out, ph = [], 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * (i / n) ** curve
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph))
    return out


def mul(a, b):
    return [x * y for x, y in zip(a, b)]


def add(a, b, gb=1.0):
    return [x + gb * y for x, y in zip(a, b)]


def whoosh(seed):
    n = int(0.42 * SR)
    noise = filtered_noise(n, 300, 3500, seed)
    e = [math.sin(math.pi * i / n) ** 2 for i in range(n)]
    return [0.55 * v for v in mul(noise, e)]


def swoosh(seed):
    n = int(0.22 * SR)
    noise = filtered_noise(n, 2500, 600, seed)
    e = [math.sin(math.pi * i / n) ** 1.5 for i in range(n)]
    return [0.4 * v for v in mul(noise, e)]


def pop(seed):
    n = int(0.11 * SR)
    tone = mul(sweep(n, 900, 260, 0.5), env(n, 0.01, 4))
    return [0.6 * v for v in tone]


def click(seed):
    n = int(0.05 * SR)
    tone = mul(sweep(n, 2200, 1800), env(n, 0.005, 6))
    burst = mul(filtered_noise(n, 6000, 6000, seed), env(n, 0.001, 12))
    return [0.5 * v for v in add(tone, burst, 0.6)]


def tick(seed):
    n = int(0.018 * SR)
    return [0.35 * v for v in mul(sweep(n, 1600, 1500), env(n, 0.02, 5))]


def impact(seed):
    n = int(0.6 * SR)
    low = mul(sweep(n, 95, 42, 0.6), env(n, 0.005, 2.5))
    hit = mul(filtered_noise(n, 1800, 300, seed), env(n, 0.002, 8))
    return [0.75 * v for v in add(low, hit, 0.5)]


def riser(seed):
    n = int(0.55 * SR)
    noise = filtered_noise(n, 400, 6000, seed)
    tone = sweep(n, 220, 880, 1.6)
    e = [(i / n) ** 2 for i in range(n)]
    return [0.35 * v for v in mul(add(noise, tone, 0.4), e)]


SOUNDS = {"whoosh": whoosh, "swoosh": swoosh, "pop": pop, "click": click,
          "tick": tick, "impact": impact, "riser": riser}


def load_wav(path):
    """Mono 16-bit 44.1kHz WAV -> floats scaled to peak 0.8, or None."""
    try:
        with wave.open(path, "rb") as w:
            if w.getnchannels() != 1 or w.getsampwidth() != 2 or w.getframerate() != SR:
                return None
            raw = w.readframes(w.getnframes())
    except (FileNotFoundError, wave.Error, EOFError):
        return None
    vals = [v / 32768 for v in struct.unpack(f"<{len(raw) // 2}h", raw)]
    peak = max(1e-6, max(abs(v) for v in vals))
    return [0.8 * v / peak for v in vals]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("--props", default="build/props.json")
    ap.add_argument("--out", default="build/sfx_track.wav")
    ap.add_argument("--library", default="build/audio/sfx",
                    help="folder of downloaded sounds (Openverse); a <name>.wav there replaces the generated one")
    args = ap.parse_args()

    cues = json.load(open(args.cues))
    p = json.load(open(args.props))
    total = int(p["durationInFrames"] / p["fps"] * SR) + SR
    track = [0.0] * total
    cache = {}
    for k, c in enumerate(cues):
        fn = SOUNDS.get(c["sfx"])
        lib = load_wav(f"{args.library}/{c['sfx']}.wav")
        if not fn and lib is None:
            continue
        key = (c["sfx"], 0 if lib is not None else k % 3)   # 3 variations of each generated sound
        if key not in cache:
            cache[key] = lib if lib is not None else fn(k % 3 + 7)
        s, g = int(c["t"] * SR), float(c.get("gain", 1.0))
        for i, v in enumerate(cache[key]):
            if 0 <= s + i < total:
                track[s + i] += g * v
    peak = max(1e-6, max(abs(v) for v in track))
    scale = 0.89 / peak if peak > 0.89 else 1.0
    with wave.open(args.out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v * scale)) * 32767))
                               for v in track))
    print(f"{len(cues)} cues -> {args.out} ({total / SR:.1f}s)")


if __name__ == "__main__":
    main()
