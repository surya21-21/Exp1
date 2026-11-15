#!/usr/bin/env python3
"""Contact sheets: from a folder of stills, or one frame every N seconds of a video.

  python scripts/reel_sheet.py --stills build/storyboard --out build/storyboard.jpg
  python scripts/reel_sheet.py --video build/final.mp4 --every 1 --out build/contact.jpg
"""
import argparse
import glob
import os
import subprocess
import tempfile

from PIL import Image, ImageDraw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills")
    ap.add_argument("--video")
    ap.add_argument("--every", type=float, default=1.0)
    ap.add_argument("--out", required=True)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--width", type=int, default=270)
    args = ap.parse_args()
    if args.video:
        tmp = tempfile.mkdtemp()
        rate = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                                        "-of", "csv=p=0", args.video], text=True).strip().split("/")
        step = max(1, round(args.every * int(rate[0]) / int(rate[1])))
        # exactly every Nth frame, so the label on each picture is its true time
        subprocess.run(["ffmpeg", "-v", "error", "-i", args.video, "-vf", f"select=not(mod(n\\,{step}))", "-vsync", "vfr",
                        os.path.join(tmp, "f%04d.png")], check=True)
        files = sorted(glob.glob(os.path.join(tmp, "*.png")))
        labels = [f"{i * args.every:.1f}s" for i in range(len(files))]
    else:
        files = sorted(glob.glob(os.path.join(args.stills, "*.png")))
        labels = [os.path.basename(f)[1:-4].lstrip("0") or "0" for f in files]
        labels = [f"{float(x):.2f}s" for x in labels]
    w, hh = args.width, int(args.width * 1920 / 1080)
    rows = -(-len(files) // args.cols)
    sheet = Image.new("RGB", (args.cols * (w + 8) - 8, rows * (hh + 30)), "white")
    draw = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        x, y = (i % args.cols) * (w + 8), (i // args.cols) * (hh + 30)
        draw.text((x + 4, y + 8), labels[i], fill="black")
        sheet.paste(Image.open(f).convert("RGB").resize((w, hh), Image.LANCZOS), (x, y + 26))
    sheet.save(args.out, quality=88)
    print(f"{len(files)} frames -> {args.out}")


if __name__ == "__main__":
    main()
