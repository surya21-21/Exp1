---
name: "reel-director"
description: "Use for any reel or short video for the user's channels: runs the whole research-to-render pipeline with proof at every stage and routes to the other video skills."
---

# Reel Director

One entry point for making a reel. It owns the order of work, the proof each stage must leave behind, the craft rules, and which other skill does which job. Load this first for any request to research, script, storyboard, animate, voice, score, render or review a short video.

## Rules that never bend

1. **No stage is skipped, merged or done "in your head".** Each stage writes its evidence to the run ledger before the next stage starts. If a stage cannot be done (a tool is missing, a site is unreachable, a credit limit is hit), write `BLOCKED: <reason>` in the ledger, tell the user in plain words, and stop or continue only with what is honestly possible. Never fill a gap with invented data.
2. **Two human gates.** The user approves the storyboard before any full render, and the user presses post. Everything else runs without asking.
3. **Nothing renders on the user's phone or device.** Test frames in the cloud workspace; full renders on GitHub Actions or the Linux server.
4. **Every on-screen number has a named product and a source link**, checked on the day of the render. Repo star counts are fetched live at render time.
5. **Every "I" statement is true for the user.** Ask; do not invent a personal story.
6. **Every asset has a licence line** (voice, music, each sound, fonts, logos, any clip). Logos are the official files from the brand's own repo or page, never redrawn.
7. **The user locks what they choose; the craft rules decide everything else.** Only items on the Locked list of the brand sheet are fixed. Every other look and editing choice is made per reel by the craft rules in this skill, with the reason written down. Other skills contribute tools and method; their house palettes and defaults rank last. See "Look: locked and open".
8. **Never promise reach.** Scores are pattern-based estimates. Say so.

## Where things live

| Thing | Place |
| --- | --- |
| Run ledger and all outputs of one reel | `runs/<yyyy-mm-dd>-<slug>/` in repo Exp1 (`ledger.md`, `research.md`, `script.md`, `storyboard/`, `audio/`, `frames/`, `out/`) |
| Style guide learned from reference reels | `docs/reel-style-guide.md` in Exp1 |
| Reference videos and their analysis | `References/<name>/` (video, burst strips, transcript, numbers, `sfx-map.csv`) |
| Finished videos | `Exports/` |
| Brand folder: brand sheet (Locked, Signature, Avoid lists), avatar, outro, background options | `brand/` in Exp1: `brand-sheet.md`, `avatar/avatar.png`, `outro/outro.md`, `backgrounds/` |
| Official logos | `logos/` |
| Live repo counts | `data/stars.json`, written by the workflow step before render |
| Editing notes, script notes | the user's memory files for editing and script material |
| Daily journal (what the user did, tried, broke, learned) | `journal/<yyyy-mm-dd>.md` in a private repo, never in a public one |
| Collection: every learned transition, move, hook, layout, UI piece, caption style, avatar use, script structure and sound finding, with our own effect code | `collection/` in Exp1 (`recipes/`, `lib/`, `demo/`, `data/`) |
| Reel engine and reel files | `studio/` (engine) and `reels/<yyyy-mm-dd>-<slug>/` (`reel.json`, `script.md`) in Exp1; format in `reels/README.md` |

## Which skill does which job

Load the named skill at the stage shown. If a skill is not installed in the current environment, say so in the ledger and use the fallback.

| Job | Skill or tool | Fallback |
| --- | --- | --- |
| Trend and hook pass, hook scoring rubric | `invideo-director` (its virality reference); vidIQ connector if connected | Web search, labelled as thinner data |
| Hook critique and rewrite | `hook-master` (router for its nine skills: viewer-panel, the-council, four-failures-check, hook-formats, niche-tuner, viral-scout, visual-match, lock-in) | The hook patterns and rubric in Stage 3 |
| Art style for a reel, scene or element | Lemo-Opuscar style library (99 coded film styles in 15 families) | The shading and look rules below |
| Labelling sound effects in reference reels | LAION-CLAP (labels a clip from the user's own word list) with PANNs (`panns-inference`, finds when sound events happen) | Onset detection with ffmpeg or librosa, then label by listening notes and spectrogram shape, marked "unverified" |
| Reference deconstruction (energy map, cuts, stillness, motion) | `onetake` `scripts/analyze_ref.py` | ffmpeg scene detection plus sampled frames and Whisper |
| Motion vocabulary, carry between beats, camera operation | `onetake` references (rhythm, composition, motion library, 3d) | The craft rules below |
| Composition and render | The Exp1 reel engine (`studio/` with `collection/lib`), run by the Make reel workflow; HyperFrames or Remotion skills when the user asks for them | Plain HTML plus headless Chrome plus ffmpeg |
| Render hygiene (one file per scene, concat, test frames first) | `video-making` | Same rules, restated in Stage 8 |
| ffmpeg commands and filtergraphs | `ffmpeg-llm` skills | Write the command by hand, test on 2 seconds |
| AI-generated footage or b-roll prompts | `invideo-director` | None; skip generated footage |
| Captions and word timings | Whisper; Remotion captions skill when in Remotion | ElevenLabs transcription |
| Voice, sound effects | ElevenLabs connector | Code-generated SFX set in Exp1; open-source TTS |
| Script pack the user reads and comments on | `docs` | A markdown file in the run folder |
| Automated quality check | `onetake` `scripts/verify_promo.py` | The measurable gates in Stage 9 |

Licence note: `onetake` is free for noncommercial use only. Once a channel is monetised or sponsored, do not run its code for that channel's reels unless the user has permission from its author; use the fallbacks.

Not part of this pipeline unless the user asks for that style: `clawd-animation-base` (hand-painted cartoon), `gbro-collage-broll` (paper-collage b-roll).

## Collection and engine

The collection in Exp1 is the first place to look for any effect, layout or structure; the engine is the default way to build and render.

- Stage 2: after studying a new reference, add what is new to `collection/recipes/` with its measured numbers, and build anything reusable in `collection/lib/` with a demo still. Store techniques and our own code only, never a creator's frames, audio or script.
- Stage 4: take the structure and pace from `collection/recipes/script.md` and the hook kind from `hooks.md`; name the IDs used.
- Stage 5: write the reel as `reels/<date>-<slug>/reel.json` (scene types, props and transitions are listed in `reels/README.md`) and `script.md` with the fact table and look card. Run the Make reel workflow with "storyboard stills only" for the stills.
- Stage 6: the engine writes the sound cues itself; follow `collection/recipes/sound.md` (about half the moves get a sound, one frame early).
- Stages 7 to 9: run the Make reel workflow with "finished reel". It plans the timing from the voice, renders every frame, mixes the sound and writes `checks.md`. A FAIL in that table is fixed and re-run, or reported.
- A new effect is first added to the collection (recipe, code, demo still), then used. Each reel may have one hero invention.
- If a reel needs a scene type the engine lacks, add it to `studio/scenes.js` and the table in `reels/README.md` rather than working around it.

## The pipeline

Start every run by creating `runs/<date>-<slug>/ledger.md` with the ten stage names as unchecked items. Tick a stage only when its evidence exists. The final message to the user lists each stage with one line of evidence or its BLOCKED reason.

### Stage 0 - Brief
Read `brand/brand-sheet.md` and `brand/outro/outro.md` first and copy the Locked, Signature and Avoid lists and the outro wording into the brief. Collect or assume, and write down: channel, one promise ("the viewer leaves knowing X"), audience, language, platform and size (default Instagram Reels, 1080 x 1920, 30 fps), target length, the true personal facts available, the CTA keyword.
Evidence: `brief.md`.

### Stage 1 - Trend and topic research
- Pull what is rising in the niche this week and 3 to 5 outlier videos (views far above the channel's average). Record the date of the data and its source.
- For each outlier: hook line, first-frame visual, structure, length, on-screen text, CTA.
- Extract the mechanism, never the script. Write an original angle.
- Read the journal: yesterday's entry first, then earlier days when a topic needs more. Pull post ideas from what the user actually did, tried, got wrong and learned. The channel covers using Claude Code for edits and motion, how to use other AI apps such as Higgsfield, the user's mistakes, and their journey. A script may combine several days into one story; every personal claim must come from a journal entry or from the user.
Evidence: `research.md` with links and dates, and the journal entries used, by date. If only web search was available, say so at the top. If there is no journal entry for recent days, say so and ask the user what they did.

### Stage 2 - Reference study
- Use the reels the user supplied. A link is fetched by the yt-dlp step in the Exp1 workflow; if the platform blocks it, ask the user to upload the file. Reference videos are for study only and never re-uploaded or reused as footage.
- **Sample by motion, not by the clock.** A frame every 0.5 s misses anything shorter than half a second, which is most transitions, text pops and effects. Fixed sparse sampling is only for calm stretches.
  1. Decode every frame of the source at its own frame rate for measurement. Compute the frame-to-frame difference curve and detect cuts on all frames.
  2. Keep every frame of the first 3 seconds.
  3. Around each cut, each peak in the difference curve and each audio onset, keep every frame from 0.5 s before to 0.5 s after. This is a burst.
  4. In calm stretches, 2 frames a second is enough.
  5. View each burst as a strip of 8 to 12 consecutive frames in order, never as single frames, so the motion can be read.
  6. For each burst record: what kind of transition or effect it is, its length in frames, direction of travel, how it speeds up and slows down (track position or scale across the frames), overshoot or bounce, blur or smear, what element carries across, and the sound that lands on it.
  7. For text: frames per word entry, pop size and settle time, measured the same way.
- Limits to state in the notes: nothing shorter than one source frame can be seen, and compression smears fast motion, so very fast effects are described as best estimates.
- **Label the sounds.**
  1. Reduce the voice and music so effects stand out (duck the voice using its Whisper word timings; a source-separation tool if one is installed).
  2. Find sound onsets across the whole track (PANNs event detection, or plain onset detection).
  3. Cut a clip from 0.1 s before to 0.6 s after each onset.
  4. Label each clip with LAION-CLAP against the user's own word list: whoosh, swoosh, pop, click, tick, impact, riser, glitch, stamp, slash, chime, typing, shatter, servo. Add a word to the list when a sound fits none of them.
  5. Keep the top label and its score. Below a clear margin over the second label, mark it "unsure".
  6. Match each labelled sound to the visual event on the same frame from the burst notes (cut, element lands, counter, strike-through, text pop).
  7. Write `sfx-map.csv`: time, label, score, visual event, loudness relative to the voice. Summarise as "which sound on which event, how often".
  8. Spot-check: the user or a second pass confirms at least 10 labels per reel by ear before the map is trusted. Model labels are a first pass, not truth.
- Also measure: shot lengths, share of still time, caption position and words per line, words per second, colours.
- Add what is new to `docs/reel-style-guide.md` and the user's editing notes.
Evidence: numbers file, difference curve, burst strips and `sfx-map.csv` in `References/<name>/`. With no new reference, write "no new reference; using style guide of <date>".

### Stage 3 - Hooks
- Write at least 5 hooks across different patterns (specific number, demonstration first, contrarian, curiosity gap, stakes, in medias res, question).
- When `hook-master` is installed, run it on the draft hooks in its own order: four-failures-check (delay, confusion, irrelevance, disinterest), viewer-panel (six simulated viewers say swipe or stay), the-council (top three changes), hook-formats (rewrite in its six formats), niche-tuner, visual-match (opening shot, on-screen text and spoken words agree), then lock-in (the 1 to 3 sentences after the hook). Paste its verdicts into the ledger. It never invents stats; neither do you.
- For each: the spoken line, the frame-zero visual, the muted-readable text.
- Score each 0 to 2 on: clear in under 3 s, one idea, works with sound off, payoff promised and delivered, reason to finish. Keep the top 3 for the user; pick one and say why.
Evidence: hook table in `script.md`.

### Stage 4 - Script
- Voiceover at 3.0 to 3.6 words a second; count words and compute duration with code, not by feel.
- Structure: hook (0 to 3 s), open loop (by 5 s), first payoff by about 30% of the runtime, pattern interrupt near the midpoint, save or send prompt at 50 to 65%, second loop paid off, total or reveal, CTA in the last 3 to 5 s, last frame that loops into the first.
- Plain words. Any sentence the user might not understand on first hearing is rewritten.
- A fact table: every claim, its number, the named product, the source link, the date checked.
- Pronunciation list for the voice model.
Evidence: `script.md` with word count, timing table and fact table.

### Stage 5 - Storyboard (GATE 1)
- Shot table: time, voiceover, on screen, camera or 3D, transition out, sound.
- Name the 2 or 3 hero moments (the complex or 3D scenes) and what carries across every scene boundary.
- Write the look card (see "Look: locked and open"): every open choice for this reel with a one-line reason. Include the art style: one base style and at most two guest styles for hero moments, from the style library.
- Render still frames at full size for frame zero, each hero moment, the interrupt and the CTA. Check them against the safe zones in the Instagram app layout.
- Publish the script pack and stop. Do not render the full video until the user approves.
Evidence: stills in `storyboard/`, link to the pack, the user's approval quoted in the ledger.

### Stage 6 - Audio
- Voice: generate in blocks, one block per generation. Then run Whisper for word timings.
- Sound effects: build the event list from the shot table, map each event class to one sound (table below, refined by the latest `sfx-map.csv` findings), generate or reuse.
- Music: royalty-free, 100 to 110 BPM for 3-second cuts, licence and credit line recorded.
- Mix: voice loudest; music about 20 dB under voice and ducked further under hits; effects 6 to 10 dB under voice; no two effects on one frame; integrated loudness about -14 to -16 LUFS, true peak under -1 dBTP.
Evidence: files in `audio/`, `licences.md`, measured loudness.

### Stage 7 - Build
- One composition where every value is a function of time, so any frame can be drawn alone and twice the same. No randomness on the render path without a fixed seed.
- Apply the craft rules below: lighting and shading, camera, type, captions, avatar acting.
- Build each scene from the approved look card, reading the chosen style's own files in the Lemo-Opuscar repo before writing code. Locked items are used exactly as given.
- Fetch live data (`data/stars.json`) in the workflow, not by hand.
Evidence: the composition files committed, plus a contact sheet of 12 frames across the timeline.

### Stage 8 - Render
- Before the full render: draw the busiest frames at full size and look at them.
- One encoded file per scene, same size, frame rate and encoder settings; join with the concat demuxer and stream copy; add sound with video stream copy.
- Draft at 1080 x 1920, 30 fps. Tell the user the time estimate before a long render.
- Test one 3D scene alone first to learn how long the runner takes.
Evidence: `out/draft.mp4`, render log, duration and file size.

### Stage 9 - Quality check
Run every check and record pass or fail with the measured value. A fail is fixed and re-checked, or reported; it is never waved through.

| Check | Pass condition |
| --- | --- |
| Frame zero | The promise is readable muted and paused |
| Stillness | No stretch over 1.5 s with nothing changing, except deliberate rests |
| Rests | At least one deliberate near-still beat |
| Rhythm | Longest shot at least 4 times the shortest; shot lengths not uniform |
| Carry | Something on screen survives every scene boundary, except hard-cut bursts and the end card |
| Captions | 2 to 4 words at a time, in sync within 2 frames, inside the safe zone |
| Contrast | Text against its background at least 4.5 to 1 |
| Light | One consistent key-light direction in every scene |
| Locked items | Every item on the Locked list appears exactly as given |
| Signature | The avatar and the signature motif are present and unchanged |
| Look card | Every open choice in the render matches the approved look card |
| Fast moves | Anything over 80 px a frame has motion blur |
| Audio | No clipping, never fully silent except the planned drop, voice clearly on top |
| Facts | Every number matches the fact table; live counts present with an "as of" date |
| Truth | Every personal claim confirmed by the user |
| Licences | `licences.md` complete |
| Loop | Last frame flows into the first |

For high-stakes reels, have a fresh agent that has not seen the build watch the contact sheets and the draft and list problems.
Evidence: the filled table in the ledger.

### Stage 10 - Deliver and learn
- Send the draft, the caption, 3 cover texts, hashtags and the pinned comment.
- Write the day's journal entry (see "Journal").
- After posting, record what the user reports: 3-second hold, average watch time, saves, sends, comments on the keyword. Compare with earlier reels and write one line on what to change next time into the style guide.
Evidence: `out/` files and a `results.md` once numbers exist.

## Look: locked and open

The user decides what is fixed. The craft rules decide the rest, reel by reel.

**Order of authority**
1. What the user says in the current request.
2. The Locked and Signature lists in `brand/brand-sheet.md`.
3. The craft rules in this skill.
4. House styles and defaults of other skills and libraries.

**Fixed on the user's instruction.** The avatar and the signature motif stay constant in every reel.
- Avatar: `brand/avatar/avatar.png`, used as given; it takes each scene's light direction and shadow but is never redrawn or restyled.
- Motif: the outro in `brand/outro/outro.md`. The ask comes first ("Comment KEYWORD and I'll send you the links."), then the sign-off "This is your AI guy." as the very last line, with the avatar on screen. Only the keyword changes between reels.
- Background: chosen by the user from `brand/backgrounds/`. Until `brand/brand-sheet.md` names one, ask before the first storyboard and do not guess.
- The user edits these files directly. Always read the current files; never rely on an earlier copy.

**Open choices.** Anything not on the Locked or Signature lists is open, and the director chooses it for each reel from the content: accent colour, caption colour and style, caption position, typefaces, editing style, transition family, art style, light plan, sound material and music mood. A brand sheet with only a background, the avatar and a motif on it is valid; everything else is then open.

**How to choose**
- Accent colour: one per reel. It must stand clear of the locked background, and any text in it must reach 4.5 to 1 contrast. Pick it for the feeling of the topic, then test it on a still frame.
- Caption colour: the highest-contrast neutral against the background for sentences, the accent for the one keyword per line.
- Typefaces: two at most, chosen for the voice of the reel (blunt and bold for claims, lighter for calm explainers).
- Editing style, from the content: lists and price reveals take fast cuts and hits; "how it works" takes one canvas with elements morphing in place; a story or mistake takes slower shots with real rests.
- Transition family and art style: one family per reel, matched to the editing style and the style library table.
- Sound material and music: match the editing style; fewer, softer sounds for calm reels.

**The look card.** At Stage 5, write each open choice with a one-line reason and show it on the storyboard stills. The user approves or changes it at Gate 1. After approval it is fixed for that reel.

**Memory across reels**
- Signature: never change the avatar or the motif silently. Propose a change and wait for the user.
- Avoid: when the user rejects a look, record it in the Avoid list and do not offer it again.
- The user can move any item between locked and open at any time.

## Craft rules

Each rule is tagged with where it comes from: **[measured]** from the user's own reference reels, **[craft]** established editing practice, **[research]** published learning research, **[claimed]** widely repeated industry figures with no checkable data. Prefer the first three when they conflict with the last.

### Direction and taste
- [craft] Murch's order of priority for any cut or transition: emotion first, then story, then rhythm, then where the eye is, then screen direction, then spatial continuity. When something must give, give up the last ones first. A move that looks clever but dulls the feeling is wrong.
- [craft] One idea per shot, one focal point per frame. If two things move, one is the subject and the other is quiet.
- [craft] Eye-trace: the next element appears where the viewer is already looking, or a motion leads the eye there first.
- [craft] Contrast makes emphasis: big next to small, fast next to slow, loud next to quiet. Uniform intensity reads as noise.
- [craft] Carry, do not replace: a subject, a container or the camera survives each boundary and becomes the next scene.
- [craft] The cause is visible: things react to a hand, a cursor, a hit, the avatar's glance. Nothing moves for no reason.
- [craft] Restraint: one background, one accent, two typefaces, one sound material set.

### Retention
- [measured] Something changes about every 0.2 s (a caption word or a visual), a new visual element every 1 to 1.5 s, nothing frozen beyond 1 to 2 s, voice at 3 to 4 words a second with no audible pauses.
- [measured] Cuts or wipes about every 3 s in fast reels; calm one-canvas reels never cut and morph elements in place.
- [craft] The first 3 seconds decide distribution on Reels; open on the strongest line and picture, never a logo or title card. Put the spoken hook on screen for muted viewers.
- [craft] Open a loop early, pay it off, open the next before the first closes.
- [craft] Design for the send and the save: a named list with prices is save material; "send this to the friend who still pays for X" is a send prompt.
- [claimed] Something new every 6 to 8 s, an interrupt near 50%, a forward hook near 70%, CTA at 85 to 90%. Use as starting points and replace with the user's own numbers once reels are posted.
- [craft] Do not repeat the same interrupt type twice in one reel. Silence and stillness are interrupts too.

### Clarity (from multimedia learning research)
- [research] Coherence: cut anything that does not serve the one promise.
- [research] Signaling: highlight, underline or point at the thing being talked about.
- [research] Temporal contiguity: the picture for a word appears with that word, not after it.
- [research] Spatial contiguity: labels sit next to what they label.
- [research] Redundancy: full sentences on screen while the same sentences are spoken overload the viewer. Captions stay to 2 to 4 words with one keyword stressed; they are there for muted viewing and emphasis.
- [research] Personalization and voice: conversational wording and a natural-sounding voice.
- [research] Segmenting: numbered beats with a visible progress bar.

### Camera
One move per shot, always motivated, always eased, and it lands just before the key word.

| Move | Use it for |
| --- | --- |
| Slow push-in (about 4% over the shot) | Default on every shot so nothing is frozen |
| Punch-in (6 to 10%, 4 to 6 frames) | The key word or the price |
| Pull-out | A reveal or showing the whole system |
| Orbit (15 to 30 degrees) | Showing off a 3D object or the exploded frame |
| Whip pan or whip up | High-energy scene change; needs motion blur and a whoosh |
| Push through (into a card until it is the scene) | Carrying into the next scene |
| Rack focus | Moving attention between depth layers without a cut |
| Tilt or pedestal | Following something that falls or rises |
| Small roll (3 to 5 degrees, back within 8 frames) | The mistake or surprise beat |
| Handheld float (slow two-sine drift) | Life in long holds; zero during hard rests |

A chasing camera keys the subject about 0.1 s ahead and never lets it leave frame. CSS perspective between 1200 and 1800 px looks natural; under 600 px distorts.

### Depth, light and shading (the 3D look)
Flat fills are the main reason code-made video looks cheap. Every scene follows one lighting plan.

1. **One light plan per reel.** Key light from the top-left, a dim cool fill from the right, an accent-coloured rim from behind. Every gradient, highlight and shadow agrees with it.
2. **No flat surface.** Each card, tile and panel gets a gradient about 8 to 15% lighter toward the key and darker away from it.
3. **Shade the dark side.** The parts facing away from the key get a darker tone of the same hue, never grey and never pure black. Tint shadows toward the background colour.
4. **Two shadows per object.** A contact shadow (tight, dark, small blur, right under the object) and an ambient shadow (wide, soft, low opacity), both thrown away from the key. As an object lifts, the contact shadow fades and the ambient one grows and softens.
5. **Ambient occlusion.** Darken where surfaces meet: the base of a card on a floor, inner corners, the crease behind an overlapping layer.
6. **Edge light.** A one-pixel lighter line on key-side edges; an accent rim on the far edge of hero objects to lift them off the dark background.
7. **Specular sweep.** A soft highlight band crosses glossy surfaces once, on the beat of emphasis.
8. **Atmospheric depth.** Farther layers are darker, lower in contrast, less saturated and slightly blurred; the nearest layer is the brightest and sharpest.
9. **Depth of field.** Blur the background 2 to 6 px when the subject is near.
10. **Parallax.** Under any camera move, near layers travel more than far ones. Give even flat art (the avatar's hair, face, glasses, headphones) a few pixels of Z separation.
11. **Grounding.** Objects sit on a floor plane with a faint reflection or shadow; nothing floats without a reason.
12. **Falloff.** Background glow is a radial gradient behind the subject with darker corners.
13. **Avatar shading.** Cel shading in two tones: shadow shapes under the chin, under the hair, inside the headphones and on the side away from the key, as a multiply layer; a small highlight on the glasses.
14. **Real geometry** (Three.js) only for hero objects that must rotate: standard or physical materials, a key, fill and rim light, soft shadows, filmic tone mapping. Panels, flips, stacks and fans are CSS 3D transforms and render much faster.
15. **Motion blur** on anything fast; without it fast moves strobe.

### Type and captions
- [measured] A proven starting point from the reference reels, not a fixed rule: bold sans for sentences, italic serif in the accent colour for the one keyword per line; the keyword pops to 2 to 3 times size for about 0.5 s and settles.
- Entries 12 frames ease-out, exits 8 frames. Transitions travel left to right or bottom to top.
- Keep text out of the top and bottom interface zones; confirm on a test frame.

### Sound
One material set in one room. Fewer sounds than events.

| Event class | Sound | Notes |
| --- | --- | --- |
| Scene change | Whoosh or swoosh | [measured] on about 3 of 4 cuts, not all |
| Element lands | Short impact or thud | Size of sound matches size of object |
| Small UI appears | Pop or click | [measured] at most 1 in 3 cuts |
| Counter runs | Tick sequence that stops sharply | Chime only when it lands on the final number |
| Strike-through, stamp | Marker slash, stamp thunk | The "gone" motif; keep identical each time so it becomes a signature |
| Typing, terminal | Key burst | Under the voice, never over a key word |
| Build-up before a reveal | Riser into a gap of silence, then impact | Once per reel |
| Mistake or glitch beat | Glitch burst, music drops out for 0.3 s | The audio interrupt |
| Avatar reaction | Nothing, or the faintest breath of air | Do not cartoon it |

- Place the sound's attack on the frame of the visual hit.
- Vary pitch and level slightly on repeats so they do not sound stamped.
- Silence is a sound: one planned drop makes the next hit land.

### Voice and avatar
- The voice matches the drawn character in age and temperament; warm, confident, lightly amused.
- Mouth shapes driven by word timings; blink every 3 to 4 s; brows react on numbers and on the mistake beat; eyes glance at whatever enters.

## Style library (Lemo-Opuscar)

A library of 99 film styles made in code, in 15 families. Use it to choose a treatment that suits the content of a scene, not for variety's sake. One base style per reel; a guest style only for a hero moment, and only when it carries from the scene before it.

The pairings below are this skill's own starting suggestions, not rules from the library. Replace them with the user's choices as they approve or reject looks.

| What the scene shows | Families and styles to try first |
| --- | --- |
| App or repo page, web page, UI panel | Screens and Interfaces: Dark Tech Keynote, Tabletop App Flythrough, Mascot Screencast |
| How a tool works inside, layers, pipeline | Line Diagrams: Exploded Teardown, Isometric Infographic, Color-Coded Mechanism, Assembly-Line Diagram |
| Prices, counters, comparisons | Data and Maps: Data Storytelling, Data Physicalization; Graphic and Type: Scale Zoom Explainer |
| Hook words, labels, keyword hits | Graphic and Type: Swiss Motion Graphics, Text Flash Cuts |
| Hero object, product moment | 3D and Miniature: Glass Product Render, Low-poly Isometric Island, Tilt-Shift Miniature, Brick Toy |
| Cutouts, documents, evidence, the "mistake" beat | Print and Printmaking: Halftone Dossier, Vintage Engraving Collage; Instruments and Evidence: Archive Light Table, Engineering Briefing Board |
| Terminal, code, glitch | Film and Tape: CRT ASCII Terminal; Light and Lines: Circuit Board, Neon Tubes |
| Explaining an idea simply | Sketch and Board: Whiteboard Explainer, Sketchnote, Marker on Paper |
| Science channel topics | Painting and Illustration: Colored-Pencil Science Illustration; Instruments and Evidence: Under the Microscope, Satellite Briefing; Data and Maps: 3D Map Explainer |

Other families (Edit and Documentary, Traditional Crafts, Cartoons, Games) are available when a topic calls for them.

Rules:
- Locked and signature items keep their given look in every style. The avatar takes that scene's light direction and shadow.
- A style change happens on a carry (a push through, a flip, a morph), never as a bare swap.
- If the library is not installed in the current environment, write that in the ledger and build with the look card alone.

## Environments

- **Cloud workspace:** research, writing, test frames. It cannot reach social sites; do not try to work around that.
- **GitHub Actions (Exp1):** fetching references with yt-dlp, live data, full renders.
- **Linux server (optional):** needs git, Node 20 or newer, Python 3, ffmpeg, Playwright's Chromium, Whisper, yt-dlp and the GitHub CLI. Skills are read from the repo's `.claude/skills/` folder, so cloning Exp1 brings them along. Also install there: `hook-master` (clone github.com/Liamrjohnston/hook-master-skill and run its `install.sh`, which copies nine skills into `~/.claude/skills`), the Lemo-Opuscar library (clone github.com/lemomo-ai/lemo-opuscar and follow its README), and for sound labelling `laion-clap` and `panns-inference` from pip (both run on CPU, slowly). Read each licence before first use and record it in `licences.md`. On an ARM server, check that each tool has an ARM build before relying on it.
- **Scheduled run:** a weekly task may run Stages 0 to 5 unattended and stop at Gate 1 with the script pack ready.

## Journal

The journal is automatic. The user does not have to ask.

- At the end of every session where something happened in the video work, write or extend `journal/<yyyy-mm-dd>.md` without being asked, then say in one line that it was logged.
- Choose what matters: what the user made or changed, tools and settings used, what went wrong and how it was fixed, decisions taken, results and numbers they reported, things they found surprising, open questions, and anything that could become a post. Skip routine steps and small talk.
- Write the user's own words where they said something worth quoting. Mark anything that is your summary, not their statement. Never add a feeling, opinion or story they did not express.
- One file per day. Add to it during the day; never rewrite an earlier day except to fix a mistake the user points out.
- "What did I do yesterday?" is answered from the journal, quoting the entry, never from memory or guesswork.
- The journal is personal. Keep it in a private repo. If no private place is available, keep the entry as a draft in the session, tell the user, and do not write it anywhere public.
- Ideas for posts get their own heading, "Post ideas", at the end of the entry, so Stage 1 can find them.

## Final report format

Lead with what was produced and where. Then the ten stages, one line each: done with its evidence, or BLOCKED with the reason. Then what the user must check or decide. No recap of effort.