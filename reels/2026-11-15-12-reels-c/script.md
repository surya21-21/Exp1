# I made Claude study 12 viral reels, frame by frame

**Status: script approved by the owner on 15 Nov 2026.** This folder is director C's remake of the picture (the character version); the spoken words are unchanged and its storyboard is not yet approved. Voice: the channel voice in `brand/voice/voice.json`, normal speed.

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
| Frames per reel (director C: the hook's counter shows the running total as he counts each reel) | 1,184; 1,303; 859; 1,286; 1,197; 1,682; 2,712; 1,272; 2,508; 1,109; 981; 2,178 (running totals 1,184 ... 16,093, 18,271) | `collection/data/r01` ... `r12/events-summary.json`, field `frames`; they sum to 18,271 | 16 Nov 2026 |

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

## Director C: the character version (16 Nov 2026)

The avatar drives the story: a paper puppet with a body (new, for the owner to approve) walks, points, reacts, sits on the cards, uses props and rides the transitions. Every finding is something he does. Code and recipes: `studio/packs/character*`, `collection/recipes/pack-character.md` (R01-R15).

### Shot table

| # | Scene (type) | On screen | Moves | Transition in | Sound | Energy |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `charHook` 0.00-6.13 | Tally counter already rolling; twelve reel cards; the large approved face talking | The head flies down to reel 01 and his body unfolds in parts (R02); he hops across the twelve reels, each lights and its frames roll onto the counter; a high jump and a stomp land 18,271 on "eighteen thousand"; he points up at it; two chips pop | - | whoosh (unfold), pop (lands), a tick per reel, impact (stomp), pop per chip | 4 |
| 2 | `charDeal` 6.13-8.07 | "4 things"; three finding cards on the wall, an empty slot for card 1 | He deals cards 2, 3, 4 with flicks of the wrist, 3 frames apart (R03); shows card 1 at his side; winds up | `charTear`: he grabs the page edge and leaps across, tearing it away (R10) | tear; swoosh (deal); pop | 4 |
| 3 | `charUnderline` 8.07-13.70 | Step 01 card: "Talk from frame zero", 12 speech bubbles, "12 of 12 start talking at 0.0 s"; INTRO and LOGO cards | Finger up on "One"; he runs along the card's top edge dragging a giant red pencil whose tip draws the underline and pops the bubbles (R04); golf-swings INTRO off the ledge; stomps LOGO flat | `charThrow`: he throws card 1 at the camera and it lands as this card (R11) | swoosh (throw); scratch (pencil); swoosh (swing); stamp (stomp) | 3 |
| 4 | `charMeasure` 13.70-19.40 | "Longest still moment"; bar race (Reel 09 1.67 s, Reel 12 1.40, Reel 11 1.27, Reel 02 1.17) | He sits on the card's top edge, legs never still (R01s); on "longest" a magnifier goes over the 1.67 bar and shows it large (R05); a curious head tilt on "seven" | `charLift`: he jumps off the old page and rides the rising chart card up (R12) | whoosh (lift); pop (bars land); swoosh (magnifier); click | 2 |
| 5 | `charMute` 19.40-26.17 | "A sound on every move?"; counter 210; a desk of ten speaking channels in front of him; a strip with the sound half a frame early | **Hero.** Every speaker blares: hands to his ears, a wince; "No.": jump and slam, head shake; he runs along the desk muting every other channel while the counter rolls to 103 (R06); points at the strip | `charHole`: he drops through a punched hole that shows this scene and climbs up behind the desk (R13) | pop (hole); riser (blare); impact (slam); a click per mute; tick | 5 |
| 6 | `charSort` 26.17-34.27 | "The ending"; three trays: Comment one word, Follow, Just stop | Holds the twelve endings up; deals nine in a stream into the first tray, flicks one high into the second, drops two that land dead into the third (R07); counts 9, 1, 2 of 12 pop; shrug | `charWhip`: whipped off with the old scene, he flies in and lands with a squash (R14) | swoosh (whip); swoosh (stream); pop; pop; tick | 4 |
| 7 | `charSave` 34.27-36.20 | The large approved face; "Save this."; bookmark | He nods to the bookmark, it fills; a wink (R08) | `charPush`: the camera rams into his face until it is this face (R15) | riser (push); pop (bookmark) | 2 |
| 8 | `cta` 36.20-41.77 | The outro as approved: "Comment STUDY", keys, comment field, sign-off card | The large face waits low on the left looking up at the keys, becomes the picture in the sign-off card, grins after Follow | `tear` (our signature, chapter change) | tear; the outro's own clicks, ticks, pop, swoosh, scratch | 3 |

Moves, none repeated back to back: unfold, hop-count and stomp; deal; pencil run, golf swing, stomp-flatten; sit-swing, magnify; ears, jump-slam, run-and-mute; sort into piles; nod and wink; large face into the sign-off. Transitions, none repeated: `charTear`, `charThrow`, `charLift`, `charHole`, `charWhip`, `charPush`, `tear`. Energy 4, 4, 3, 2, 5, 4, 2, 3: it rises to the hero at scene 5, drops for "Save this", and lifts for the ask. Neighbouring scenes never share layout and scale (puppet head 170, 250, 165, 150, 290, 220 px, then the large face at 430 and 280 px).

### Look card (director C)

| Choice | Value | Why |
| --- | --- | --- |
| Background | Paper Studio | Locked |
| Avatar | The approved heads (small) and expression faces (large), uniform scale and rotation only, on a new jointed paper body in the heads' greys and outline weight, headphones round the neck | The owner's angle for this version: the avatar drives the story. **The body is new: the owner approves it** (`collection/demo/character/r01-puppet.jpg`) |
| Large face | At frame 0, for "Save this", and through the outro (it becomes the sign-off picture) | Brief and A01/A06 |
| Accent | #c2381d | Unchanged; 4.5 to 1 on the paper. Used for the keywords, the hero bar, the pencil and its line, the muted keys, the outro |
| Type | Inter and Lora | Unchanged |
| Structure | P03 numbered list with an H01 hook (counter already running) | Unchanged script |
| 3D | None | He is drawn in 2D and has to touch things precisely; the owner's one-or-two-3D-scenes rule is not met in this version: the owner decides |
| Transitions | Six of the pack's, each caused or ridden by him, plus the signature tear into the outro | One per change, never the same twice |
| Captions | 2 to 4 words, top fifth, keyword in Lora italic on tape | Unchanged (C01, N03) |
| Sound | The ten sounds in `assets/sfx`, on transitions and the key moves only | Sound rules in the skill |
