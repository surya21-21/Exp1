# Labels, stickers, captions and the avatar

## Labels and stickers (S01-S14)

| ID | Piece | Reels | Recipe |
| --- | --- | --- | --- |
| S01 | Highlight box behind a keyword | r07 (lime), r09-r12 (pale blue), r04 (orange) | A flat rounded box drawn behind one word; arrives in 3-4 frames, left to right |
| S02 | Tilted banner | r04 | A coloured strip at 4-6 degrees carrying two or three words |
| S03 | Corner sticker | r03, r05 | "FREE", "new" as a small round or pill sticker overlapping a card corner |
| S04 | Stamp | r07, r08, r12 | Tilted, outlined capitals; lands in 2-3 frames |
| S05 | Emphasis ticks | r01 | Three short strokes fanning from a word |
| S06 | Sticky note | r07 | A square note with "TIP" and one line |
| S07 | Padlock | r09 | On a locked or paid thing |
| S08 | Flag marker | r04 | Marks the goal on a scale |
| S09 | Tick and cross badges | r06 | Round badge on a card corner |
| S10 | Use-case pill | r07 | A small pill above the title: "For stories" |
| S11 | Pixel tag | r01 | Small red block-letter label |
| S12 | Status pill | r08, r09 | Capitals in a rounded outline |
| S13 | Live dot | r09, r12 | Red dot before a ticking number |
| S14 | Props | r01, r02, r07, r09 | Pencil, eraser, magnifier, cloche, trophy, paper plane, record |

r02 also uses photographs of well-known people and brand products. We do not.

## Captions (C01-C07)

| ID | Style | Reels | Numbers |
| --- | --- | --- | --- |
| C01 | Word by word, keyword in a box | r09-r12 | Light sans words one at a time; the keyword turns italic serif inside a pale box; the previous phrase blurs away; top fifth |
| C02 | Bold top line with a slam | r04, r05, r06 | Bold sans at the top; the key word arrives at 2-3 times size in the accent and shrinks into place in about 6 frames |
| C03 | Fixed bar under the card | r08 | White with one accent word; 2 to 4 words at a time |
| C04 | Small caption with a headline above | r07 | Caption low left, title at the top with highlight boxes |
| C05 | Caption chip | r03 | White rounded box, low centre |
| C06 | Oversize moving type | r02 | Words larger than the frame, with motion blur, as the picture itself |
| C07 | Pixel type | r01 | Block letters for titles |

Measured speaking pace that the captions follow: 2.7 to 4.3 words a second (see `script.md`), so a 2 to 4 word group stays up for about 0.6 to 1.2 s.

Our caption (in `../lib/captions.js`): Inter, near-black on paper, 2 to 4 words at a time in the top fifth, the keyword in Lora italic on a strip of accent-tinted tape (S01 drawn as paper tape), the group before fades and lifts in 4 frames.

## Avatar (A01-A10), from r09-r12

| ID | Use | Recipe |
| --- | --- | --- |
| A01 | Opens large | Centre, about a third of the width, for the first second |
| A02 | Gets out of the way | By about 2 s it is 6-8% of the width, beside the card |
| A03 | Acts as the cursor | Travels to the row, switch or button being talked about; replaces the mouse pointer |
| A04 | Rides the rail | Moves down the timeline rail as steps finish |
| A05 | Expressions | Neutral, talking, wink, tilt; blinks often; tilts a few degrees while moving |
| A06 | Returns large | For "Save this." and the outro |
| A07 | Becomes the profile picture | In the profile card where Follow is tapped |
| A08 | Inverted on dark | Light head on the dark aside |
| A09 | Ring when active | A thin ring appears round the head when it "clicks" |
| A10 | Appears as content | Style variants of the avatar shown as cards |

Ours (`../lib/avatar.js`): the full bust from `brand/avatar/avatar.png` for A01 and A06; a round head chip cut from the same file, with a paper edge and a warm shadow, for A02 to A04 and A07; a ring pulse on arrival (A09). Blinks and mouth shapes (A05) need the original character sheet and are not built yet.
