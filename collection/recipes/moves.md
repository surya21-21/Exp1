# Moves inside a shot

Things that happen while the scene stays. Seen in the frame strips and the one-frame-a-second sheets of all 12 reels. Frame counts in the first table were read by eye from the strips and are good to within a couple of frames; the rhythm table below is measured by code on every frame.

| ID | Name | Seen in | What happens | Numbers | Use it for | In our library |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | Counter already racing | r03, r04, r06, r08, r09, r12 | A number is mid-run on the first frame and lands on the claim | fast at first, slows into the final value over 1-1.5 s | Hooks, proof | `counter` |
| M02 | Digit roll | r05 ("8M") | Digits spin like a slot machine and lock one by one | each digit locks 2-3 frames after the last | Big totals | `counter` with `roll` |
| M03 | Bar race | r04 | Bars grow at different speeds, labels ride the bar ends, numbers tick every frame | whole race 2-3 s | Comparisons | `barRace` |
| M04 | Line chart draw-on | r04, r06 | The stroke reveals left to right and ends in a dot | about 12 frames | Growth claims | `lineChart` |
| M05 | Toggle flips on the keyword | r05, r06, r12 | A switch turns on at the exact word that names the benefit | knob travel 4-5 frames | "It does X for you" | `toggle` |
| M06 | Click ripple | r03 | Button colour inverts and a ring expands from it | ring 8-10 frames | Any press | `ripple` |
| M07 | Rejected and accepted cards | r06 | One card gets a strike-through and a red cross badge, the other a tick badge | strike 5-6 frames | "Not this, this" | `strike`, `badge` |
| M08 | Stamp | r12 (FAKE), r07 (GENERIC), r08 (MISSING VISUAL) | A tilted stamp lands from 1.3 times size | 2-3 frames, then a 1-frame squash | Judgement on something | `stamp` |
| M09 | Row removed, list closes up | r12 | A row slides out and the rows below move up | 6-8 frames | Cleaning up, deleting | `listRemove` (planned) |
| M10 | Keyword slam | r04, r05, r06 | The key word arrives at 2-3 times size in the accent colour over the caption, then shrinks into the line | about 6 frames | The one word that matters | `slam` in captions |
| M11 | Grid multiplies | r11 | 2x2 becomes 3x3 becomes 4x4 of the same card while the camera pulls out | 3 steps of about 8 frames | "Everyone's looks the same" | `gridMultiply` (planned) |
| M12 | Exploded layers merge | r09 | A stack of floating layers collapses into one flat card that turns to face the camera | about 10 frames | "It puts it all together" | `layerStack` |
| M13 | Lines connect | r09, r10 | Thin curved lines draw from tool tiles to a hub | 6 frames each, 2 frames apart | "These work together" | `connect` |
| M14 | Typing in a field | r04, r08, r09 | One letter every 2-3 frames with a blinking caret | - | Prompts, the comment keyword | `typeIn` |
| M15 | Paper plane send | r09 | A plane follows a dashed looping path into a message card | about 20 frames | "I'll send it" | `planeSend` (planned) |
| M16 | Magnifier pass | r01 | A lens slides across a screenshot and enlarges what is under it | 10-12 frames | Pointing at a detail | `magnify` (planned) |
| M17 | Tilt down a tall canvas | r01 | The camera moves down to reveal what is below | about 8 frames | Reveal the consequence | `railScroll` |
| M18 | Per-letter colour chase | r03 | Letters change colour one after another | 1 letter per frame | Music-synced titles | Not planned |
| M19 | Pop-up book | r07 | Pages open and a paper scene stands up | about 14 frames | Story beats | N12 |
| M20 | Objects become the furniture | r12 | The six toggles from the hook fly up in arcs and become the progress dots | about 10 frames | Carrying the hook into the body | N07 |
| M21 | Lens bulge | r03 | A circular warp follows the pointer | - | Emphasis | Not planned |
| M22 | Fan-out | r05 | Cards fan around a centre object one by one | 3-4 frames apart | "It made all of these" | `fan` (planned) |
| M23 | Follow tap | r05, r06, r09-r12 | A cursor taps Follow, it becomes Following, the count ticks up | tap 3 frames | Outro | `profileCard` |
| M24 | Stepped animation | r01 (about 17 fps), r09 (15), r12 (19), r10 (20) | Movement is drawn on every second frame for a hand-made feel | - | A deliberate, calmer look | `stepped` option |
| M25 | Spotlight cone | r01 | A cone of light from above marks the subject | - | Stage feeling | N04 |
| M26 | Cable plugs in | r04 | A cable draws from a logo to a card | 8-10 frames | "Once you connect X" | `connect` with `cable` |

## Rhythm, measured

| Reel | Small changes a second | Middle gap between changes | Longest still stretch | Drawn frames a second while moving |
| --- | --- | --- | --- | --- |
| r01 | 0.58 | 25 frames | 0.1 s | 16.9 |
| r02 | 0.41 | 31 frames | 1.17 s | 26.0 |
| r03 | 0.38 | 20.5 frames | 0.03 s | 29.7 |
| r04 | 0.65 | 27 frames | 0.27 s | 28.2 |
| r05 | 0.75 | 21 frames | 0.53 s | 27.2 |
| r06 | 1.03 | 17 frames | 0.77 s | 23.2 |
| r07 | 0.52 | 25 frames | 0.6 s | 26.3 |
| r08 | 0.5 | 22.5 frames | 0.23 s | 27.1 |
| r09 | 0.59 | 21 frames | 1.67 s | 15.0 |
| r10 | 0.65 | 24 frames | 0.6 s | 20.0 |
| r11 | 0.67 | 21 frames | 1.27 s | 23.3 |
| r12 | 0.84 | 22 frames | 1.4 s | 19.1 |

"Small changes" are bumps in the frame-difference curve outside the catalogued transitions: a caption word, a counter tick, an element landing. Across the set there are 0.38 to 1.03 of these a second on top of the transitions, and nothing sits completely still for longer than 1.67 s. The last column is the stepped look (M24): a reel drawn at 15 to 20 frames a second inside a 30-frame video is animating "on twos". The earlier note in this project that the "nothing changing" measure was a bug was wrong: it was counting repeated frames in stepped animation (M24) and real holds.
