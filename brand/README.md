# Brand

Everything that makes a reel recognisably ours. Change a file here and the next
reel uses the change.

| Path | What it is | How to change it |
| --- | --- | --- |
| `brand-sheet.md` | What is locked, what is signature, what to avoid | Edit the tables |
| `avatar/avatar.png` | The avatar cut out on a transparent background | Replace the file with a new PNG of the same kind |
| `avatar/avatar-original-grey.png` | The same bust on its original grey | Reference only |
| `outro/outro.md` | The outro wording, timing and on-screen layout | Edit the text |
| `backgrounds/` | The four background options as stills, and `options.html` that draws them | Open `options.html?t=midnight&f=outro` (themes: midnight, graphite, blueprint, paper; frames: content, outro) |

The avatar was cut from a screenshot of the character sheet, so it is not full
quality. The original sheet with the separate eyes, eyebrows and mouths is on the
laptop; add it as `avatar/sheet.png` when it is back, and the mouth and blink rig
will be cut from it.

## Cursor heads

`avatar/heads/` holds six simplified heads (neutral, talk, blink, wink, grin, curious), cut from `avatar/heads-sheet.png` (Seedream 5 Flash in invideo, from `avatar/avatar.png`). The engine uses them for the small cursor avatar: blinking, talking with the voice, and grinning at the outro. The full bust in `avatar/avatar.png` is unchanged.

## Expression faces

`avatar/expressions/` holds nine calm faces (neutral, three talking mouths, blink, wink, interested, thinking, grin), cut from the approved `avatar/expressions-subtle-sheet.png`. The engine uses them for the large avatar (hook and "Save this"): it blinks and talks with the voice. The small cursor uses `avatar/heads/`.
