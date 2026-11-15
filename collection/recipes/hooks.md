# Hooks

What the first 3 seconds do in each of the 12 reels. Every frame of the first 3 seconds was measured; the pictures were looked at 10 frames a second; the spoken words and their timing come from the transcripts. "Picture changes" counts the bumps in the frame-difference curve: each is something arriving, moving or cutting.

## The 12 openings

| Reel | Spoken shape (first sentence) | Words spoken by 3 s | What is on screen by 1 s | Picture changes in first 3 s (measured) |
| --- | --- | --- | --- | --- |
| r01 | A feeling the viewer has: doing X alone is lonely | 6 | Keyboard and hands slide in, a pixel title assembles | 15 (drawn on every 6th frame) |
| r02 | "This is a rule every [audience] needs to know" | 10 | Small text on black with one word highlighted, then a light burn to a photo grid | 5 |
| r03 | "[Tool] makes great A, but the B..." (trails off) | 8 | A revenue counter racing inside a dashboard; a "free ... at the end" badge pinned from frame 0 | 3 |
| r04 | "[Tool] can now do X for you, up to N times a day" | 14 | A bar chart of view counts already racing | 8 |
| r05 | "This brand new [thing] lets you run X on autopilot" plus a four-word list | 13 | Logo cards; a toggle flips ON at the word "autopilot" | 5 |
| r06 | "The fastest way to hit [big number] as a [who] in [year]" | 11 | A counter racing to the number with a rising line | 10 |
| r07 | The problem and its cause in one breath (Hindi) | 10 | Style posters flashing at about 0.2 s each, then a stamp | 8 |
| r08 | "You can now build an entire X without paying for a single Y" | 10 | A subscriber counter racing on a rebuilt channel page | 5 |
| r09 | "Everyone is doing X now, but most people lock it behind a course" | 11 | Avatar alone, then a live counter chip, then a paid checkout card | 2 |
| r10 | "Stop using X without these five Y" | 8 | Fixed title, avatar, five tool tiles joining by lines | 5 |
| r11 | "I turned X into my personal Y, and I don't think I'm going back" | 11 | Avatar, then a staff badge on a lanyard drops in | 5 |
| r12 | Two words that reject the common advice, then "you need these six settings" | 12 | Hashtags around the avatar struck out and falling; a views chip counting | 2 |

## Hook kinds (H01-H10)

| ID | Kind | Reels | Recipe |
| --- | --- | --- | --- |
| H01 | Number already running | r03, r04, r06, r08, r09, r12 | On frame 0 a counter or chart is mid-run. It lands on the claimed number as the sentence ends. Never start from a still zero. |
| H02 | Enemy on screen | r08, r09, r12 | Show the thing the viewer resents (a price, a paywall, a tired tip) and strike it out within 2 s. |
| H03 | Object that is the claim | r05, r11 | One physical object stands for the promise: a switch for "autopilot", a staff badge for "my editor". It acts on the key word. |
| H04 | Montage then verdict | r07 | 6 to 8 one-frame-wide ideas flash at 0.2 s each, then a stamp gives the verdict. |
| H05 | Small then burst | r02 | Tiny text on an empty frame for 1.5 s, then a light burst into a full picture. |
| H06 | "Stop doing X without Y" list | r10 | The title stays fixed for the whole reel; the items appear and connect while the sentence is spoken. |
| H07 | Rule or secret | r02 | "A rule every [audience] needs to know", then the name of the rule alone on screen. |
| H08 | Problem, then "but" | r03, r09 | First half states what everyone knows, the "but" opens the gap the reel fills. |
| H09 | Feeling first | r01 | Name the viewer's feeling in six words while the scene assembles. |
| H10 | Time promise | r09 | "Give me 60 seconds and I will show you the whole thing" right after the hook. |

## Rules that hold across the set

1. Speech starts on frame 0 in all 12. No intro, no logo, no greeting.
2. 6 to 14 words are spoken in the first 3 seconds (middle value 10 to 11).
3. The picture changes 2 to 10 times in the first 3 seconds (middle value 5). The two calmest openings (r09, r12) are the avatar alone, and both add a counter chip before 3 s.
4. The promise stays on screen as a fixed title or badge after the hook in 4 of 12 (r03, r07, r08, r10).
5. A number is on screen as a counter or chart in the first second of 6 of 12, and the tool is named in the first sentence of 7 of 12.
6. One reel (r03) pins a bonus on screen from frame 0 and pays it at the end; one (r09) makes a time promise.

## Our use

- Default hook for the channel: H01 with H02 or H03 as the second event, on Paper Studio, avatar large for the first second then down to cursor size.
- Every number in a hook needs a named source in the fact table before it is used.
