"""Read a reel script with section markers.

Format (assets/script.txt):

    # lines starting with # are notes and are never spoken
    [[hook]]
    These 9 free GitHub repos replaced *$120 a month* of my subscriptions.
    [[repo remotion-dev/remotion | replaces=After Effects | price=22.99]]
    Number one, *Remotion*. It turns code into video.
    [[text]]
    But here's what I got wrong at first...
    [[cta REPO]]
    Comment REPO and I'll send you all 9 links.

Wrap a word or phrase in *asterisks* to make it a keyword: it pops and
turns the accent colour in the captions. Asterisks are never spoken.
"""
import re

MARKER = re.compile(r"^\s*\[\[\s*(\w+)\s*(.*?)\s*\]\]\s*$")


def parse(path):
    sections, cur = [], None
    for line in open(path, encoding="utf-8").read().splitlines():
        if line.lstrip().startswith("#"):
            continue
        m = MARKER.match(line)
        if m:
            kind, rest = m.group(1).lower(), m.group(2)
            parts = [p.strip() for p in rest.split("|")] if rest else []
            arg = parts[0] if parts and "=" not in parts[0] else ""
            opts = {}
            for p in parts:
                if "=" in p:
                    k, v = p.split("=", 1)
                    opts[k.strip().lower()] = v.strip()
            cur = {"type": kind, "arg": arg, "opts": opts, "tokens": []}
            sections.append(cur)
            continue
        if not line.strip():
            continue
        if cur is None:
            cur = {"type": "text", "arg": "", "opts": {}, "tokens": []}
            sections.append(cur)
        in_key = False
        for raw in line.split():
            starts, ends = raw.startswith("*"), raw.rstrip(".,!?:;\"'").endswith("*")
            if starts:
                in_key = True
            text = raw.replace("*", "")
            if text:
                cur["tokens"].append({"text": text, "key": in_key})
            if ends:
                in_key = False
    return [s for s in sections if s["tokens"]]


def spoken_text(sections):
    return "\n".join(" ".join(t["text"] for t in s["tokens"]) for s in sections)
