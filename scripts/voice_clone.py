#!/usr/bin/env python3
"""Make the channel's voice in ElevenLabs from sample recordings (instant voice clone).

  python scripts/voice_clone.py SAMPLE_DIR --name "This is your AI guy"

Needs ELEVENLABS_API_KEY. Writes brand/voice/voice.json with the voice_id the
reels use. If ElevenLabs says the samples match a voice already in its library,
that is recorded too, so the original voice can be used instead.
"""
import argparse
import glob
import json
import os
import sys
import time
import uuid
import urllib.error
import urllib.request


def multipart(fields, files):
    b = uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        out += [f"--{b}".encode(), f'Content-Disposition: form-data; name="{k}"'.encode(), b"", str(v).encode()]
    for path in files:
        out += [f"--{b}".encode(),
                f'Content-Disposition: form-data; name="files"; filename="{os.path.basename(path)}"'.encode(),
                b"Content-Type: audio/mpeg", b"", open(path, "rb").read()]
    out += [f"--{b}--".encode(), b""]
    return b"\r\n".join(out), f"multipart/form-data; boundary={b}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("samples")
    ap.add_argument("--name", default="This is your AI guy")
    ap.add_argument("--out", default="brand/voice/voice.json")
    args = ap.parse_args()
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        sys.exit("BLOCKED: ELEVENLABS_API_KEY is not set")
    files = sorted(glob.glob(os.path.join(args.samples, "*.mp3")))
    if not files:
        sys.exit("no samples found")
    body, ctype = multipart({"name": args.name, "remove_background_noise": "false",
                             "description": "Voice of the channel 'This is your AI guy'. Cloned from the owner's samples."}, files)
    req = urllib.request.Request("https://api.elevenlabs.io/v1/voices/add", data=body,
                                 headers={"xi-api-key": key, "Content-Type": ctype})
    try:
        res = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:600]}")
    info = {"voice_id": res["voice_id"], "name": args.name, "made": time.strftime("%Y-%m-%d"),
            "method": "instant voice clone", "samples": len(files),
            "requires_verification": res.get("requires_verification"),
            "library_voice_match": res.get("library_voice_match"),
            "model": "eleven_multilingual_v2", "speed": 1.06}
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    json.dump(info, open(args.out, "w"), indent=1)
    print(json.dumps(info, indent=1))


if __name__ == "__main__":
    main()
