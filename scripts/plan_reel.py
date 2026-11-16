#!/usr/bin/env python3
"""Turn a reel file into a timed spec the engine can draw.

Input: reels/<name>/reel.json. Each scene has a type, its props and "say": the
line spoken over it. *Asterisks* mark keywords: they are highlighted in the
captions and each one becomes a beat the scene's animation lands on.

Timing comes from the voice when there is one (--words: a list of
{word, start, end} from ElevenLabs or Whisper). Without a voice the timing is
estimated from the word count, and the spec is marked voice: false.

Output: a timed spec with scene start/end, beats, and captions in groups of
2 to 4 words. Standard library only.
"""
import argparse
import hashlib
import json
import re
import sys

KW = re.compile(r"\*([^*]+)\*")


def tokens(say):
    """Words of a line with a keyword flag and a 'starts a keyword phrase' flag."""
    out, pos = [], 0
    for m in KW.finditer(say):
        for w in say[pos:m.start()].split():
            out.append({"w": w, "kw": False, "beat": False})
        inner = m.group(1).split()
        for i, w in enumerate(inner):
            out.append({"w": w, "kw": True, "beat": i == 0})
        pos = m.end()
    for w in say[pos:].split():
        out.append({"w": w, "kw": False, "beat": False})
    # punctuation typed right after the closing asterisk belongs to the last keyword word
    merged = []
    for t in out:
        if merged and re.fullmatch(r"[.,!?;:]+", t["w"]):
            merged[-1]["w"] += t["w"]
        else:
            merged.append(t)
    return merged


def spoken_text(reel):
    return " ".join(" ".join(t["w"] for t in tokens(s.get("say", ""))) for s in reel["scenes"]).strip()


def estimate(scenes_tokens, wps, scenes):
    """No voice: place words at `wps` words a second, longer words a little longer."""
    t, timed = 0.0, []
    for toks, sc in zip(scenes_tokens, scenes):
        start = t
        rows = []
        for tok in toks:
            d = (0.6 + 0.4 * min(len(tok["w"]), 12) / 5.0) / wps
            rows.append({**tok, "s": round(t, 3), "e": round(t + d * 0.92, 3)})
            t += d
            if tok["w"][-1:] in ".?!":
                t += 0.16
            elif tok["w"][-1:] in ",;:":
                t += 0.06
        t = max(t + float(sc.get("hold", 0.1)), start + float(sc.get("min", 0)))
        timed.append(rows)
    return timed


def from_voice(scenes_tokens, words):
    """Voice timings: one-to-one when the counts match, otherwise spread in proportion."""
    flat = [tok for toks in scenes_tokens for tok in toks]
    n, m = len(flat), len(words)
    exact = n == m
    timed, k = [], 0
    for toks in scenes_tokens:
        rows = []
        for tok in toks:
            j = k if exact else min(m - 1, round(k * (m - 1) / max(1, n - 1)))
            w = words[j]
            rows.append({**tok, "s": round(float(w["start"]), 3), "e": round(float(w["end"]), 3)})
            k += 1
        timed.append(rows)
    return timed, exact


def group(rows, max_words=4, max_gap=0.35):
    """Caption groups of 2 to 4 words. Sentences and long pauses always break; inside a
    sentence the words are shared out evenly, preferring to break after a comma."""
    sentences, cur = [], []
    for w in rows:
        if cur and (cur[-1]["w"][-1:] in ".?!" or w["s"] - cur[-1]["e"] > max_gap):
            sentences.append(cur)
            cur = []
        cur.append(w)
    if cur:
        sentences.append(cur)
    out = []
    for sent in sentences:
        n = len(sent)
        k = -(-n // max_words)                      # groups needed
        base, extra = divmod(n, k)
        sizes = [base + (1 if i < extra else 0) for i in range(k)]
        # nudge a boundary by one word when that lands it right after a comma
        cuts, pos = [], 0
        for size in sizes[:-1]:
            pos += size
            for cand in (pos, pos - 1, pos + 1):
                prev = cuts[-1] if cuts else 0
                if 2 <= cand - prev <= max_words and n - cand >= 2 and sent[cand - 1]["w"][-1:] in ",;:":
                    pos = cand
                    break
            cuts.append(pos)
        prev = 0
        for c in cuts + [n]:
            out.append(sent[prev:c])
            prev = c
    return [{"s": g[0]["s"], "e": g[-1]["e"],
             "words": [{"w": w["w"], "s": w["s"], "e": w["e"], "kw": w["kw"]} for w in g]} for g in out if g]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("--words", help="words.json from the voice (optional)")
    ap.add_argument("--out", default="build/reel.timed.json")
    ap.add_argument("--print-text", action="store_true", help="print the spoken text and exit")
    ap.add_argument("--approve", action="store_true", help="record the owner's approval of this exact script (run only after they said yes)")
    ap.add_argument("--check-approval", action="store_true", help="exit 1 unless the script is the one the owner approved")
    ap.add_argument("--table", help="also write a timing table (Markdown) here")
    args = ap.parse_args()

    reel = json.load(open(args.reel, encoding="utf-8"))
    sha = hashlib.sha1(spoken_text(reel).encode("utf-8")).hexdigest()
    if args.approve:
        import datetime
        reel["approved"] = {"date": datetime.date.today().isoformat(), "say_sha1": sha}
        json.dump(reel, open(args.reel, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"approval recorded for script {sha[:10]}")
        return
    if args.check_approval:
        ap_ = reel.get("approved")
        if ap_ == "fixture" or (isinstance(ap_, dict) and ap_.get("say_sha1") == sha):
            print("script approved")
            return
        sys.exit("BLOCKED: this script is not the one the owner approved. Show them the storyboard and animatic, "
                 "then record their yes with: python scripts/plan_reel.py REEL --approve")
    if args.print_text:
        print(spoken_text(reel))
        return
    scenes = reel["scenes"]
    toks = [tokens(s.get("say", "")) for s in scenes]
    words, voice, exact = None, False, True
    if args.words:
        try:
            words = json.load(open(args.words, encoding="utf-8"))
        except FileNotFoundError:
            words = None
    if words:
        timed, exact = from_voice(toks, words)
        voice = True
    else:
        timed = estimate(toks, float(reel.get("wps", 3.4)), scenes)

    fps = int(reel.get("fps", 30))
    lead = 0.1                                   # the picture changes just before the words; starts sit on frame boundaries
    starts = []
    for i, rows in enumerate(timed):
        if i == 0:
            starts.append(0.0)
        elif rows:
            starts.append(round(max(starts[-1] + 0.3, rows[0]["s"] - lead) * fps) / fps)
        else:
            starts.append(starts[-1] + float(scenes[i - 1].get("min", 1.0)))
    last_rows = [r for r in timed if r]
    end_of_speech = last_rows[-1][-1]["e"] if last_rows else 0.0
    last = scenes[-1]
    duration = max(end_of_speech + float(last.get("hold", 0.8)), starts[-1] + float(last.get("min", 0)))
    duration = round(round(duration * fps) / fps, 4)

    out_scenes, captions = [], []
    for i, (sc, rows) in enumerate(zip(scenes, timed)):
        start = round(starts[i], 3)
        end = round(starts[i + 1], 3) if i + 1 < len(scenes) else duration
        item = {"type": sc["type"], "props": sc.get("props", {}), "start": start, "end": end,
                "beats": [round(r["s"] - start, 3) for r in rows if r["beat"]]}
        for key in ("in", "at"):
            if key in sc:
                item[key] = sc[key]
        out_scenes.append(item)
        captions += group(rows)

    spec = {"title": reel.get("title", ""), "accent": reel.get("accent", "#c2381d"), "fps": fps,
            "duration": duration, "voice": voice, "voiceExactMatch": exact,
            "keyword": reel.get("keyword", ""), "scenes": out_scenes, "captions": captions}
    for key in ("layers", "options"):               # whole-reel layers from studio/packs, and their settings
        if key in reel:
            spec[key] = reel[key]
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=1)
    n = sum(len(r) for r in timed)
    span = end_of_speech or 1
    if args.table:
        with open(args.table, "w", encoding="utf-8") as f:
            f.write("| # | Scene | In | Start | Length | Words | Words a second | Beats |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n")
            for i, (sc, rows) in enumerate(zip(out_scenes, timed)):
                d = sc["end"] - sc["start"]
                f.write(f'| {i + 1} | {sc["type"]} | {sc.get("in", "cut" if i else "-")} | {sc["start"]:.2f} s | {d:.2f} s | {len(rows)} | '
                        f'{len(rows) / d:.2f} | {", ".join(f"{b:.2f}" for b in sc["beats"]) or "-"} |\n')
            f.write(f"\n{n} words, {duration:.2f} s, {n / span:.2f} words a second, voice: {'yes' if voice else 'estimated'}.\n")
    sizes = [len(g["words"]) for g in captions]
    print(f"{len(scenes)} scenes, {n} words, {duration:.2f}s, {n / span:.2f} words/s, "
          f"voice={'yes' if voice else 'no (estimated timing)'}, caption groups {len(captions)} "
          f"(1 word: {sizes.count(1)}, over 4: {sum(1 for s in sizes if s > 4)})")
    if voice and not exact:
        print("note: the voice has a different word count from the script; timings were spread in proportion", file=sys.stderr)


if __name__ == "__main__":
    main()
