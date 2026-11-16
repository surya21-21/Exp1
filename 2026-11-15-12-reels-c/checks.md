# Checks: I made Claude study 12 viral reels, frame by frame

27 of 28 lines are pass or not applicable; **1 fail**.

| Check | Result | Measured | Note |
| --- | --- | --- | --- |
| Size | pass | 1080 x 1920 |  |
| Frame rate | pass | 30.00 fps |  |
| Length | pass | 41.80 s (planned 41.77 s) |  |
| Frame zero is not empty | pass | 4.5% of the first frame is ink or objects | readability of the promise: look yourself |
| Stillness | pass | longest stretch with nothing changing: 0.93 s | limit 1.5 s |
| Stillness outside the captions | FAIL | longest stretch where only the captions change: 2.13 s | limit 2.0 s; caption words alone do not count as motion |
| Frame in use | pass | content spans 60% or more of the usable height in 98% of frames | needs 80%; usable height is under the captions and above the app's buttons |
| Rhythm | pass | 1.67 picture changes a second | the 12 reference reels: 0.5 to 2.2 |
| Transitions present | pass | largest frame-to-frame change 0.141 | a hard change means a cut or wipe was drawn |
| Caption size | pass | 37 groups, largest 4 words, one-word groups: 5 | one-word groups are whole one-word sentences |
| Words from the first frame | pass | first caption at 0.0 s |  |
| Safe zone | pass | 635 boxes checked, 0 outside | key elements and captions, 5 times a second, outside transitions |
| Accent contrast on paper | pass | 4.52 to 1 for #c2381d | needs 4.5 to 1 |
| Captions below the top 14% | pass | 197 caption boxes, 0 above 268 px | Meta's published safe zone for 9:16 |
| Key elements in the lower 35% | n/a | 4 kinds reach below 1250 px: avatar, card, signoff, title | information: Meta's stricter ad zone; our limit is 1490 px |
| Smallest text | pass | 30 px ("STEP 01 / 04" at 8.2 s) | 30 px of 1080 is 11 points on a phone, Apple's stated minimum |
| Something on screen at frame zero | pass | avatar, counter |  |
| One effect a frame | pass | 57 cues, 0 frames with two |  |
| Loudness | pass | -14.4 LUFS | target -14 to -16 |
| Peak | pass | -1.9 dBFS | limit -1 |
| Voice matches the script | pass | word for word | captions and beats are only exact when the voice speaks the script as written |
| Voice pace | pass | 2.63 words a second, longest silence 0.42 s | limit 0.8 s of silence; references speak at 2.5 to 4.3 words a second |
| Voice | pass | present |  |
| Scene variety | pass | 8 different scene types in 8 scenes | needs at least 6 |
| No scene type twice in a row | pass | none repeated |  |
| Transition variety | pass | 7 different transitions: charHole, charLift, charPush, charTear, charThrow, charWhip, tear | needs at least 3 |
| No transition twice in a row | pass | none repeated | plain cuts may repeat |
| Signature outro | pass | last scene: cta | "Comment KEYWORD ... This is your AI guy." |

## Look yourself

- Frame zero: is the promise readable with the sound off?
- Does each scene carry something across the change (avatar, caption, progress tabs)?
- Facts: does every number match the fact table and its source?
- Truth: is every "I" statement true for you?
- Licences: voice, music and logos recorded?
