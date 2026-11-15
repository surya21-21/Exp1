# Sound

From the audio of all 12 reels. The voice was separated from the music and effects (Demucs), every sound start in the music-and-effects track was found (up to 200 per reel, strongest first), and each one was labelled twice: by LAION-CLAP against our word list and by PANNs. The labelled sounds were then matched to the 210 catalogued picture events.

**How far to trust this.** 1,621 sound starts were labelled. CLAP marked 783 of them (48%) as unsure, and many starts are beats of the music, not effects. Nobody has checked the labels by ear: this workspace cannot play audio. Treat the timing and loudness numbers as measured, and the names of the sounds as a first pass.

## What is solid

| Finding | Number |
| --- | --- |
| Picture events with a sound starting within 3 frames | 103 of 210 (49%) |
| Where that sound starts | 51% at least half a frame before the picture change, 15% on the same frame, 34% after; middle value half a frame early |
| Most common label on a cut or wipe | swoosh (16 of 29 on the two kinds of cut-with-settle; 44% of all matched cuts) |
| Most common on a move inside a shot | whoosh, then swoosh, then slash |
| Sound starts shaped like a whoosh (slow rise, noisy) | 878 of 1,621 (54%) |
| Shaped like an impact (instant, low) | 259 (16%) |
| Shaped like a pop | 75; like a riser 66 |
| Music under the reel | detected in 11 of 12 (not in r04, which is voice and effects only) |

### Sound by kind of picture event

| Picture event | Events | With a sound | Most common label | Sound starts (frames, minus = early) | Loudness against the voice |
| --- | --- | --- | --- | --- | --- |
| Lead-in, cut, settle (the pixel wipe and its relatives) | 41 | 19 | swoosh | -0.7 | -9 dB |
| Build or move in place | 33 | 19 | whoosh | -0.5 | -5 dB |
| Pull-out | 23 | 15 | swoosh / whoosh | -1.4 | -6 dB |
| Two-step transition | 20 | 9 | slash | -0.7 | -4 dB |
| Small camera move | 18 | 9 | mixed | +1.1 | 0 dB |
| Slide up (page scroll) | 16 | 5 | whoosh | +1.3 | -13 dB |
| Hard cut | 15 | 5 | swoosh | +1.4 | -8 dB |
| Cut, then settle | 14 | 10 | swoosh | -0.7 | -15 dB |
| Slide left | 13 | 4 | whoosh | -1.6 | -9 dB |
| Push-in | 10 | 5 | mixed | 0 | -1 dB |

Reading it: wipes and pull-outs nearly always carry a soft swoosh that starts a frame early; calm page scrolls and plain hard cuts usually carry nothing; pushes and small camera moves get a harder, louder hit.

### Music and effects against the voice

| Reel | Music and effects level against the voice | Family |
| --- | --- | --- |
| r04, r05, r06 | -21 to -23 dB | Wall of words: the voice is far on top |
| r07, r09, r10 | -17 to -24 dB | Tutorial |
| r01 | -11 dB | Mood |
| r02, r08, r11, r12 | -5 to -6 dB | Music-forward |
| r03 | -1 dB | A reel about sound, with stretches of no voice |

Louder single sounds: stamps, impacts and glitches peak 3 to 4 dB above the voice for a moment; swooshes sit about 10 dB under it, ticks about 17 dB under.

Other notes from the tags: r02's music is mallet percussion (marimba or vibraphone); r08 uses bell-like dings on its counters; r03 includes a glass-shatter hit; r09, r10 and r12 share one tempo estimate (152), which suggests the same track or the same template.

## Our sound rules

1. Not every move gets a sound: about half. Give one to every transition and to the one or two moves in a scene that carry the point.
2. Start the sound 1 frame before the picture change.
3. Transitions: a soft swoosh about 10 dB under the voice. Our paper tear uses its own tearing sound in that slot.
4. State changes (a switch, a tick, a key): a short click or pop about 12 to 17 dB under the voice.
5. One hit a scene at most (stamp, sticky-note slam, counter landing), allowed up to the level of the voice.
6. Music 20 dB or more under the voice for talking reels; never two effects on one frame.

## Our sound set (`scripts/make_sfx.py`, all made from noise and sine waves, nothing to license)

| Sound | Used for |
| --- | --- |
| `tear` | Paper tear wipe (N01) |
| `stamp` | Rubber stamp (N08) |
| `scratch` | Pencil underline and strike (N10) |
| `swoosh`, `whoosh` | Shuffle, whip, page scroll, the avatar changing size |
| `pop`, `click`, `tick` | Rows, switches, keys, counters, typing |
| `impact` | Counter landing, sticky-note slam |
| `riser` | Ramp into a cut |

The engine writes the cue list itself (`window.CUES`), from the same code that draws each event, so a sound cannot drift from its picture.

Raw data: `../data/<reel>/sfx-map.csv` holds only the 146 sounds that land on a picture event (within 3 frames of a cut, wipe or move), with time, both labels, shape and loudness. The other labelled sound starts, mostly beats of the music, were discarded as not useful. `audio-summary.json` has the per-reel totals.
