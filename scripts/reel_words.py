#!/usr/bin/env python3
"""Word timings for a voiceover you recorded yourself (Whisper, on the runner).

  python scripts/reel_words.py reels/<name>/voiceover.mp3 --out build/words.json
"""
import argparse
import json

from faster_whisper import WhisperModel


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--out", default="build/words.json")
    ap.add_argument("--model", default="small")
    args = ap.parse_args()
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(args.audio, word_timestamps=True, vad_filter=True)
    words = [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
             for s in segments for w in s.words if w.word.strip()]
    json.dump(words, open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(words)} words timed")


if __name__ == "__main__":
    main()
