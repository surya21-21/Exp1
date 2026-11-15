# Brief: learn everything, build the collection, one-click reel

The instruction this repository's `collection/`, `studio/` and **Make reel** workflow were built from (15 Nov 2026). Run it again when new reference reels are added.

```
GOAL
Turn the reference reels into a library we can build our own reels from,
then make producing a reel one click.

PART 1 - STUDY EVERY REEL COMPLETELY
Measure every frame and every sound. For each reel record:
1. Cuts and transitions: every one, with time, length in frames, type,
   direction, speed curve, blur, what carries across, the sound on it.
2. Fast moves and effects inside a shot: pops, slides, counters, highlights,
   shakes, zooms, flashes.
3. Hooks: frame zero, each event in the first 3 seconds, the spoken line,
   the on-screen text.
4. Layouts: zones, fixed furniture, grids, safe areas.
5. UI pages and elements: cards, panels, toggles, counters, charts, chips,
   labels, stickers, icons, cursors.
6. Avatar use: sizes, positions, expressions, movement, the job it does.
7. On-screen script: wording, words per line, highlight style, timing.
8. Spoken script: full transcript, words per second, structure, CTA.
9. Sound: every effect labelled and matched to its visual event, the music,
   loudness against the voice.
Say plainly what was measured by code, what was looked at, and what could
not be done.

PART 2 - BUILD THE COLLECTION (Exp1/collection/)
One entry per learned thing: a recipe card (source reel and time, the
numbers, how to build it, when to use it) and, for anything we will reuse,
our own working code plus a rendered demo.
Store techniques and our own rebuilds only: none of the creators' frames,
audio, drawings, characters or logos, and no one-to-one copies of a design.
Add an "inventions" section: new effects and elements made by combining and
varying what was learned, in our Paper Studio brand.

PART 3 - ONE-CLICK REEL
A workflow that takes a topic or script and produces a finished reel using
reel-director, the brand folder and the collection:
script > storyboard > voice > captions > sound > build > render > checks.

TOOLS AND STANDARD
invideo with Seedream 5 Flash for character sheets and the cursor avatar
(seat credits only). ElevenLabs for voice and effects. GitHub Actions for
heavy work; nothing renders on the phone. The result must satisfy a
demanding professional editor. No step is skipped; blocked steps are named.
```

## How to run the study again

1. Picture: `python collection/tools/catalogue_events.py VIDEO --study STUDY_JSON --onsets ONSETS_CSV --out DIR --id rNN` (the study and onsets files come from `scripts/study_reference.py`).
2. Sound and speech: the `study-audio` workflow in the private journal repository (Demucs, Whisper, LAION-CLAP, PANNs). Reference audio is uploaded there only for the run and deleted afterwards.
3. Add what is new to `collection/recipes/`, build anything reusable in `collection/lib/`, render a demo.
