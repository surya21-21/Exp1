#!/usr/bin/env python3
"""Turn a script into a voiceover with ElevenLabs, with per-word timings.

Uses the text-to-speech "with-timestamps" endpoint, so word timing comes
straight from ElevenLabs. Section markers ([[repo ...]]), # notes and
*keyword* asterisks are removed before speaking (see scriptfmt.py).

Needs the ELEVENLABS_API_KEY environment variable.
Writes into --out-dir: voiceover.mp3, words.json, transcript.txt
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

from scriptfmt import parse, spoken_text

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128"


def words_from_alignment(al):
    words, cur, start, end = [], "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"],
                        al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append({"word": cur, "start": round(start, 3), "end": round(end, 3)})
            cur, start = "", None
            continue
        if start is None:
            start = s
        cur += ch
        end = e
    if cur:
        words.append({"word": cur, "start": round(start, 3), "end": round(end, 3)})
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--voice", default="JBFqnCBsd6RMkjVDRZzb")
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--speed", type=float, default=1.05)
    ap.add_argument("--out-dir", default="build")
    args = ap.parse_args()

    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set")

    text = spoken_text(parse(args.script))
    if not text:
        sys.exit(f"{args.script} has no text to speak")

    body = json.dumps({
        "text": text,
        "model_id": args.model,
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8,
                           "style": 0.2, "speed": args.speed},
    }).encode()
    req = urllib.request.Request(API.format(voice=args.voice), data=body, headers={
        "xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:500]}")

    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, "voiceover.mp3"), "wb") as f:
        f.write(base64.b64decode(res["audio_base64"]))

    # "alignment" follows the text exactly as sent, so words line up with the script.
    al = res.get("alignment") or res["normalized_alignment"]
    words = words_from_alignment(al)
    with open(os.path.join(args.out_dir, "words.json"), "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=1)
    with open(os.path.join(args.out_dir, "transcript.txt"), "w", encoding="utf-8") as f:
        f.write(text + "\n")

    if words:
        span = words[-1]["end"] - words[0]["start"]
        wps = len(words) / span if span else 0
        print(f"{len(words)} words in {span:.1f}s = {wps:.2f} words/sec "
              f"(style guide target 3.0-3.5; change --speed to adjust)")


if __name__ == "__main__":
    main()
