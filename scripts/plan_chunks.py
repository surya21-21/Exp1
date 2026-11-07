#!/usr/bin/env python3
"""Build build/props.json for Remotion and split the video into frame chunks.

Reads props.base.json (title, subtitle, accent, optional durationSeconds),
adds size, fps, captions and the exact frame count, then writes a GitHub
Actions matrix so each chunk can render in its own parallel job.
"""
import argparse
import json
import math
import os
import subprocess


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="props.base.json")
    ap.add_argument("--audio", default="")
    ap.add_argument("--captions", default="build/captions.json")
    ap.add_argument("--size", default="1280x720")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--chunks", type=int, default=1)
    ap.add_argument("--out", default="build/props.json")
    args = ap.parse_args()

    props = {}
    if os.path.exists(args.base):
        with open(args.base, encoding="utf-8") as f:
            props = json.load(f)

    width, height = (int(v) for v in args.size.split("x"))
    duration = float(props.pop("durationSeconds", 20))

    if args.audio and os.path.isfile(args.audio):
        out = subprocess.check_output(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=nw=1:nk=1",
                args.audio,
            ],
            text=True,
        )
        duration = float(out.strip()) + 0.5  # half a second of tail

    captions = props.get("captions", [])
    if os.path.exists(args.captions):
        with open(args.captions, encoding="utf-8") as f:
            captions = json.load(f)

    total = max(1, int(math.floor(duration * args.fps + 0.5)))
    props.update(
        {
            "captions": captions,
            "durationInFrames": total,
            "fps": args.fps,
            "width": width,
            "height": height,
        }
    )

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)

    chunks = max(1, min(args.chunks, 9, total))
    size = math.ceil(total / chunks)
    include = []
    for i in range(chunks):
        start = i * size
        end = min(total - 1, start + size - 1)
        if start > end:
            break
        include.append({"idx": i, "range": f"{start}-{end}"})

    matrix = json.dumps({"include": include})
    print(f"{total} frames ({duration:.1f}s at {args.fps}fps), {len(include)} chunk(s): {matrix}")

    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"matrix={matrix}\n")


if __name__ == "__main__":
    main()
