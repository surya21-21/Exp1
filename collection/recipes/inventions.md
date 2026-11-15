# Inventions

New effects and elements for our reels. Each one starts from something measured in the references, changes the material to paper and desk objects, and is drawn by our own code. None is a copy of a creator's design.

Status: **built** = working code in `../lib` with a rendered still in `../demo`; **planned** = recipe only.

| ID | Name | Grew from | What it is | Timing | Status |
| --- | --- | --- | --- | --- | --- |
| N01 | Paper tear wipe | T03 pixel wipe and T04 two-step timing | The frame tears along a rough diagonal edge: a torn strip of paper with a pale fibre edge sweeps across, holds for a beat, and clears to the next scene. Our signature transition. | 3 frames across, 2 hold, 3 clear (8 total) | built |
| N02 | Sticky-note slam | M10 keyword slam, S06 | The key word arrives on a square note at 1.6 times size with a small rotation, overshoots and settles; the note's corner curls up and it casts a warm shadow | 6 frames, then a 2-frame settle | built |
| N03 | Tape label | S01 highlight box | The keyword in a caption sits on a strip of torn tape that unrolls left to right | 4 frames | built |
| N04 | Desk-lamp pool | M25 spotlight, T07 pulse | A soft warm pool of light moves to whatever is being discussed; the rest of the desk dims by a few percent. A flicker (3 frames up, 3 down) marks a change of topic | move 10 frames | built |
| N05 | Avatar cursor with a ring | A03, A09 | The round head chip travels in a shallow arc to its target, tilts into the move, and sends out one thin ring when it arrives | travel 8-10 frames, ring 8 frames | built |
| N06 | Paper counter | M01, M02 | Each digit sits on its own small card with a fold line; the digits roll up through the cards while the number runs, blurred while fast, and every card gives a small bounce when the number lands | starts already running, lands over 1.3 s | built |
| N07 | Fold into furniture | M20 | The hook's main object folds in half twice and flies up to become the progress strip at the top | 10 frames | planned |
| N08 | Rubber stamp | M08 | "MY MISTAKE", "TESTED", "FREE": inked capitals in a rough double border, pressed from 1.4 times size with an ink bleed and a 1-frame squash of whatever is under it | 3 frames down, 1 squash, 4 settle | built |
| N09 | Index-card shuffle | T19 carousel | The current card slides under a stack and the next comes off the top, each slightly rotated, with the avatar's chip riding on the card edge | 5 lead, 4 settle | built |
| N10 | Pencil underline | S05 ticks, M04 draw-on | A pencil line draws under a word with a slight wobble and a small flick at the end | 6 frames | built |
| N11 | Hole-punch iris | T10 | A punched hole opens from the centre of the object being discussed and grows until the next scene is seen through it; the paper edge has a thin shadow | 4 frames open, used in reverse to come back | built |
| N12 | Cut-out pop-up | M19 | A scene made of flat paper layers stands up from the desk on folds, back layer first | 14 frames, layers 2 frames apart | planned |
| N13 | Receipt roll | U26 price list, M07 strike | A till receipt unrolls down the frame listing paid tools and prices; each line is struck with a pencil, and the total at the bottom runs down to zero | 2 frames a line | planned |
| N14 | Paper-tab progress | L05 dots | Progress shown as a row of small paper tabs along the top; the current one fills with the accent as its scene plays | fills across the scene | built (as `progress`) |
| N15 | Ledger numeral | L04 | The step number is printed huge and faint on the paper behind the card, like a page number in a ledger | fades up over 8 frames | built |

## Rules for inventing more

1. Start from a measured recipe (name its ID) and keep its timing; change the material and the meaning.
2. Everything is paper, card, tape, pencil, ink, a lamp or a desk object. No glows, no pixels, no neon.
3. One invention is the hero of a reel; the rest stay quiet.
4. It must be a pure function of time, so any frame can be drawn alone.
5. It gets a still in `demo/` and a line in this table before it is used in a reel.
