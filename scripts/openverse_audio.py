#!/usr/bin/env python3
"""Fetch music and sound effects from Openverse (https://api.openverse.org).

Reads assets/audio.json, searches Openverse audio with the licences listed
there (default CC0 / public domain, so no credit is needed), downloads the
first usable result for each query and prepares it:
  sound effects -> build/audio/sfx/<name>.wav  (mono 44.1kHz, trimmed, max 1.4s)
  music         -> build/audio/music/track.mp3
Writes build/audio/CREDITS.txt (title, creator, licence, link for every file).
Anything that fails falls back to the code-generated sound, so a render
never breaks because of a search.
"""
import argparse
import json
import os
import subprocess
import urllib.parse
import urllib.request

API = "https://api.openverse.org/v1/audio/"
UA = {"User-Agent": "Exp1-reel-pipeline/1.0 (GitHub Actions)"}
EXTS = {"mp3", "wav", "ogg", "flac", "m4a", "aac", "oga"}


def search(q, category, licenses, page_size=20):
    params = {"q": q, "license": licenses, "page_size": page_size}
    if category:
        params["category"] = category
    url = API + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r).get("results", [])


def download(url, path):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        data = r.read()
    if len(data) < 2000:
        raise ValueError("file too small")
    with open(path, "wb") as f:
        f.write(data)


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def score(r, query):
    """2 = query word in the title, 1 = in the tags, 0 = neither."""
    words = [w for w in query.lower().split() if len(w) > 2]
    if not words:
        return 1
    stem = words[0][:5]
    title = (r.get("title") or "").lower()
    tags = " ".join((t.get("name") or "").lower() for t in (r.get("tags") or []) if isinstance(t, dict))
    if words[0] in title or stem in title:
        return 2
    return 1 if (words[0] in tags or stem in tags) else 0


def ext_of(r):
    ft = (r.get("filetype") or "").lower()
    if ft:
        return ft
    path = urllib.parse.urlparse(r.get("url") or "").path
    return path.rsplit(".", 1)[-1].lower() if "." in path.rsplit("/", 1)[-1] else ""


def pick(results, min_ms=None, max_ms=None, query=None):
    # Best matches first (title beats tags), then the rest in API order.
    if query:
        results = sorted(results, key=lambda r: -score(r, query))
    for r in results:
        if not r.get("url"):
            continue
        ext = ext_of(r)
        if ext and ext not in EXTS:      # unknown type: let ffmpeg try it
            continue
        d = r.get("duration")
        if d and min_ms and d < min_ms:
            continue
        if d and max_ms and d > max_ms:
            continue
        yield r


def credit(name, r):
    lic = f"{(r.get('license') or '').upper()} {r.get('license_version') or ''}".strip()
    return (f"{name}: \"{r.get('title') or 'untitled'}\" by {r.get('creator') or 'unknown'} "
            f"({lic}) {r.get('foreign_landing_url') or r.get('url')}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="assets/audio.json")
    ap.add_argument("--out", default="build/audio")
    args = ap.parse_args()
    cfg = json.load(open(args.config))
    lic = cfg.get("licenses", "cc0,pdm")
    os.makedirs(f"{args.out}/sfx", exist_ok=True)
    os.makedirs(f"{args.out}/music", exist_ok=True)
    tmp = f"{args.out}/tmp"
    os.makedirs(tmp, exist_ok=True)
    credits = []

    for name, q in cfg.get("sfx", {}).items():
        try:
            res = search(q, "sound_effect", lic) or search(q, None, lic)
            for r in pick(res, max_ms=8000, query=q):
                raw = f"{tmp}/{name}.src"
                try:
                    download(r["url"], raw)
                    keep = 1.4 if name == "riser" else 0.9
                    ffmpeg("-i", raw, "-ac", "1", "-ar", "44100", "-af",
                           "silenceremove=start_periods=1:start_threshold=-45dB,"
                           f"atrim=0:{keep},afade=t=out:st={keep - 0.08}:d=0.08,"
                           "dynaudnorm=p=0.9:m=5", "-sample_fmt", "s16",
                           f"{args.out}/sfx/{name}.wav")
                    credits.append(credit(f"sfx/{name}", r))
                    print(f"sfx {name}: {r.get('title')} [{r.get('license')}]")
                    break
                except Exception as e:
                    print(f"  skip {r.get('title')}: {e}")
            else:
                print(f"::warning::No usable Openverse result for sfx '{name}' - using the generated sound.")
        except Exception as e:
            print(f"::warning::Openverse search failed for sfx '{name}': {e} - using the generated sound.")

    m = cfg.get("music")
    own_music = os.path.isdir("assets/music") and any(
        f.rsplit(".", 1)[-1].lower() in EXTS for f in os.listdir("assets/music"))
    if m and not own_music:
        queries = [m["query"]] + list(m.get("fallback_queries", []))
        tries = [(lic, False)]
        if m.get("fallback_licenses"):
            tries.append((m["fallback_licenses"], True))
        done = False
        for lic_try, needs_credit in tries:
            for q in queries:
                try:
                    res = search(q, "music", lic_try) or search(q, None, lic_try)
                except Exception as e:
                    print(f"  music search '{q}' failed: {e}")
                    continue
                print(f"  music '{q}' ({lic_try}): {len(res)} results")
                for r in pick(res, min_ms=int(m.get("min_seconds", 30)) * 1000, query=q):
                    raw = f"{tmp}/music.src"
                    try:
                        download(r["url"], raw)
                        ffmpeg("-i", raw, "-ac", "2", "-ar", "44100", "-b:a", "192k",
                               f"{args.out}/music/track.mp3")
                        line = credit("music", r)
                        if needs_credit:
                            line += "  <- CREDIT REQUIRED: put this line in your post caption"
                            print("::warning::Music needs a credit in your caption - see CREDITS.txt")
                        credits.append(line)
                        print(f"music ('{q}'): {r.get('title')} [{r.get('license')}]")
                        done = True
                        break
                    except Exception as e:
                        print(f"  skip {r.get('title')}: {e}")
                if done:
                    break
            if done:
                break
        if not done:
            print("::warning::No usable Openverse music - the reel will have no music. "
                  "Add a track to assets/music/ or change the queries in assets/audio.json.")
    elif own_music:
        print("Using your own track from assets/music - no music search.")

    with open(f"{args.out}/CREDITS.txt", "w", encoding="utf-8") as f:
        f.write("Audio from Openverse (api.openverse.org). Licences as listed.\n")
        f.write("\n".join(credits) + "\n")
    for x in os.listdir(tmp):
        os.remove(os.path.join(tmp, x))
    os.rmdir(tmp)


if __name__ == "__main__":
    main()
