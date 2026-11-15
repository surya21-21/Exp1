# Transitions

How a reel gets from one picture to the next. Measured on every frame of the 12 reference reels (210 events); 72 of them were looked at as strips of consecutive frames, at least one of every kind in every reel. Exact times for every event are in `../data/<reel>/events.csv`.

Reading the numbers: **lead** = frames of movement before the biggest change, **settle** = frames after it. At 30 frames a second, 3 frames = 0.1 s.

| ID | Name | Seen in | Measured | How it is built | Use it for | Our version |
| --- | --- | --- | --- | --- | --- | --- |
| T01 | Hard cut | all cutters; r07 hook (7), r02 (4), r04 (3) | 1 frame, no lead, no settle | Swap the picture on one frame | Montage, list beats, punchlines | As is |
| T02 | Cut, then settle | r05, r06, r04, r03 | cut on 1 frame, then 2-12 frames of elements landing | The new scene's elements are already mid-entrance on its first frame, so the cut never shows an empty stage | Default scene change | `cutSettle` in `lib/transitions.js` |
| T03 | Pixel-block wipe | r05 (8), r06 (12) | lead 2, flip 1, settle 4-5: about 8 frames | Outgoing scene breaks into small squares for 2 frames; background flips dark to light (or back) on one frame; incoming cards assemble from squares while the caption's first word is already readable; a brand chip at the top never moves | A signature wipe that hides a full layout change | Do not copy: ours is the paper tear (N01) |
| T04 | Ribbon-stack wipe (two-step) | r04 (6) | lead 6, settle 2: 8-9 frames | A stack of coloured bands sweeps diagonally over the frame in 3 frames, holds 2, clears in 3 | Chapter change | N01 uses the same two-step timing |
| T05 | Ramp into cut | r02 (2-3), r06 (1), r12 (1) | 9-12 frames of accelerating zoom or slide, hard cut on the fastest frame, next shot starts still | Speed rises until the cut; nothing moves after it | Energy into a calm beat | `rampCut` |
| T06 | Film-burn flash | r02 hook | 3 frames to white, 3-4 frames out: about 7 | An orange glow grows from a corner to full white; the next scene appears through it | Opening reveal | Paper Studio: a warm light sweep, no orange burn |
| T07 | Brightness pulse | r02 | 3 frames up, 3 down, same shot | Whole picture brightens and returns | Emphasis without a scene change | Lamp flicker (N04) |
| T08 | Beat of black | r02 | hard cut to black, hold 0.4-0.5 s with one line of text, cut back | Full black frame carrying a single phrase | The pause before the point | Beat of blank paper with one pencilled line |
| T09 | Highlight grows into background | r02 | about 5 frames | The bar behind a highlighted word expands to fill half the frame and becomes the next background | Turning a word into a scene | `highlightGrow` (planned) |
| T10 | Iris from an object | r03 (record), r11 and r12 (black ball, 3 times) | 3-4 frames to fill; reverse with a light dot | A round object grows from the centre until the frame is inside it; the next scene is the object's colour | Switching to a "dark aside", then back | Hole-punch iris (N11), `iris` |
| T11 | Blind wipe | r03 | 4-5 frames | Horizontal bars flip the colour scheme top to bottom | Beat-synced colour swap | Not planned |
| T12 | Whip with blur | r01 (vertical), r03 | 3-4 frames of heavy directional blur, incoming object lands with a small overshoot | Fast pan; blur hides the join | Fast location change | `whip` |
| T13 | Spin push-in | r03 | 4 frames push with blur, colour floods, title on frame 5 | Camera drives into a spinning object | Big reveal on a beat | Not planned |
| T14 | Glitch rewind | r03 | about 10 frames | Colour split, horizontal tearing, scrambled digits, a rewind icon; the scene returns to an earlier state | "Let's try that again" | Paper version: pages flip back |
| T15 | Gallery glide | r07 (15 moves) | lead 4, settle 4-5: about 9 frames, blurred | A 3D camera travels sideways to the next pedestal; the room colour changes to suit the exhibit | Lists of things shown as objects | Desk slide: camera moves along our paper desk |
| T16 | Tile swarm | r07 | about 5 frames | Square 3D tiles in accent and white fly past the camera | Covering a jump in place | Paper confetti squares |
| T17 | Page scroll along a rail | r09 (9), r12 (3) | lead 7-8, settle 9: about 17 frames (0.55 s), eased both ends, slight blur | The whole canvas scrolls up to the next step; a timeline rail on the left carries a marker | Step-by-step tutorials | `railScroll` |
| T18 | Card becomes background | r10 | about 6 frames | A card expands from where it sits to fill the frame, turning a dark section light | Entering a detail | `cardExpand` (planned) |
| T19 | Carousel slide | r11 (4) | lead 5, settle 4: 9 frames | Cards slide sideways with a perspective tilt | Options, styles, before and after | Index-card shuffle (N09) |
| T20 | Dissolve | r08 | 6-8 frames | Crossfade between centred cards on an unchanged stage; the caption bar never moves | Calm one-canvas reels | `dissolve` |
| T21 | Match cut on subject | r01 | 1 frame | Hard cut to a closer framing of the same subject | Punching in on a word | As is |
| T22 | Pendulum drop-in | r01 (jar), r11 (badge) | 6-10 frames, overshoot then settle | An object on a string swings in from the top with rotation | Introducing the hero object | `pendulum` |
| T23 | Pixel-assemble label | r01 | about 5 frames, stepped | A label resolves out of scattered squares | Retro titles | Not our style |
| T24 | Dialog over a dimmed scene | r11 | 4-5 frames | A dialog box pops in while the scene dims slightly and the previous object leaves upward | A choice or a question | `modal` in `lib/elements.js` |

## Patterns across the 12

- **Cutters** (r01-r06): a transition every 1.4 to 2.8 s. **One-canvas builders** (r08-r12): 4 to 18 moves in a whole reel, almost no cuts.
- A sound starts within 3 frames of the transition on 57% to 76% of events in the cutters and the gallery reel; far fewer in the calm reels (2 of 10 in r11).
- Nearly every creator owns **one** signature transition and repeats it: the pixel wipe (20 of 32 events in r05-r06), the gallery glide (r07), the rail scroll (r09). Variety comes from the content, not from the transition.
- Light and dark are alternated on purpose: r05 and r06 flip the background on almost every wipe.
