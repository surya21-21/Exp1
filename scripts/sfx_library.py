#!/usr/bin/env python3
"""Make the channel's sound-effect set with ElevenLabs Sound Effects, once.

  python scripts/sfx_library.py --out assets/sfx

Writes one mono 44.1 kHz WAV per sound name used by the engine, trimmed so the
sound starts on its first sample (the engine already places it one frame early).
make_sfx.py uses these files in place of its built-in synthesised sounds.
Needs ELEVENLABS_API_KEY. Existing files are kept unless --force.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

SOUNDS = {
    "tear":    ("a single sheet of paper torn quickly in one stroke, close and dry, no room sound", 0.6),
    "stamp":   ("a rubber stamp pressed firmly onto paper on a wooden desk, one soft thud", 0.5),
    "scratch": ("one quick pencil stroke on paper, a short scribbled underline", 0.5),
    "swoosh":  ("a soft quick airy swoosh for a UI transition, subtle and clean", 0.5),
    "whoosh":  ("a smooth fast whoosh passing by, clean motion graphics transition", 0.8),
    "pop":     ("a small soft bubbly pop for a UI element appearing, clean and short", 0.5),
    "click":   ("a crisp single mechanical button click, close and dry", 0.5),
    "tick":    ("one tiny soft tick of a counter digit changing, very short", 0.5),
    "impact":  ("a soft deep cinematic hit with a short warm tail, clean, for a number landing", 1.2),
    "riser":   ("a short tense whoosh riser that builds fast and stops abruptly", 1.0),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="assets/sfx")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        sys.exit("BLOCKED: ELEVENLABS_API_KEY is not set")
    os.makedirs(args.out, exist_ok=True)
    made = []
    for name, (prompt, dur) in SOUNDS.items():
        dest = os.path.join(args.out, f"{name}.wav")
        if os.path.exists(dest) and not args.force:
            continue
        body = json.dumps({"text": prompt, "duration_seconds": dur, "prompt_influence": 0.6}).encode()
        req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", data=body,
                                     headers={"xi-api-key": key, "Content-Type": "application/json"})
        try:
            audio = urllib.request.urlopen(req, timeout=180).read()
        except urllib.error.HTTPError as e:
            print(f"{name}: ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:300]}")
            continue
        tmp = os.path.join(tempfile.mkdtemp(), "a.mp3")
        open(tmp, "wb").write(audio)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                        "silenceremove=start_periods=1:start_threshold=-40dB,afade=t=out:st=%.2f:d=0.08" % max(0.05, dur - 0.1),
                        "-ac", "1", "-ar", "44100", "-sample_fmt", "s16", dest], check=True)
        made.append(name)
    open(os.path.join(args.out, "LICENSE.md"), "w").write(
        "# Sound effects\n\nGenerated with ElevenLabs Sound Effects on the channel owner's paid plan, "
        "for use in the channel's videos. Prompts are in `scripts/sfx_library.py`.\n")
    print("made:", ", ".join(made) or "nothing new")


if __name__ == "__main__":
    main()
