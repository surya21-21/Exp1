#!/usr/bin/env python3
"""Bring a freshly made voiceover to the channel's pace, without spending credits.

  python scripts/voice_pace.py build/voiceover.mp3 build/words.json      (target from brand/voice/voice.json)

ElevenLabs' speed setting stops at 1.2x, which is not enough for every voice to
reach 3-point-something words a second. This runs once, right after a new voice
is made (never on a saved one):

  1. Pauses between words longer than --max-gap are shortened to --max-gap
     (cut in the middle of the silence, so no word is touched).
  2. If the pace is still under --target, the whole take is sped up with
     ffmpeg's atempo (pitch kept), at most --max-tempo.

The word timings in words.json are moved by exactly the same amounts, so the
captions and the scene beats stay on the words. Both files are rewritten in
place. Prints the pace before and after.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile


def pace(words):
    span = words[-1]["end"] - words[0]["start"]
    return len(words) / span if span > 0 else 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("voice")
    ap.add_argument("words")
    ap.add_argument("--target", type=float, default=None, help="words a second to reach (default: brand/voice/voice.json)")
    ap.add_argument("--max-gap", type=float, default=0.22, help="longest pause kept between words, seconds")
    ap.add_argument("--max-tempo", type=float, default=None, help="largest speed-up after the pauses are shortened (default: voice.json, else 1.15)")
    args = ap.parse_args()
    brand = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "brand", "voice", "voice.json")
    b = json.load(open(brand, encoding="utf-8")) if os.path.isfile(brand) else {}
    if args.target is None:
        args.target = b.get("target_words_per_second")
    if args.max_tempo is None:
        args.max_tempo = b.get("max_tempo", 1.15)
    if not args.target:
        print("voice pace: no target_words_per_second in brand/voice/voice.json; voice left as it is")
        return

    words = json.load(open(args.words, encoding="utf-8"))
    if len(words) < 2:
        sys.exit("voice_pace: fewer than two words, nothing to do")
    before = pace(words)

    # 1. Keep intervals: everything except the middle of each long pause.
    half = args.max_gap / 2
    cuts = []                                   # (start, end) of audio removed
    for a, b in zip(words, words[1:]):
        gap = b["start"] - a["end"]
        if gap > args.max_gap:
            cuts.append((a["end"] + half, b["start"] - half))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                         "-of", "csv=p=0", args.voice]).decode().strip().rstrip(","))
    keep, t = [], 0.0
    for s, e in cuts:
        keep.append((t, s)); t = e
    keep.append((t, dur))

    def moved(x):                               # a time in the old take -> the shortened take
        return x - sum(min(e, x) - s for s, e in cuts if x > s)

    new_words = [{**w, "start": round(moved(w["start"]), 3), "end": round(moved(w["end"]), 3)} for w in words]
    mid = pace(new_words)
    tempo = 1.0
    if mid < args.target:
        tempo = min(args.max_tempo, args.target / mid)
    if tempo > 1.0:
        new_words = [{**w, "start": round(w["start"] / tempo, 3), "end": round(w["end"] / tempo, 3)} for w in new_words]

    # 2. One ffmpeg pass: cut, join, speed up.
    parts = "".join(f"[0:a]atrim={s:.4f}:{e:.4f},asetpts=PTS-STARTPTS[p{i}];" for i, (s, e) in enumerate(keep))
    chain = f"{parts}{''.join(f'[p{i}]' for i in range(len(keep)))}concat=n={len(keep)}:v=0:a=1[j];"
    chain += f"[j]atempo={tempo:.4f}[out]" if tempo > 1.0 else "[j]anull[out]"
    fd, tmp = tempfile.mkstemp(suffix=".mp3", dir=os.path.dirname(os.path.abspath(args.voice)))
    os.close(fd)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", args.voice, "-filter_complex", chain, "-map", "[out]",
                    "-c:a", "libmp3lame", "-b:a", "192k", tmp], check=True)
    os.replace(tmp, args.voice)
    json.dump(new_words, open(args.words, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    after = pace(new_words)
    print(f"voice pace: {before:.2f} -> {after:.2f} words a second "
          f"({len(cuts)} pauses shortened to {args.max_gap:.2f} s, tempo x{tempo:.3f}; target {args.target:.2f})")
    if after < args.target - 0.05:
        print(f"voice pace: still under the target. Raise the speed in brand/voice/voice.json (ElevenLabs allows up to 1.2) "
              f"or allow more tempo with --max-tempo.")


if __name__ == "__main__":
    main()
