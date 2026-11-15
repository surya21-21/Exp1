#!/usr/bin/env python3
"""Draw a timed reel spec with the engine in headless Chromium.

  python studio/render.py build/reel.timed.json --out build/silent.mp4
  python studio/render.py build/reel.timed.json --stills build/storyboard --times 0,1.2,3.5
  python studio/render.py build/reel.timed.json --stills build/sheet --every 1.0

Every frame is asked for by time (renderAt), captured, and piped to ffmpeg, so
the video is exactly what the code draws. Also writes the sound cues and a
safe-zone audit taken from the page.
"""
import argparse
import functools
import http.server
import json
import os
import subprocess
import sys
import threading
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a, **k: None
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--out", help="silent MP4 to write")
    ap.add_argument("--stills", help="folder for PNG stills")
    ap.add_argument("--times", help="comma-separated seconds for stills")
    ap.add_argument("--every", type=float, help="a still every N seconds")
    ap.add_argument("--cues", default=None, help="write sound cues JSON here")
    ap.add_argument("--audit", default=None, help="write the safe-zone audit JSON here")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--crf", type=int, default=15)
    args = ap.parse_args()

    spec_rel = os.path.relpath(os.path.abspath(args.spec), ROOT).replace(os.sep, "/")
    srv = serve()
    url = f"http://127.0.0.1:{srv.server_address[1]}/studio/index.html?spec=/{spec_rel}"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--font-render-hinting=none", "--disable-lcd-text", "--force-color-profile=srgb"])
        page = browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(url)
        try:
            page.wait_for_function("window.READY === true || window.ERROR", timeout=60000)
        except Exception:
            sys.exit("engine did not start: " + "; ".join(errors))
        if page.evaluate("window.ERROR || ''"):
            sys.exit("engine error: " + page.evaluate("window.ERROR"))
        fps = page.evaluate("window.FPS")
        duration = page.evaluate("window.DURATION")
        info = page.evaluate("window.INFO")
        if args.cues:
            os.makedirs(os.path.dirname(args.cues) or ".", exist_ok=True)
            json.dump(page.evaluate("window.CUES"), open(args.cues, "w"), indent=1)
        clip = {"x": 0, "y": 0, "width": 1080, "height": 1920}

        if args.stills:
            os.makedirs(args.stills, exist_ok=True)
            if args.times:
                times = [float(x) for x in args.times.split(",") if x.strip()]
            else:
                step = args.every or 1.0
                times = [round(i * step, 3) for i in range(int(duration / step) + 1) if i * step < duration]
            for t in times:
                page.evaluate("t => window.renderAt(t)", t)
                page.screenshot(path=os.path.join(args.stills, f"t{t:07.3f}.png"), clip=clip)
            print(f"{len(times)} stills -> {args.stills}")

        if args.audit:
            boxes = []
            n = int(duration * 5)
            for i in range(n):
                t = i / 5
                page.evaluate("t => window.renderAt(t)", t)
                for b in page.evaluate("window.AUDIT()"):
                    boxes.append({"t": t, **b})
            json.dump({"info": info, "duration": duration, "fps": fps, "boxes": boxes}, open(args.audit, "w"))

        if args.out:
            os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
            first = int(round(args.start * fps))
            last = int(round((args.end if args.end is not None else duration) * fps))
            ff = subprocess.Popen(
                ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
                 "-c:v", "libx264", "-preset", "medium", "-crf", str(args.crf), "-pix_fmt", "yuv420p",
                 "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", args.out],
                stdin=subprocess.PIPE)
            t0 = time.time()
            for f in range(first, last):
                page.evaluate("t => window.renderAt(t)", f / fps)
                ff.stdin.write(page.screenshot(type="jpeg", quality=97, clip=clip))
                if (f - first) % 150 == 0 and f > first:
                    print(f"  frame {f - first}/{last - first}  {(f - first) / (time.time() - t0):.1f} fps", flush=True)
            ff.stdin.close()
            if ff.wait() != 0:
                sys.exit("ffmpeg failed")
            print(f"{last - first} frames in {time.time() - t0:.0f}s -> {args.out}")
        if errors:
            print("page messages:", *errors[:10], sep="\n  ", file=sys.stderr)
        browser.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
