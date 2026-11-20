# Claude Code can now design motion graphics

**Status: draft for the owner. Not approved, not voiced, not rendered.** Voice: the channel voice in `brand/voice/voice.json` (Jarnathan, about 3.2 words a second). Planned length: 40 s at the estimated pace (`plan_reel.py`, no voice yet), so about 35 to 38 s once voiced.

Structure: **P01 Product pitch**, with a P06 "show, don't tell" layer: the reel itself is the proof.

## Voiceover

1. Did you know Claude Code can now design motion graphics? No keyframes. No After Effects.
2. This whole reel? Written in code.
3. The old way: drag a keyframe, nudge it, render, repeat. The new way? You just describe the motion.
4. And the twist? I make every reel from my phone. No editing app at all.
5. You need Claude Code, plus one motion skill: Remotion, HyperFrames, or three.js for 3D.
6. Step one. Install the skill with a single command.
7. Step two. Talk like a director: ease in, overshoot, then settle. Done.
8. Save this for your first motion reel.
9. Comment MOTION and I'll send you the links. This is your AI guy.

109 words. First word on frame zero; 15 words in the first 5 s (about 9 in the first 3 s). Twist (re-hook) starts 36% in. Save at 88%, ask at 87 to 100% (see Notes).

## What I changed from the topic you gave

You asked for "Claude Code can now design motion graphics **better than** After Effects". The reel does not say "better": it is not true across the board, and the fact table shows what After Effects still does better. The spoken hook keeps your "Did you know" and makes the claims we can prove: no keyframes, no After Effects, every frame written in code. If you still want "better" on screen, say where, and I will add it as an opinion line ("better for me"), not a fact.

## Fact table

| Claim | Number or fact | Source | Checked |
| --- | --- | --- | --- |
| Claude Code can make motion graphics | Claude Code writes the code; a renderer turns it into frames | Remotion Agent Skills docs (remotion.dev/docs/ai/skills); HyperFrames README (github.com/heygen-com/hyperframes) | 20 Nov 2026 |
| "No keyframes" | Our engine has no hand-set keyframes: every value is a function of time (`studio/engine.js`, `collection/lib/`) | This repo | 20 Nov 2026 |
| "This whole reel? Written in code." | True once rendered by `studio/render.py`: every frame is drawn by the engine | This repo | Re-check at render |
| 946 frames in 90 s (hook counter) | Engine self-test, GitHub Actions run 43719994608 | `claude/collection-and-engine.md` in the Exp1 project | 15 Nov 2026; confirm still the number you want |
| Install command | `npx skills add remotion-dev/skills` | remotion.dev/docs/ai/skills | 20 Nov 2026 |
| HyperFrames is a motion skill for agents | `npx skills add heygen-com/hyperframes`; open source, Apache 2.0 | github.com/heygen-com/hyperframes | 20 Nov 2026 |
| three.js for 3D | Our 3D hero scenes use three.js (`studio/scenes3d.js`) | This repo | 20 Nov 2026 |
| "Settle in 6 frames" (example prompt) | Measured settles are 2 to 12 frames | `collection/recipes/moves.md` | 20 Nov 2026 |

### What After Effects still does better (kept out of the claim on purpose)

- Hand control of every frame: a motion designer can nudge any curve by eye, in real time, without writing or reading code.
- Working with filmed footage: tracking, rotoscoping, keying and compositing are mature in After Effects; our engine draws graphics, it does not track video.
- Character animation and rigging, and a huge plugin and template ecosystem.
- Studio handoff: agencies and clients exchange After Effects project files; nobody exchanges our `reel.json`.
- Live preview while you work. Our loop is write, render stills, look, fix (VideoHub on the PC makes this faster).
- A public post I found agrees: the code route suits mid-complexity animation, and beyond that After Effects is still the stronger tool (LinkedIn, searched 20 Nov 2026).

## For you to confirm (truth check)

- "I make every reel from my phone. No editing app at all." Your notes say you work from your OnePlus 13r and do no editing in After Effects. But you now have a PC. If any reel was or will be made on the PC, change the line to "I made my first reels from my phone".
- "This whole reel? Written in code." Only true if this reel is rendered by our engine with no edits in another app. Keep it that way, or cut the line.
- The links you will send for MOTION: suggest the Remotion skills page, the HyperFrames repo and the three.js site. Say if you want Exp1 too.

## Hooks considered (Stage 3)

Scored 0 to 2 on: clear in under 3 s / one idea / works muted / payoff promised and delivered / reason to finish.

| # | Kind | Spoken line | Frame zero | On-screen text | Score |
| --- | --- | --- | --- | --- | --- |
| A | H03 object is the claim + H01 number running | "Did you know Claude Code can now design motion graphics? No keyframes. No After Effects." | 3D fan of paper reel cards on the desk, counter already running to 946 | "frames drawn by code" + chips "No keyframes", "No After Effects" | 2/2/2/2/2 = **10** |
| B | H02 enemy on screen | "Stop dragging keyframes. Claude Code animates from a sentence." | A keyframe timeline that gets struck out in 2 s | "Stop dragging keyframes" | 2/2/2/1/1 = 8 (attacks the viewer's habit; "from a sentence" overstates it) |
| C | H08 problem, then "but" | "Motion graphics used to mean After Effects. But this reel was written in code." | Big type "After Effects" with a pencil strike | "used to mean" | 1/2/2/2/2 = 9 (topic clear only at word 6) |
| D | H01 number running | "Nine hundred forty-six frames. Drawn by code in ninety seconds." | Counter racing | "946 frames, 90 s" | 1/2/1/1/1 = 6 (a number with no reason to care yet) |
| E | H09 feeling first | "Scared of After Effects? You might not need it." | Avatar with "thinking" face over a crowded menu | "You might not need it" | 2/2/1/1/1 = 7 (weak promise; "might" is honest but soft) |

Top 3 for you: **A**, C, B. **Pick: A.** It keeps your own "Did you know", names the tool and the payoff in sentence one, the picture is already moving on frame zero, and the next line ("This whole reel? Written in code.") pays it off in under 2 seconds.

### Hook Master verdicts (on the topic line you gave and on A)

- **Four failures, on "Claude Code can now design motion graphics better than After Effects":** delay pass (topic in the first 4 words); confusion pass; irrelevance pass for creators, fail for non-creators (expected, niche reel); disinterest pass. Honesty fail: "better than" is a claim about another product the reel cannot back. Declined; replaced by "No keyframes. No After Effects."
- **Viewer panel on A:** doom-scroller stays (moving 3D cards, a question); sceptic stays but waits for proof (paid off by "This whole reel? Written in code."); beginner stays ("no keyframes" lowers the bar); niche expert half-swipe ("I know Remotion") and is kept by the phone twist at 36%; buyer n/a; rival creator stays to see the method.
- **Council, top 3 changes:** (1) drop "better than" (honesty, keeps the sceptic); (2) put the proof line second, not later (keeps sceptic and expert); (3) move the phone twist before the how-to, as the re-hook (keeps the expert).
- **Lock-in:** lines 2 and 3 pay the hook off at once: the reel is the proof, then old versus new in one compare card. No dead stretch: there is no intro or "here's how" preamble.
- **Test it:** post A; compare its 3-second hold and average watch time in your own Insights with the first reel (STUDY). No predicted numbers.

## Shot table (Stage 5)

| # | Scene | On screen | Move | In | Sound | Energy |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `hook3d` (3D hero) | 12 paper reel cards fan on the desk, counter running 420 to 946, avatar shrinks into the cursor on "design", chips land on each "No" | Camera push through the fan | - | Counter ticks, pop per chip | 5 |
| 2 | `bigWord` | "This whole reel was **Written**", keyword on tape | Word lands at 2.5x and settles | tear (chapter) | Paper tear, stamp-soft on the word | 4 |
| 3 | `compare` | "Keyframes by hand" struck, "Describe the motion" ticked | Strike then tick, cursor travels between | whip | Swoosh, pencil strike, tick | 3 |
| 4 | `cards3d` (3D hero) | Four index cards: script, code, GitHub, approve | Stack fans into a grid | tear (chapter, re-hook) | Paper tear, card slaps | 5 |
| 5 | `network` | Claude Code hub, three tiles join on each name | Tiles arrive staggered on an arc | iris (into the hub) | Pop per tile | 3 |
| 6 | `steps` | Step 1 of 2, underline, the command types | Underline draws, prompt types | shuffle | Pencil, typing | 2 |
| 7 | `uiCard` | Three toggles switch on, stamp DIRECTED | One switch per word, stamp slam | railScroll | Click per toggle, stamp hit | 3 |
| 8 | `save` | Bookmark fills | Ramp into a hard cut | rampCut | Riser into the cut | 4 |
| 9 | `cta` | MOTION types into the tile, sign-off card, avatar | Keyword types, avatar looks at the viewer | tear | Paper tear, signature sound | 2 |

Variety: 9 scene types in 9 scenes, none repeated. Transitions: 6 kinds (tear, whip, iris, shuffle, railScroll, rampCut); tear used 3 times, never twice in a row. Energy 5 to 2, not flat. Two 3D heroes: the hook and the twist.

## Look card (open choices for this reel)

| Choice | Value | Why |
| --- | --- | --- |
| Background | Paper Studio | Locked |
| Avatar, outro, voice | As in `brand/` | Signature |
| Accent | #c2381d brick red (4.52 to 1 on the paper, just over the 4.5 limit) | The channel's original accent, chosen by the owner on 20 Nov (cobalt blue #2b54b8 was the first draft); keeps this reel in the same series as the first |
| Editing style | Cuts and hits for the hook and twist, one-canvas changes for the two steps | Pitch at the top, "how it works" in the middle |
| 3D heroes | `hook3d` (the fan of reel cards = "motion graphics") and `cards3d` (the phone workflow) | Biggest moments: the claim and the twist |
| Captions | 2 to 4 words, top fifth, keyword in Lora italic on accent-tinted tape | House caption style C01 |
| Sound | Paper tear for chapters, swoosh on the whip, ticks and pops for counters and tiles, one stamp hit | Half the moves get a sound, one frame early |
| Music mood | Light, curious, mid tempo; no ambient drone (the first test bed was too calm) | Pitch reel, not a mood reel |

## Pronunciation

- Claude Code: "klawd code". HyperFrames: "hyper frames". three.js: "three jay ess". Remotion: "ree-MOH-shun".

## Notes

- Save sits at 88%, right before the ask, as in the first reel and reference r10. Our script rules prefer 50 to 65%; at 9 scenes and 37 s there is no room mid-reel without breaking the steps. Say if you want it moved.
- No official logos are in `logos/` yet, so the network tiles show first letters. To use logos, add the official files and I will wire them.
