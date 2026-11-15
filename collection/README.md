# Collection

Everything learned from the 12 reference reels, and what we built from it. The reel engine (`../studio`) draws reels from the code in `lib/`.

**What is stored here:** techniques (recipes with their measured numbers), text data from the measurements, and our own code and pictures. **What is not:** the creators' videos, frames, audio, drawings, characters, logos or scripts. A technique is free to learn; a creator's finished work is theirs.

## What is in each folder

| Folder | Contents |
| --- | --- |
| `recipes/` | One file per subject. Every entry has an ID, where it was seen, its numbers, how it is built and when to use it. |
| `lib/` | Our effect library: plain JavaScript, every value a function of time. |
| `demo/` | Pictures rendered from `lib/` by our engine (nothing from the reference reels). |
| `data/` | The measurements as text: per reel, every picture event and every labelled sound. |
| `tools/` | The script that measured the picture events. |

## Recipes

| File | IDs | Count |
| --- | --- | --- |
| [transitions.md](recipes/transitions.md) | T01-T24 | 24 transitions |
| [moves.md](recipes/moves.md) | M01-M26 | 26 moves inside a shot, plus the rhythm table |
| [hooks.md](recipes/hooks.md) | H01-H10 | the 12 openings and 10 hook kinds |
| [layouts-and-ui.md](recipes/layouts-and-ui.md) | L01-L10, U01-U26 | 10 layouts, 26 interface pieces |
| [labels-captions-avatar.md](recipes/labels-captions-avatar.md) | S01-S14, C01-C07, A01-A10 | 14 labels and stickers, 7 caption styles, 10 avatar uses |
| [script.md](recipes/script.md) | P01-P06, D01-D12 | pace table, 6 structures, 12 devices, the calls to action |
| [sound.md](recipes/sound.md) | - | which sound on which event, timing, loudness, our sound set |
| [inventions.md](recipes/inventions.md) | N01-N15 | our own effects, 12 built and 3 planned |

## Library (`lib/`)

| File | What it gives |
| --- | --- |
| `ease.js` | Timing curves, spring, stepped time, seeded random numbers |
| `paper.js` | Paper Studio background, cards, the desk lamp, torn edges, pencil lines, contrast check |
| `elements.js` | `counter`, `toggle`, `stamp`, `pencil`, `badge`, `typer`, `tile`, `connector`, `bars`, `ripple`, `chip`, `sticky`, `keycaps`, `progress`, `ledgerNumeral`, `bookmark` |
| `transitions.js` | `cut`, `tear`, `iris`, `railScroll`, `whip`, `dissolve`, `shuffle`, `rampCut`, `flicker` |
| `captions.js` | Word-by-word captions with the keyword on paper tape; grouping into 2 to 4 words |
| `avatar.js` | The bust and the cursor chip from `brand/avatar/avatar.png`, cursor travel, arrival ring |

Demo pictures: [`demo/elements.jpg`](demo/elements.jpg), [`demo/transitions.jpg`](demo/transitions.jpg), [`demo/n01-paper-tear.jpg`](demo/n01-paper-tear.jpg) (all 8 frames of the paper tear).

## How it was measured

| What | How | Coverage |
| --- | --- | --- |
| Picture events | `tools/catalogue_events.py`: every frame decoded; frame-difference curve; each cut or motion peak grown into an event with its lead and settle frames; camera shift, zoom and rotation from tracked points; blur, flash and background colour | All 18,271 frames of the 12 reels: 210 events of 25 kinds |
| Looked at | Strips of consecutive frames across events; the first 3 seconds of each reel at 10 frames a second; each whole reel at 1 frame a second | 72 of the 210 events, at least one of every kind in every reel |
| Speech | Voice separated with Demucs, transcribed with Whisper "small", word timings | All 12 (the Hindi reel roughly) |
| Sound | Sound starts found in the music-and-effects track, labelled by LAION-CLAP and PANNs, matched to picture events | 1,621 sound starts; 48% marked unsure; not checked by ear |

## Limits, stated plainly

- 138 of the 210 events were measured but not looked at; their kind comes from the numbers alone.
- Frame counts in `moves.md` were read by eye from strips.
- A racing counter is steady small change, so it does not show up as separate events.
- Sound names are model guesses. Timing and loudness are measured.
- Nothing shorter than one frame can be seen, and compression smears the fastest moves.
- The avatar has no blink or mouth shapes yet: that needs the original character sheet.
