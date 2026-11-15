# Layouts and UI

Where things sit, the furniture that never moves, and the interface pieces the 12 reels rebuild. From the one-frame-a-second sheets of every reel and the event strips.

## Layouts (L01-L10)

| ID | Layout | Reels | Recipe |
| --- | --- | --- | --- |
| L01 | Three zones | all | Top fifth: caption or headline. Middle: the card or object. Lower middle: avatar or a second card. Nothing important in the bottom fifth (app buttons cover it). |
| L02 | Brand chip, top centre | r04, r05, r06 | A small pill with the product name that never moves through every wipe. |
| L03 | Header strip and day scale | r04 | Label left, "DAY 01" right; along the bottom a scale with a moving marker and a flag at the goal. |
| L04 | Giant faint numeral | r04 | The step or day number set huge and pale behind the content, on cream paper with soft shadows. |
| L05 | Progress dots in a pill | r12 | One dot per item; the current one filled. Built from the hook's own objects. |
| L06 | Step number and name row | r10 | "05  Tool name" on one line above the card, same place every step. |
| L07 | Timeline rail on the left | r09 | A thin vertical line with a pill per step; a marker rides down it as the page scrolls. |
| L08 | Section pill, top left | r03 | Names the demo being shown ("A product launch"). |
| L09 | Centred card with a fixed caption bar | r08 | One card in the middle of a calm stage; captions sit in a bar under it that never moves. Two-line title: small italic serif above bold capitals. |
| L10 | Gallery of pedestals | r07 | Each list item is an exhibit with a number plaque; the camera moves between them. |

Dark and light: r05 and r06 alternate the background each beat; r10 to r12 switch to dark for one aside and return.

## UI pieces (U01-U26)

All are rebuilt, simplified drawings of real screens: rounded corners, a 1 px border, a soft shadow, only the 3 to 6 rows that matter, grey bars standing in for the rest.

| ID | Piece | Reels | Notes |
| --- | --- | --- | --- |
| U01 | App card | most | The base container for everything below |
| U02 | Dashboard | r03 | Big number, a few bars, two or three stat chips |
| U03 | Settings list with switches | r12, r05, r06 | One row outlined at a time; the switch flips on the word |
| U04 | Checkout card | r09 | A price, a pay button; used as the enemy |
| U05 | Repo or browser card | r08 | Address bar, title, star count |
| U06 | Terminal | r08 | Three or four lines, a progress bar, a file chip at the end |
| U07 | Prompt box | r08, r09, r11 | Text types in; a round send button |
| U08 | Profile card | r05, r06, r09-r12 | Picture, name, counts, Follow button that gets tapped |
| U09 | Dialog with two buttons | r11 | Over a dimmed scene |
| U10 | ID badge on a lanyard | r11 | Swings in from the top |
| U11 | Checklist | r11 | Ticks arrive one per spoken item |
| U12 | Tool tile | r09, r10 | Logo in a rounded square with a label under it |
| U13 | Hub and spokes | r09, r10 | Tiles joined to a centre by thin curved lines |
| U14 | Audio timeline | r03 | Tracks with blocks and a playhead |
| U15 | Phone frame | r05, r06 | Holds a feed or a reel |
| U16 | Style-card carousel | r11, r07 | The same subject in several looks |
| U17 | Keycap letters | r04, r05, r08 | The comment keyword as raised square keys |
| U18 | Comment field | 9 of 12 | The keyword types in; a send arrow |
| U19 | Message card | r09 | "Sent you the link" style notification |
| U20 | Folder tree | r09 | Three subfolders appear one by one |
| U21 | Status pill | r08, r09 | "SCRIPT DONE", "Ready for review" |
| U22 | Live counter chip | r09, r12 | A red dot and a number that ticks |
| U23 | Raised keyword tile | r04 | One word as an embossed block |
| U24 | Number plaque | r07 | Small plate with the item number |
| U25 | Chart card | r04, r06 | Bars or a line that draws on |
| U26 | Price list | r08 | Rows of paid tools, struck out one by one |

## Handling rules seen in every reel

1. One highlight at a time: an outline, a switch, a magnifier, or the avatar. The viewer never has to search.
2. Every claim is shown as a state change: a switch turns on, a box is ticked, a bar fills, Follow becomes Following, a counter lands.
3. Real detail reads as proof: file names, folder names, the exact prompt text, the real settings path.
4. Progress is always visible (dots, numbers, a rail or a scale).

## Our versions

Built in `../lib/elements.js` on Paper Studio cards (cream card, warm brown shadow, near-black ink): `card`, `rows`, `toggle`, `counter`, `chip`, `stamp`, `strike`, `badge`, `tiles` with `connect`, `typeIn`, `commentField`, `keycaps`, `profileCard`, `barRace`, `lineChart`, `progress`, `bigNumeral`, `sticky`, `tape`. Logos are only ever placed from official files in `logos/`; a tile without a file shows the name in type.
