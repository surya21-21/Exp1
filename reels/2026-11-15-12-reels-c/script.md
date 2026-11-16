# I made Claude study 12 viral reels, frame by frame

**Status: approved by the owner on 15 Nov 2026.** Voice: the channel voice in `brand/voice/voice.json`, normal speed.

## Voiceover

1. I made Claude study twelve viral reels, frame by frame. All eighteen thousand frames.
2. Here are four things it found.
3. One. All twelve start talking on the very first frame. No intro. No logo.
4. Two. Nothing sits still. The longest pause in any of them is one point seven seconds.
5. Three. A sound on every move? No. Only half of them get one, a hair before the picture.
6. Four. The ending. Nine of twelve ask for one word in the comments. One says follow. Two just stop.
7. Save this for your next edit.
8. Comment STUDY and I'll send you the links. This is your AI guy.

## Fact table

| Claim | Number | Where it comes from | Checked |
| --- | --- | --- | --- |
| Reels studied | 12 | The 12 files you uploaded | 15 Nov 2026 |
| Frames | 18,271 | Frame count of the 12 files (ffprobe) | 15 Nov 2026 |
| Moves catalogued | 210 | `collection/data/*/events.csv` | 15 Nov 2026 |
| Sounds labelled | 1,621 | `collection/data/*/sfx-map.csv` | 15 Nov 2026 |
| Speech starts on frame zero | 12 of 12 | Word-timed transcripts: first word at 0.0 s in every reel | 15 Nov 2026 |
| Words in the first 3 seconds | 6 to 14 | `collection/recipes/script.md`, pace table | 15 Nov 2026 |
| Longest still moment | 1.67 s (reel 09) | `collection/data/*/events-summary.json` | 15 Nov 2026 |
| Moves with a sound within 3 frames | 103 of 210 | `collection/recipes/sound.md` | 15 Nov 2026 |
| Sound starts early | middle value half a frame | `collection/recipes/sound.md` | 15 Nov 2026 |
| Endings | 9 comment a keyword, 1 follow, 2 a closing line | `collection/recipes/script.md` (8 spoken, 1 on screen only) | 15 Nov 2026 |

## For you to confirm (truth check)

- "I made Claude study twelve viral reels": you gave the reels and asked for the study. True as written?
- "viral": you told me each is its creator's most viewed, above 500k views. I have not checked the view counts myself.
- "No logo": none of the 12 opens on a logo card. Two show a small brand chip while talking; say if you want the line softened.
- The "links" you will send: the `collection/` folder of this repository. It is public.

## Look card

| Choice | Value | Why |
| --- | --- | --- |
| Background | Paper Studio | Locked |
| Avatar, outro | As in `brand/` | Signature |
| Accent | #c2381d (brick red) | 4.5 to 1 on the paper, so it can be used for text |
| Structure | Numbered list (P03) with a number-already-running hook (H01) | Four findings, each one shown as a state change |
| 3D hero scenes | The hook (twelve reel cards fanning open on the desk behind the frame counter) and "4 things" (index cards drop into a stack, then stand up in a grid) | Real depth for the two biggest moments; the rest stays flat and fast |
| Transitions | Paper tear for the chapter changes, page scroll between the four points, ramp into "Save this" | One signature wipe, calm moves in between |
| Captions | 2 to 4 words, top fifth, keyword in Lora italic on tape | Measured caption style C01, in our materials |
| Sound | Paper tear, pencil, stamp, clicks and pops from `scripts/make_sfx.py` | Half the moves get a sound, one frame early |
| Voice | Not chosen yet | Needs your ElevenLabs key or a recording |

## Hooks considered

| Hook | Pattern | Score (of 10) |
| --- | --- | --- |
| "I made Claude study twelve viral reels, frame by frame." with the frame counter racing | Demonstration plus number (H01) | 9: clear in 3 s, works muted, the payoff is the list |
| "Eighteen thousand frames. Here is what viral reels have in common." | Number first | 8: strong number, but no "I" |
| "Stop adding a sound to every move." | Contrarian | 7: sharp, but it is only one of the four points |

Hook Master is not installed in this workspace, so these were scored with the rubric in reel-director only.
