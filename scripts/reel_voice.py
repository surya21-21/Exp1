#!/usr/bin/env python3
"""Speak a reel's lines with ElevenLabs and save the word timings.

Sends exactly the words of reels/<name>/reel.json (asterisks removed), so the
timings line up one to one with the script. Needs ELEVENLABS_API_KEY. Without
it this prints a BLOCKED line and writes nothing; the reel then becomes a
silent draft with estimated timing.

Writes into --out-dir: voiceover.mp3, words.json
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_reel import spoken_text  # noqa: E402
from tts import API, words_from_alignment  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("--out-dir", default="build")
    args = ap.parse_args()
    reel = json.load(open(args.reel, encoding="utf-8"))
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        print("BLOCKED: ELEVENLABS_API_KEY is not set, so no voice was made. The reel will be a silent draft with estimated timing.")
        return
    voice = dict(reel.get("voice", {}))
    brand = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "brand", "voice", "voice.json")
    if "id" not in voice and os.path.isfile(brand):          # the channel's own voice
        b = json.load(open(brand))
        voice = {"id": b["voice_id"], "model": b.get("model"), "speed": b.get("speed"), **voice}
    voice = {k: v for k, v in voice.items() if v is not None}
    body = json.dumps({
        "text": spoken_text(reel),
        "model_id": voice.get("model", "eleven_multilingual_v2"),
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.2, "speed": float(voice.get("speed", 1.08))},
    }).encode()
    req = urllib.request.Request(API.format(voice=voice.get("id", "JBFqnCBsd6RMkjVDRZzb")), data=body, headers={
        "xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:500]}")
    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, "voiceover.mp3"), "wb") as f:
        f.write(base64.b64decode(res["audio_base64"]))
    words = words_from_alignment(res.get("alignment") or res["normalized_alignment"])
    json.dump(words, open(os.path.join(args.out_dir, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if words:
        span = words[-1]["end"] - words[0]["start"]
        print(f"voice {voice.get('id')}: {len(words)} words in {span:.1f}s = {len(words) / span:.2f} words a second")


if __name__ == "__main__":
    main()
