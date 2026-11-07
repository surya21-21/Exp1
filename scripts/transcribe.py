#!/usr/bin/env python3
"""Transcribe audio with Whisper (faster-whisper, CPU) into caption files.

Writes into --out-dir:
  captions.json  - [{start, end, text}] for the Remotion scene
  captions.srt   - for YouTube upload or ffmpeg burn-in
  transcript.txt - plain text
"""
import argparse
import json
import os

from faster_whisper import WhisperModel


def srt_time(seconds):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def group_words(words, max_words=7, max_seconds=2.4, max_gap=0.6):
    """Group word timestamps into short, readable caption lines."""
    groups, current = [], []
    for w in words:
        if current:
            sentence_end = current[-1].word.strip().endswith((".", "?", "!"))
            too_many = len(current) >= max_words
            too_long = (w.end - current[0].start) > max_seconds
            big_gap = (w.start - current[-1].end) > max_gap
            if sentence_end or too_many or too_long or big_gap:
                groups.append(current)
                current = []
        current.append(w)
    if current:
        groups.append(current)
    return [
        {
            "start": round(g[0].start, 3),
            "end": round(g[-1].end, 3),
            "text": "".join(w.word for w in g).strip(),
        }
        for g in groups
    ]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--out-dir", default="build")
    ap.add_argument("--model", default="base")
    ap.add_argument("--language", default="")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        args.audio,
        language=args.language or None,
        word_timestamps=True,
        vad_filter=True,
    )

    words, lines = [], []
    for seg in segments:
        lines.append(seg.text.strip())
        words.extend(seg.words or [])

    captions = group_words(words)

    with open(os.path.join(args.out_dir, "captions.json"), "w", encoding="utf-8") as f:
        json.dump(captions, f, ensure_ascii=False, indent=2)

    with open(os.path.join(args.out_dir, "captions.srt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(captions, start=1):
            f.write(f"{i}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n\n")

    with open(os.path.join(args.out_dir, "transcript.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Language: {info.language}; {len(captions)} caption lines written to {args.out_dir}")


if __name__ == "__main__":
    main()
