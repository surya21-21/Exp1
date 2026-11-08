#!/usr/bin/env python3
"""Put the final soundtrack on the silent render.

Layers (each optional): voice, synthesized SFX track, and the first music
file found in assets/music/. Music loops to fit, dips under the voice
(sidechain ducking) and fades out at the end. Mixed to -14 LUFS, the usual
loudness for Reels, Shorts and TikTok.
"""
import argparse
import glob
import os
import subprocess


def duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "default=nw=1:nk=1", path], text=True)
    return float(out.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--voice", default="build/voiceover.mp3")
    ap.add_argument("--sfx", default="build/sfx_track.wav")
    ap.add_argument("--music-dir", default="assets/music")
    ap.add_argument("--music-volume", type=float, default=0.22)
    args = ap.parse_args()

    dur = duration(args.video)
    voice = args.voice if os.path.isfile(args.voice) else None
    sfx = args.sfx if os.path.isfile(args.sfx) else None
    music = None
    for d in (args.music_dir, "build/audio/music"):   # your own track first, then Openverse
        found = sorted(f for f in glob.glob(os.path.join(d, "*"))
                       if f.lower().endswith((".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac")))
        if found:
            music = found[0]
            break

    cmd, filters, mix = ["ffmpeg", "-y", "-i", args.video], [], []
    idx = 1
    if voice:
        cmd += ["-i", voice]
        if music:
            filters.append(f"[{idx}:a]aformat=channel_layouts=stereo,asplit=2[v][vside]")
        else:
            filters.append(f"[{idx}:a]aformat=channel_layouts=stereo[v]")
        mix.append("[v]")
        idx += 1
    if sfx:
        cmd += ["-i", sfx]
        filters.append(f"[{idx}:a]aformat=channel_layouts=stereo,volume=0.7[s]")
        mix.append("[s]")
        idx += 1
    if music:
        cmd += ["-stream_loop", "-1", "-i", music]
        fade = max(0.0, dur - 1.5)
        chain = (f"[{idx}:a]aformat=channel_layouts=stereo,atrim=0:{dur:.3f},"
                 f"volume={args.music_volume},afade=t=out:st={fade:.3f}:d=1.5")
        if voice:
            filters.append(chain + "[mraw]")
            filters.append("[mraw][vside]sidechaincompress=threshold=0.02:ratio=6:"
                           "attack=15:release=350[m]")
        else:
            filters.append(chain + "[m]")
        mix.append("[m]")
        print(f"music: {music}")

    if not mix:
        cmd += ["-c", "copy", args.out]
    else:
        filters.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=longest,"
                       f"atrim=0:{dur:.3f},loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
        cmd += ["-filter_complex", ";".join(filters), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", args.out]
    print("layers:", ", ".join(x for x, y in (("voice", voice), ("sfx", sfx), ("music", music)) if y)
          or "none (silent)")
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
