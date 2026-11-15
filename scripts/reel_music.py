#!/usr/bin/env python3
"""Make a music bed for a reel with ElevenLabs Music (instrumental, the reel's length).

  python scripts/reel_music.py build/reel.timed.json --reel reels/<name>/reel.json --out build/audio/music/bed.mp3

The prompt comes from "music" in reel.json, or a default that fits talking reels:
light, steady, nothing that fights the voice. Needs ELEVENLABS_API_KEY.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT = ("Light modern instrumental bed for a short tech explainer, warm muted plucks and soft "
           "felt piano over a clean steady beat around 100 BPM, minimal, no vocals, no big drops, "
           "stays out of the way of a spoken voice, ends cleanly")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--reel")
    ap.add_argument("--out", default="build/audio/music/bed.mp3")
    args = ap.parse_args()
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        print("BLOCKED: ELEVENLABS_API_KEY is not set, so no music was made.")
        return
    spec = json.load(open(args.spec))
    reel = json.load(open(args.reel)) if args.reel else {}
    if reel.get("music") == "none":
        print("music: none (asked for in reel.json)")
        return
    prompt = reel.get("music") or DEFAULT
    ms = int(min(600000, max(10000, (spec["duration"] + 1.5) * 1000)))
    body = json.dumps({"prompt": prompt, "music_length_ms": ms, "force_instrumental": True,
                       "model_id": reel.get("music_model", "music_v1")}).encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=body,
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        audio = urllib.request.urlopen(req, timeout=600).read()
    except urllib.error.HTTPError as e:
        print(f"music not made: ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:400]}")
        return
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    open(args.out, "wb").write(audio)
    print(f"music: {ms / 1000:.1f}s -> {args.out}")


if __name__ == "__main__":
    main()
