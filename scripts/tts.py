#!/usr/bin/env python3
"""Turn a script into a voiceover with ElevenLabs, plus word-timed captions.

Uses the text-to-speech "with-timestamps" endpoint, so caption timing comes
straight from ElevenLabs (no Whisper needed, and the words are exactly the
script's words).

Needs the ELEVENLABS_API_KEY environment variable.
Writes into --out-dir: voiceover.mp3, captions.json, captions.srt, transcript.txt
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128"


def srt_time(seconds):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def words_from_alignment(al):
    words, cur, start, end = [], "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"],
                        al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append({"word": cur, "start": start, "end": end})
            cur, start = "", None
            continue
        if start is None:
            start = s
        cur += ch
        end = e
    if cur:
        words.append({"word": cur, "start": start, "end": end})
    return words


def group(words, max_words=4, max_seconds=1.6):
    """Short caption chunks (reel style: 2-4 words on screen)."""
    out, cur = [], []
    for w in words:
        if cur and (len(cur) >= max_words or w["end"] - cur[0]["start"] > max_seconds
                    or cur[-1]["word"].endswith((".", "?", "!", ":"))):
            out.append(cur)
            cur = []
        cur.append(w)
    if cur:
        out.append(cur)
    return [{"start": round(g[0]["start"], 3), "end": round(g[-1]["end"], 3),
             "text": " ".join(w["word"] for w in g),
             "words": [{"text": w["word"], "start": round(w["start"], 3),
                        "end": round(w["end"], 3)} for w in g]} for g in out]


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

    text = open(args.script, encoding="utf-8").read().strip()
    # Lines starting with # are notes to yourself and are not spoken.
    text = "\n".join(l for l in text.splitlines() if not l.lstrip().startswith("#")).strip()
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

    al = res.get("normalized_alignment") or res["alignment"]
    words = words_from_alignment(al)
    captions = group(words)
    with open(os.path.join(args.out_dir, "captions.json"), "w", encoding="utf-8") as f:
        json.dump(captions, f, ensure_ascii=False, indent=2)
    with open(os.path.join(args.out_dir, "captions.srt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(captions, 1):
            f.write(f"{i}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n\n")
    with open(os.path.join(args.out_dir, "transcript.txt"), "w", encoding="utf-8") as f:
        f.write(text + "\n")

    if words:
        span = words[-1]["end"] - words[0]["start"]
        wps = len(words) / span if span else 0
        print(f"{len(words)} words in {span:.1f}s = {wps:.2f} words/sec "
              f"(style guide target 3.0-3.5; change --speed to adjust)")


if __name__ == "__main__":
    main()
