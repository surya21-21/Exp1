#!/usr/bin/env python3
"""Build the reel timeline from the script and the voice timings.

- Matches every script word to a spoken word (ElevenLabs timings are exact;
  Whisper timings are matched with difflib, and the captions keep the
  script's spelling).
- Times each [[section]] from its first word.
- Fetches name, description, stars, forks, language and open issues for
  every [[repo owner/name]] from the GitHub API.
- Writes build/extra_props.json (sections + word captions for Remotion) and
  build/sfx_cues.json (sound-effect hits, from src/beats.json).
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import urllib.request

from scriptfmt import parse

SILENT_WPS = 3.2      # words/sec used to time a silent draft render


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def audio_duration(path):
    if not path or not os.path.isfile(path):
        return None
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "default=nw=1:nk=1", path], text=True)
    return float(out.strip())


def time_tokens(tokens, words):
    """Give every script token a start/end from the spoken words."""
    if not words:
        t = 0.3
        for tok in tokens:
            tok["start"], tok["end"] = round(t, 3), round(t + 1 / SILENT_WPS * 0.9, 3)
            t += 1 / SILENT_WPS + (0.25 if tok["text"].endswith((".", "?", "!")) else 0)
        return
    a = [norm(t["text"]) for t in tokens]
    b = [norm(w["word"]) for w in words]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            w = words[blk.b + k]
            tokens[blk.a + k]["start"], tokens[blk.a + k]["end"] = w["start"], w["end"]
    # Fill unmatched tokens by spreading them between their timed neighbours.
    n, i = len(tokens), 0
    while i < n:
        if "start" in tokens[i]:
            i += 1
            continue
        j = i
        while j < n and "start" not in tokens[j]:
            j += 1
        left = tokens[i - 1]["end"] if i > 0 else words[0]["start"]
        right = tokens[j]["start"] if j < n else max(left + 0.3 * (j - i), words[-1]["end"])
        step = (right - left) / (j - i + 1)
        for k in range(i, j):
            s = left + step * (k - i + 1) - step / 2
            tokens[k]["start"], tokens[k]["end"] = round(s, 3), round(s + step * 0.9, 3)
        i = j


def fetch_repo(full):
    info = {"full": full, "owner": full.split("/")[0], "name": full.split("/")[-1],
            "description": "", "stars": None, "forks": None, "language": None, "openIssues": None}
    req = urllib.request.Request(f"https://api.github.com/repos/{full}",
                                 headers={"Accept": "application/vnd.github+json",
                                          "User-Agent": "exp1-reel-pipeline"})
    tok = os.environ.get("GITHUB_TOKEN")
    if tok:
        req.add_header("Authorization", f"Bearer {tok}")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.load(r)
        info.update({"owner": d["owner"]["login"], "name": d["name"],
                     "description": d.get("description") or "",
                     "stars": d.get("stargazers_count"), "forks": d.get("forks_count"),
                     "language": d.get("language"), "openIssues": d.get("open_issues_count")})
    except Exception as e:   # keep rendering even if GitHub is unreachable
        print(f"warning: could not fetch {full}: {e}")
    return info


def price(v):
    try:
        return round(float(re.sub(r"[^\d.]", "", v)), 2)
    except (TypeError, ValueError):
        return None


def caption_lines(tokens, max_words=4, max_gap=0.45):
    lines, cur = [], []
    for t in tokens:
        if cur and (len(cur) >= max_words or t["section"] != cur[-1]["section"]
                    or t["start"] - cur[-1]["end"] > max_gap
                    or cur[-1]["text"].endswith((".", "?", "!", ":", ","))):
            lines.append(cur)
            cur = []
        cur.append(t)
    if cur:
        lines.append(cur)
    return [{"start": l[0]["start"], "end": l[-1]["end"],
             "text": " ".join(t["text"] for t in l),
             "words": [{"text": t["text"], "start": t["start"], "end": t["end"], "key": t["key"]}
                       for t in l]} for l in lines]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--words", default="build/words.json")
    ap.add_argument("--audio", default="build/voiceover.mp3")
    ap.add_argument("--beats", default="src/beats.json")
    ap.add_argument("--out", default="build/extra_props.json")
    ap.add_argument("--cues", default="build/sfx_cues.json")
    args = ap.parse_args()

    sections = parse(args.script)
    beats = json.load(open(args.beats))
    words = json.load(open(args.words)) if os.path.isfile(args.words) else []

    tokens = []
    for si, s in enumerate(sections):
        for t in s["tokens"]:
            tokens.append({**t, "section": si})
    time_tokens(tokens, words)

    dur = audio_duration(args.audio)
    last_end = tokens[-1]["end"] if tokens else 1.0
    end_all = round(max(dur or 0, last_end) + 0.8, 3)

    firsts = {}
    for t in tokens:
        firsts.setdefault(t["section"], t["start"])
    out_sections, repo_no, monthly = [], 0, 0.0
    for si, s in enumerate(sections):
        start = 0.0 if si == 0 else max(0.0, firsts[si] - 0.15)
        nxt = (max(0.0, firsts[si + 1] - 0.15) if si + 1 < len(sections) else end_all)
        sec = {"type": s["type"] if s["type"] in beats else "text", "start": round(start, 3),
               "end": round(nxt, 3), "text": " ".join(t["text"] for t in s["tokens"]),
               "keywords": [t["text"] for t in s["tokens"] if t["key"]], "arg": s["arg"]}
        if sec["type"] == "repo" and s["arg"]:
            repo_no += 1
            info = fetch_repo(s["arg"])
            info.update({"index": repo_no, "replaces": s["opts"].get("replaces", ""),
                         "price": price(s["opts"].get("price"))})
            monthly += info["price"] or 0
            sec["repo"] = info
        out_sections.append(sec)

    cues = []
    for sec in out_sections:
        speed = 1.0
        if sec["type"] == "repo":   # same formula as repoSpeed() in src/reel/time.ts
            speed = max(1.0, (beats["repo"]["strike"] + 0.5) / max(0.5, sec["end"] - sec["start"] - 0.3))
        for at, sfx, gain in beats[sec["type"]]["cues"]:
            t = sec["start"] + at / speed
            if t < sec["end"]:
                cues.append({"t": round(t, 3), "sfx": sfx, "gain": gain})
        if sec["type"] == "hook":   # counter ticks while the hook counter runs
            k = 0.1
            while k < beats["hook"]["counterEnd"]:
                cues.append({"t": round(sec["start"] + k, 3), "sfx": "tick", "gain": 0.35})
                k += 0.1
    cues.sort(key=lambda c: c["t"])

    cta = next((s for s in out_sections if s["type"] == "cta"), None)
    extra = {
        "sections": out_sections,
        "captions": caption_lines(tokens),
        "totalMonthly": round(monthly, 2),
        "repoCount": repo_no,
        "ctaKeyword": (cta["arg"] if cta and cta["arg"] else "LINK"),
        "durationSeconds": end_all,
    }
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    json.dump(extra, open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(cues, open(args.cues, "w"), indent=1)

    def srt(x):
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"
    with open(os.path.join(os.path.dirname(args.out) or ".", "captions.srt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(extra["captions"], 1):
            f.write(f"{i}\n{srt(c['start'])} --> {srt(c['end'])}\n{c['text']}\n\n")
    print(f"{len(out_sections)} sections, {repo_no} repos (${monthly:.2f}/mo), "
          f"{len(tokens)} words, {len(cues)} sound cues, {end_all:.1f}s")


if __name__ == "__main__":
    main()
