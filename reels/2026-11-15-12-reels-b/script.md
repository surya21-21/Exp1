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
| Next longest still moments | 1.40 s (reel 12), 1.27 s (reel 11), 1.17 s (reel 02) | `collection/recipes/moves.md`, rhythm table (longest still stretch) | 17 Nov 2026 |
| Moves with a sound within 3 frames | 103 of 210 | `collection/recipes/sound.md` | 15 Nov 2026 |
| Sound starts early | middle value half a frame | `collection/recipes/sound.md` | 15 Nov 2026 |
| Endings | 9 comment a keyword, 1 follow, 2 a closing line | `collection/recipes/script.md` (8 spoken, 1 on screen only) | 15 Nov 2026 |

## For you to confirm (truth check)

- "I made Claude study twelve viral reels": you gave the reels and asked for the study. True as written?
- "viral": you told me each is its creator's most viewed, above 500k views. I have not checked the view counts myself.
- "No logo": none of the 12 opens on a logo card. Two show a small brand chip while talking; say if you want the line softened.
- The "links" you will send: the `collection/` folder of this repository. It is public.

## Version B: motion-graphics remake (17 Nov 2026)

Same words, voice and music as approved; the words are regrouped into nine scenes and the keyword marks moved (`plan_reel.py --check-approval` prints "script approved"). Built from the motion pack (`studio/packs/motion.md`, recipe cards G01-G15 in `collection/recipes/pack-motion.md`).

### Shot table

| # | Time | Scene type | On screen | Moves (hero / supporting / living detail) | Transition in (what carries) | Sound | Energy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.00-3.97 | `reelDeal` (G05) | Frame counter racing from 11,900 over FRAMES STUDIED; large avatar in front of a fan of 12 reels | Hand dealt into a 6 x 2 grid on arcs, 2 frames apart, on "twelve" / avatar shrinks into the cursor / reels start playing on "viral" and step frame by frame on "frame, by, frame"; counter racing all through | - (frame 0 already moving) | ticks while the counter races, swoosh on the deal, pop on "viral", a tick per frame step | 4 |
| 2 | 3.97-6.13 | `countSlam` (G06), **hero** | Giant paper counter, FRAMES., three layers of film strip | Counter lands on 18,271 on "eighteen" with a 3-frame pull-back and a bounce through its digits / camera push-in 8% with multiplane parallax, strips whip and slow / FRAMES closes up with a tracking settle, its dot pops | `morphCarry` (G01): each counter digit flies from the small counter into the giant one, 2 frames apart; the reels fly past the camera | swoosh (transition), impact on the landing, pop on the dot | 5 |
| 3 | 6.13-8.07 | `chapterList` (G07) | Red badge "4", FINDINGS, four numbered rows | "4" slams into the badge on "four" / heading tracking settle, rows uncovered 3 frames apart / cursor taps row 1 on "found" | `dotZoom` (G04): the camera dives into the full stop of FRAMES.; the dot fills the frame and shrinks into the badge | whoosh (transition), ticks on the rows, pop on the "4", click on the tap | 3 |
| 4 | 8.07-13.70 | `trackTimeline` (G08) | Header "1 Talk from frame zero"; a 12-track timeline with a playhead and a 0.0 s flag; tally "12 of 12"; INTRO, then LOGO, struck out | All 12 waveforms draw from frame 0 on "talking" / dots light on "twelve", tally counts, camera pushes in on the playhead on "very first" / INTRO slams and is struck, LOGO swaps into its place and is struck | `morphCarry`: row 1 of the list becomes the header; the other rows fall away | swoosh (transition), tick, swoosh on the draw, pop on the tally, click on the flag, stamp on INTRO, scratch on each strike, pop on LOGO | 3 |
| 5 | 13.70-19.40 | `tapeMeasure` (G09), **on twos** | "2 NOTHING SITS STILL", a giant pencil "2" behind; a tape measure; 1.67 s (Reel 09), then 1.40, 1.27, 1.17 | Cursor pulls the tape out while the number riding its end counts up and lands on "seven" / heading slams word by word; STILL boils and cannot sit still / every pencil line boils on twos; the other tapes drop into their grooves on "seconds" | `typeWipe` (G02): the giant word TWO slides through with this scene inside its letters, then the camera dives through the T; the chapter tile 1 becomes 2 | whoosh (transition), pop on STILL, soft ticks while the tape runs, pop on the landing, swoosh on the drop | 2 |
| 6 | 19.40-26.17 | `soundLane` (G10) | Two-lane editor: 12 picture marks over 12 sounds; "NO."; "103 of 210 moves with a sound"; "half a frame early" | "NO." slams over the lanes on "No", then shrinks into the corner on "Only" / half the sounds pop off on "half" and the count lands / camera pushes in on one pair on "hair", then pulls back out; the cursor paints a sound under every mark on "every" | `blindFlip` (G03): six strips turn over; the tape of scene 5 becomes this scene's ruler; tile 2 becomes 3 | swoosh (transition), swoosh on the painting, impact on NO., pop on the removal, tick on the count, click on the push-in | 4 |
| 7 | 26.17-34.27 | `tallyDots` (G11) | "4 THE ENDING", 12 dots, three rows: Comment one word, Say follow, Just stop | Dots fly into their rows on "Nine", "One", "Two" and each count rolls / row acts: WORD is typed, Follow becomes Following, a line just stops / the winning row is ticked, the others dim | `morphCarry`: the 12 picture marks of scene 6 become the 12 dots (cream to red, 1 frame apart); tile 3 becomes 4 | swoosh (transition), swoosh on the first sort, ticks while typing, pops on landings, click on Follow, stamp on the stop, pop on the tick | 3 |
| 8 | 34.27-36.20 | `saveTap` (G12) | Large avatar back; "Save this."; a Save button | "Save" slams on the word, "this." follows / the button is pressed on "edit": it fills red, says Saved, its bookmark fills / the avatar rises with an overshoot and tilts on the press | `tear` (signature, chapter change into the close; the avatar survives it) | tear (transition), pop on the slam, click on the press | 2 |
| 9 | 36.20-41.77 | `cta` (signature outro, unchanged) | Comment STUDY keycaps, the comment field, the sign-off card | As before: keycaps, typing, send, sign-off, Follow tap | `morphCarry`: the pressed Save button becomes the comment field (red pill to paper pill) | swoosh (transition), the outro's own clicks, ticks, pop, swoosh, scratch | 3 |

Energy: 4, **5**, 3, 3, 2, 4, 3, 2, 3. It falls after the hero, drops to its calmest in the drawn-on-twos stillness scene, rises again for the "No." twist and settles into the close. Neighbouring scenes never share a layout and scale: grid of small cards, one giant number, a list, a wide panel, giant type over a tape, a two-lane editor, rows of dots, a large avatar, the outro.

Moves used (13 kinds): deal on arcs (1), avatar becomes the cursor (1), slam with pull-back (2, 3, 4, 5, 6, 8), counter landing with a bounce through the digits (2), multiplane push-in (2), tracking settle (2, 3), mask reveal (3), draw-on cascade (4), camera push-in and pull-out on a detail (4, 6), strike and swap in place (4), number that counts and becomes a bar (5), boil on twos (5), paint, pop-off and count (6), sort into rows (7), button press with ripple (8, 9).

Transitions used, in order: `morphCarry`, `dotZoom`, `morphCarry`, `typeWipe`, `blindFlip`, `morphCarry`, `tear`, `morphCarry` (5 kinds; none twice in a row).

## Look card (version B)

| Choice | Value | Why |
| --- | --- | --- |
| Background | Paper Studio | Locked |
| Avatar, outro, voice | As in `brand/`; the voice and music saved in this folder | Signature and locked |
| Accent | #c2381d | 4.52 to 1 on the paper, so it can carry text (the badge, NO., the tiles) |
| Typefaces | Inter (Display Black for kinetic type), Lora italic in the captions | The two bundled faces |
| Editing style | Motion graphics: kinetic type and operated interfaces, every claim a state change, something carried across every change | The owner's angle for this version; P03 numbered list with an H01 hook |
| Hero moment | Scene 2: the counter lands on 18,271 with a push-in and three layers of film strip | The biggest number of the reel, said on "eighteen thousand" |
| 3D | None. Depth from layering, two shadows per object, scale, parallax and blur | Allowed by the brief; keeps the reel flat, fast and light to render |
| Stepped animation | Whole of scene 5 on twos (15 drawings a second), with boiling pencil lines | The scene is about stillness, and reel 09, which has the longest still (1.67 s), is itself drawn at 15 frames a second (`collection/recipes/moves.md`, rhythm table) |
| Transitions | Shared-element morph four times (the carry), dot zoom, type wipe, blind flip, the paper tear once into the close | Carry, not replace; the tear stays the signature for the chapter change |
| Captions | 2 to 4 words, top fifth, keyword in Lora italic on tape | Measured C01, unchanged |
| Sound | The ten sounds in `assets/sfx`; one hit a scene at most (impact, stamp) | `collection/recipes/sound.md` |

### Approved look of the first version (for reference)

#### Look card (version A, approved 15 Nov)

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
