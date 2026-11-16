---
name: "reel-director"
description: "Use for any reel or short video for the user's channels: runs the whole research-to-render pipeline with proof at every stage and routes to the other video skills."
---

# Reel Director

One entry point for making a reel. It owns the order of work, the proof each stage must leave behind, the craft rules, and which other skill does which job. Load this first for any request to research, script, storyboard, animate, voice, score, render or review a short video.

## Rules that never bend

1. **No stage is skipped, merged or done "in your head".** Each stage writes its evidence to the ledger before the next stage starts. If a stage cannot be done (a tool is missing, a site is unreachable, a credit limit is hit), write `BLOCKED: <reason>` in the ledger, tell the user in plain words, and stop or continue only with what is honestly possible. Never fill a gap with invented data.
2. **Two human gates.** The user approves the script, storyboard and animatic before any finished render, and the user presses post. Gate 1 is enforced: the Make reel workflow refuses a finished render unless `reel.json` carries the user's approval of the exact spoken script and the reel folder has a `ledger.md`. Record an approval with `python scripts/plan_reel.py reels/<name>/reel.json --approve` only after the user's yes is quoted in the ledger.
3. **Nothing renders on the user's phone or device.** Test frames in the cloud workspace; finished renders on GitHub Actions or the Linux server.
4. **Every on-screen number has a named product and a source**, checked on the day of the render and listed in the reel's `script.md`.
5. **Every "I" statement is true for the user.** Ask; do not invent a personal story.
6. **Every asset has a line in `docs/licences.md`** (voice, music, each sound set, fonts, logos, code libraries). Logos are the official files from the brand's own repo or page, never redrawn.
7. **The user locks what they choose; the craft rules decide everything else.** Only items on the Locked and Signature lists of the brand sheet are fixed. Every other look and editing choice is made per reel by the craft rules in this skill, with the reason written down. Other skills contribute tools and method; their house palettes and defaults rank last. See "Look: locked and open".
8. **Never promise reach.** Scores are pattern-based estimates. Say so.
9. **Motion is judged, not assumed.** A reel is not done because it is correct. It must pass the variety and stillness checks in Stage 9 and the motion review of its transition strips.

## Where things live

Everything is in the repo Exp1 unless a line says otherwise.

| Thing | Place |
| --- | --- |
| One reel: ledger, script, reel file, saved voice | `reels/<yyyy-mm-dd>-<slug>/` (`ledger.md`, `research.md`, `script.md`, `reel.json`, and after the first voiced run `voiceover.mp3`, `words.json`, `music.mp3`) |
| What a run produced | Branch `reel-previews`, folder `<reel name>/`: `storyboard.jpg`, `transitions.jpg`, `animatic.mp4`, `timing.md`, `contact.jpg`, `checks.md`, `final.mp4`. The MP4 is also in a draft release |
| Collection: every learned transition, move, hook, layout, UI piece, caption style, avatar use, script structure and sound finding, with our own effect code | `collection/` (`recipes/`, `lib/`, `demo/`, `data/`, `tools/`) |
| Reel engine | `studio/` (`engine.js`, `scenes.js`, `scenes3d.js`, `render.py`); the reel format is in `reels/README.md` |
| Style guide from the first six reference reels | `docs/reel-style-guide.md` (older; where it disagrees with `collection/`, the collection wins) |
| Reference reels | `References/<name>/` holds numbers only (`study.json`, `report.md`, `onsets.csv`). Videos, frames and audio are never committed. Transcripts are other people's words and live only in the private journal repo under `study/` |
| Brand folder | `brand/`: `brand-sheet.md` (Locked, Signature, Avoid), `avatar/avatar.png`, `avatar/expressions/` (9 faces for the large avatar), `avatar/heads/` (6 heads for the cursor), `outro/outro.md`, `backgrounds/`, `voice/voice.json` |
| Sound effects | `assets/sfx/*.wav` (ElevenLabs set); fallback sounds are synthesised by `scripts/make_sfx.py` |
| Licences | `docs/licences.md` |
| Official logos | `logos/` (created when the first logo is added) |
| Editing notes, script notes | the user's memory files for editing and script material |
| Daily journal (what the user did, tried, broke, learned) | `journal/<yyyy-mm-dd>.md` in the private journal repo, never in a public one |

Not built yet, so a reel that needs it is BLOCKED until it is: live repo counts at render time (the old template's `scripts/build_timeline.py` has the fetch code; the reel engine has no such step).

## Which skill does which job

Load the named skill at the stage shown. If a skill is not installed in the current environment, say so in the ledger and use the fallback.

| Job | Skill or tool | Fallback |
| --- | --- | --- |
| Trend and hook pass, hook scoring rubric | `invideo-director` (its virality reference); vidIQ connector if connected | Web search, labelled as thinner data |
| Hook critique and rewrite | `hook-master` and its eight companions (`viewer-panel`, `the-council`, `four-failures-check`, `hook-formats`, `niche-tuner`, `viral-scout`, `visual-match`, `lock-in`), stored in `.claude/skills/` of Exp1 | The hook kinds in `collection/recipes/hooks.md` and the rubric in Stage 3 |
| Art style for a hero scene or element | Lemo-Opuscar style library (99 coded film styles in 15 families), cloned when needed | The shading and look rules below |
| Labelling sound effects in reference reels | LAION-CLAP with PANNs, through the `study-audio` workflow in the private journal repo, or `scripts/label_sfx.py` in `reference.yml` | Onset detection, labels marked "unverified" |
| Reference picture study | `scripts/study_reference.py` then `collection/tools/catalogue_events.py` | `onetake` `scripts/analyze_ref.py` (non-commercial only) |
| Motion vocabulary and carry between beats | `collection/recipes/` first; `onetake` references for ideas | The craft rules below |
| Composition and render | The Exp1 reel engine, run by the Make reel workflow; HyperFrames or Remotion skills only when the user asks for them | Plain HTML plus headless Chrome plus ffmpeg |
| ffmpeg commands and filtergraphs | `ffmpeg-llm` skills | Write the command by hand, test on 2 seconds |
| AI-generated images (character sheets) or footage | invideo with Seedream 5 Flash, seat credits only; `invideo-director` for prompts | None; skip generated footage |
| Word timings and captions | ElevenLabs timings from `scripts/reel_voice.py`; Whisper (`scripts/reel_words.py`) only for a voice the user recorded | Estimated timing, marked in the checks |
| Voice, music, sound effects | ElevenLabs, called by the workflows with the repo secret `E` (`reel_voice.py`, `reel_music.py`, `sfx_library.py`) | Silent draft; synthesised sounds from `make_sfx.py` |
| Script pack the user reads and comments on | `docs` | `script.md` in the reel folder |
| Automated quality check | `scripts/check_reel.py` (runs in the workflow, writes `checks.md`) | None: without it the reel is not checked |

Licence notes: `onetake` is free for noncommercial use only; do not run its code for a monetised channel. Lemo-Opuscar's code is MIT but its style guides are CC BY-NC: read them for technique, never copy their text into the repo.

Not part of this pipeline unless the user asks for that style: `clawd-animation-base`, `gbro-collage-broll`.

## Collection and engine

The collection is the first place to look for any effect, layout or structure; the engine is the default way to build and render.

- A new effect is first added to the collection (recipe card with its measured source, code in `collection/lib` or `studio/scenes*.js`, demo still), then used.
- If a reel needs a scene type the engine lacks, add it to `studio/scenes.js` or `studio/scenes3d.js` and to the table in `reels/README.md` rather than working around it.
- Store techniques and our own code only, never a creator's frames, audio or script.
- The engine writes the sound cues itself from the same code that draws each event.
- Run `python collection/tools/make_demo.py` after changing the library, so the demo sheets stay true.

## The pipeline

Start every run by creating `reels/<date>-<slug>/ledger.md` with the eleven stage names (0 to 10) as unchecked items. Tick a stage only when its evidence exists. The final message to the user lists each stage with one line of evidence or its BLOCKED reason.

### Stage 0 - Brief
Read `brand/brand-sheet.md` first and copy its Locked, Signature and Avoid lists into the brief. Collect or assume, and write down: channel, one promise ("the viewer leaves knowing X"), audience, language, platform and size (default Instagram Reels, 1080 x 1920, 30 fps), target length, the true personal facts available, the CTA keyword.
Evidence: the brief at the top of `ledger.md`.

### Stage 1 - Trend and topic research
- Read the journal: yesterday's entry first, then earlier days when a topic needs more. Pull post ideas from what the user actually did, tried, got wrong and learned. The channel covers using Claude Code for edits and motion, how to use other AI apps such as Higgsfield, the user's mistakes, and their journey. A script may combine several days into one story; every personal claim must come from a journal entry or from the user.
- Pull what is rising in the niche this week and 3 to 5 outlier videos (views far above the channel's average). Record the date of the data and its source.
- For each outlier: hook line, first-frame visual, structure, length, on-screen text, CTA.
- Extract the mechanism, never the script. Write an original angle.
Evidence: `research.md` with links and dates, and the journal entries used, by date. If only web search was available, say so at the top. If the topic came from the user and no trend pass was run, write that instead of pretending. If there is no journal entry for recent days, say so and ask the user what they did.

### Stage 2 - Reference study
Only when the user supplies new reference reels. A link is fetched by the yt-dlp step in `reference.yml`; if the platform blocks it, ask the user to upload the file. Reference videos are for study only and never re-uploaded, committed or reused as footage.

- **Sample by motion, not by the clock.** A frame every 0.5 s misses anything shorter than half a second, which is most transitions, text pops and effects.
  1. Decode every frame of the source at its own frame rate. Compute the frame-to-frame difference curve and detect cuts on all frames.
  2. Keep every frame of the first 3 seconds.
  3. Grow each cut and each peak in the difference curve into an event with its lead and settle frames (`collection/tools/catalogue_events.py`).
  4. View events as strips of 8 to 12 consecutive frames in order, never as single frames, so the motion can be read. View at least half of all events, and at least one of every kind in every reel. Write the count viewed and the count measured.
  5. For each viewed event record: what kind of transition or effect it is, its length in frames, direction of travel, how it speeds up and slows down, overshoot or bounce, blur or smear, what element carries across, and the sound that lands on it.
  6. For text: frames per word entry, pop size and settle time, measured the same way.
- Limits to state in the notes: nothing shorter than one source frame can be seen, and compression smears fast motion, so very fast effects are described as best estimates.
- **Label the sounds.**
  1. Separate the voice from the music and effects (Demucs, in the `study-audio` workflow).
  2. Find sound onsets in the music-and-effects track.
  3. Cut a clip from 0.1 s before to 0.6 s after each onset.
  4. Label each clip with LAION-CLAP against the user's own word list: whoosh, swoosh, pop, click, tick, impact, riser, glitch, stamp, slash, chime, typing, shatter, servo. Add a word to the list when a sound fits none of them. Tag the same clip with PANNs.
  5. Keep the top label and its score. When it is less than 0.03 above the second label, mark it "unsure".
  6. Match each labelled sound to the picture event within 3 frames of it, and keep only those: the rest are mostly beats of the music.
  7. Write `sfx-map.csv`: time, label, score, visual event, loudness relative to the voice. Summarise as "which sound on which event, how often".
  8. Model labels are a first pass, not truth. Only the user's ear confirms them: mark the map "not checked by ear" until the user has listened to at least 10 per reel.
- Transcribe the voice for pace and structure. Keep transcripts private.
- Also measure: caption position and words per group, words per second, pauses.
- Add what is new to `collection/recipes/` with its numbers, build anything reusable, and note it in the user's editing notes.
Evidence: `collection/data/<reel>/events.csv` and `sfx-map.csv`, the viewed and measured counts, new recipe IDs. With no new reference: "no new reference; using the collection of <date>".

### Stage 3 - Hooks
- Write at least 5 hooks across at least 4 of the hook kinds H01 to H10 in `collection/recipes/hooks.md`.
- Run `hook-master` on them in its own order (four-failures-check, viewer-panel, the-council, hook-formats, niche-tuner, visual-match, lock-in). Paste its verdicts into the ledger. It never invents stats; neither do you.
- For each hook: the spoken line, the frame-zero visual, the on-screen text.
- Score each 0 to 2 on five points: clear in under 3 s, one idea, works with sound off, payoff promised and delivered, reason to finish. Show all five hooks with their sub-scores; keep the top 3 for the user; pick one and say why.
Evidence: the full hook table in `script.md`.

### Stage 4 - Script
- **Pace.** [owner, 15 Nov 2026] The channel voice speaks at its normal speed, measured at 2.63 words a second. Size the script by it: length in seconds is words divided by 2.65. Do not speed the voice up without asking. [measured] For context, the reference reels speak at 2.5 to 4.3 words a second.
- **Structure.** Pick one of P01 to P06 in `collection/recipes/script.md` and name it. [measured] First word on frame zero; 6 to 14 words in the first 3 seconds; sentences of 6 to 9 words; a re-hook near 40% in any reel over 45 seconds; the ask starts 81 to 97% of the way in and lasts 1.4 to 5.7 seconds.
- Plain words. Any sentence the user might not understand on first hearing is rewritten.
- Mark one `*keyword*` for every line or element that must land on a word: the engine takes its beats from them.
- A fact table: every claim, its number, the named product, the source, the date checked. A "for you to confirm" list of every "I" statement.
- Pronunciation list for the voice model.
Evidence: `script.md` with voiceover, fact table, confirm list; `timing.md` from `plan_reel.py --table` (words, seconds and words a second per scene).

### Stage 5 - Storyboard and animatic (GATE 1)
- Write `reel.json`. Scene types, props and transitions are in `reels/README.md`.
- Shot table in `script.md`: scene, what is on screen, the move that happens, transition in, sound, and an **energy score from 1 to 5**. The scores must not be flat: at least one 5 and at least one 2 or lower.
- **Shot variety.** No scene type twice in a row. No more than two scenes in a row with the same layout and scale. One or two 3D hero scenes per reel [owner], for the hook and the main reveal.
- **Transitions.** The paper tear is the signature and marks chapter changes. Use at least three kinds in a reel of six scenes or more, and never the same one twice in a row except a plain cut. [measured: creators repeat one signature; owner: at least three kinds]
- Write the look card (see "Look: locked and open"): every open choice for this reel with a one-line reason.
- Run Make reel with "storyboard stills only". It produces `storyboard.jpg` (frame zero and the end state of each scene), `transitions.jpg` (8 frames of every transition) and `animatic.mp4` (the whole reel at 10 frames a second with the voice). Look at all three before showing them.
- Publish the script pack with those three files and stop. Do not render the finished reel until the user approves.
Evidence: the three files on `reel-previews`, the shot table, the user's approval quoted in the ledger, then `plan_reel.py --approve`.

### Stage 6 - Audio
The workflow does the work; the rules are in `collection/recipes/sound.md` and the Sound section below.
- Voice: `brand/voice/voice.json`, spoken in one pass by `reel_voice.py`, which also returns the word timings. A voice the user recorded goes in the reel folder as `voiceover.mp3`.
- After the first voiced run, copy `voiceover.mp3`, `words.json` and `music.mp3` from `reel-previews` into the reel folder so later runs reuse them and spend no credits. If the script changes, delete them.
- Music: an ElevenLabs instrumental bed the length of the reel (`"music"` in `reel.json` sets the prompt), or the user's own `music.mp3`.
- Sound effects: the engine's cue list, played from `assets/sfx`.
Evidence: loudness, peak, voice pace and "voice matches the script" lines in `checks.md`; `docs/licences.md` up to date.

### Stage 7 - Build
- Every value is a function of time, so any frame can be drawn alone and twice the same. No randomness without a fixed seed.
- Apply the craft rules below, the Motion rules above all.
- Build new scene types into the engine and the collection, not into one reel.
- Test frames locally in the cloud workspace (`python studio/render.py <timed spec> --stills <dir> --times ...`) and look at them.
Evidence: commits, and the local stills viewed (name the times).

### Stage 8 - Render
- Run Make reel with "finished reel". It checks Gate 1, plans the timing from the voice, renders every frame in one pass, mixes the sound and runs the checks.
- Tell the user the time estimate before a long render (about 90 seconds of rendering for a 40-second flat reel; 3D scenes take longer).
Evidence: the run number, `final.mp4` and `contact.jpg` on `reel-previews`.

### Stage 9 - Quality check
Two parts. A fail is fixed and re-run, or reported; it is never waved through.

**Part 1: measured by `scripts/check_reel.py`, in `checks.md`.** Every line must be pass or not applicable.

| Check | Pass condition | From |
| --- | --- | --- |
| Size, frame rate, length | 1080 x 1920, 30 fps, within 2 frames of the plan | Instagram format |
| Frame zero | Not empty; something marked as a key element is on screen | measured: all 12 references open on content |
| Words from the first frame | First caption by 0.1 s | measured: 12 of 12 |
| Stillness | No stretch over 1.5 s with nothing changing | measured: longest in any reference 1.67 s |
| Stillness outside the captions | No stretch over 2.0 s where only caption words change | check_reel (stricter than the references) |
| Frame in use | Content spans 60% of the usable height in 80% of frames | check_reel |
| Rhythm | 0.5 to 3.0 picture changes a second | measured: 0.4 to 2.2 plus transitions |
| Scene variety | At least 6 scene types in 8 or more scenes; none twice in a row | owner; check_reel |
| Transition variety | At least 3 kinds; none twice in a row except a cut | owner; check_reel |
| Captions | 4 words or fewer; below the top 14% | measured C01-C07; Meta safe zone |
| Safe zone | Key elements inside 40 to 1040 px across, 230 to 1490 px down, and left of 985 px in the lower half | Meta safe zone, loosened at the bottom for organic reels |
| Smallest text | 30 px or more | Apple HIG (11 points on a phone) |
| Accent contrast | 4.5 to 1 against the paper | WCAG 1.4.3 |
| One effect a frame | No two sound cues on one frame | Murch, dense clarity |
| Loudness and peak | -16.5 to -13 LUFS; peak at or under -1 dB | Spotify and Apple targets |
| Voice | Present, word for word as scripted, no silence over 0.8 s | measured: longest reference gap in talking reels 0.76 s |
| Signature outro | Last scene is `cta` | owner |

**Part 2: by eye, each with one written line and the file it was judged on.**

| Check | Judge it on | Pass condition |
| --- | --- | --- |
| Hook | `storyboard.jpg` frame zero, viewed at 360 px wide | The promise is readable muted and paused |
| Motion quality | `transitions.jpg`, `animatic.mp4` | Entrances ease out, exits ease in; hero elements overshoot and settle; parts arrive staggered; no container sits empty for more than 10 frames |
| Carry | `transitions.jpg` | Something survives every scene change (avatar, captions, an object) |
| Hero moment | `contact.jpg` | At least one scene clearly bigger in motion and depth than the rest |
| Light | `contact.jpg` | Shadows fall down and to the right in every scene |
| Locked and Signature items | `contact.jpg` | Paper Studio, avatar faces, cursor heads, outro and voice exactly as given |
| Look card | `contact.jpg` | Every open choice matches what was approved |
| Flashes and colour | `transitions.jpg` | No more than three full-frame flashes in any second; nothing told by colour alone (WCAG 2.3.1, 1.4.1) |
| Facts, truth, licences | `script.md`, `docs/licences.md` | Every number matches its source; every "I" line confirmed; every asset listed |

Then have a fresh agent that has not seen the build look at `contact.jpg`, `transitions.jpg` and `checks.md` and list problems. If the session cannot run agents, write "no fresh reviewer" in the ledger.
Evidence: `checks.md` with zero fails, the Part 2 table filled in the ledger, the reviewer's list and what was done about each item.

### Stage 10 - Deliver and learn
- Send the MP4, the caption, a cover frame (1080 x 1920 with 3 to 5 words inside the centre 3:4; Instagram's profile grid has shown posts at 3:4 since January 2025), hashtags and the pinned comment.
- Write the day's journal entry (see "Journal").
- After posting, record what the user reports: views past 3 seconds, average watch time, saves, sends, comments on the keyword. Compare with earlier reels and write one line on what to change next time.
Evidence: the files sent and a `results.md` once numbers exist.

## Look: locked and open

The user decides what is fixed. The craft rules decide the rest, reel by reel.

**Order of authority**
1. What the user says in the current request.
2. The Locked and Signature lists in `brand/brand-sheet.md`.
3. The craft rules in this skill.
4. House styles and defaults of other skills and libraries.

**Fixed on the user's instruction.**
- Background: Paper Studio, as drawn by `collection/lib/paper.js`.
- Avatar: the large avatar uses the nine approved faces in `brand/avatar/expressions/`; the small cursor uses the six heads in `brand/avatar/heads/`. They take each scene's light and shadow but are never redrawn or restyled. New faces are generated only with Seedream 5 Flash on seat credits and only used after the user approves the sheet.
- Motif: the outro in `brand/outro/outro.md`. The ask comes first ("Comment KEYWORD and I'll send you the links."), then the sign-off "This is your AI guy." as the very last line, with the avatar on screen. Only the keyword changes between reels.
- Voice: the channel voice in `brand/voice/voice.json`, at normal speed.
- The bottom of the frame stays empty for the app's buttons.
- The user edits these files directly. Always read the current files; never rely on an earlier copy.

**Open choices.** Anything not on the Locked or Signature lists is open, and the director chooses it for each reel from the content: accent colour, caption style, typefaces, editing style, transitions, art style of hero scenes, sound material and music mood.

**How to choose**
- Accent colour: one per reel, 4.5 to 1 against the paper when used for text (the current default is #c2381d). Test it on a still.
- Caption colour: near-black for sentences, the keyword on accent-tinted tape.
- Typefaces: two at most (Inter and Lora are bundled).
- Editing style, from the content: lists and reveals take cuts and hits; "how it works" takes one canvas with elements changing in place; a story or mistake takes slower shots with real rests.
- Sound and music: match the editing style; fewer, softer sounds for calm reels.

**The look card.** At Stage 5, write each open choice with a one-line reason. The user approves or changes it at Gate 1. After approval it is fixed for that reel.

**Memory across reels**
- Signature: never change the avatar, the outro or the voice silently. Propose a change and wait for the user.
- Avoid: when the user rejects a look, record it in the Avoid list and do not offer it again.
- The user can move any item between locked and open at any time.

## Craft rules

Every rule carries its source in brackets. A rule with no source does not belong here.

| Tag | Source |
| --- | --- |
| measured | Our study of 12 reference reels: `collection/recipes/` and `collection/data/` (18,271 frames, 210 picture events) |
| Murch | Walter Murch, *In the Blink of an Eye* (2nd ed., 2001), the Rule of Six; and "Dense Clarity - Clear Density" (Transom Review, 2005) |
| Disney | Frank Thomas and Ollie Johnston, *The Illusion of Life: Disney Animation* (1981), the twelve principles of animation |
| Katz | Steven D. Katz, *Film Directing: Shot by Shot* (1991), on the moving camera |
| Mayer | Richard E. Mayer, *Multimedia Learning* (3rd ed., Cambridge University Press, 2020) |
| Gurney | James Gurney, *Color and Light: A Guide for the Realist Painter* (2010) |
| Material | Google Material Design guidelines: motion (easing and duration) and light and shadows |
| Instagram | "Instagram Ranking Explained" (about.instagram.com) and "Tips for improving your reach" (creators.instagram.com) |
| Meta | Meta Business Help Centre, safe zones for 9:16 Stories and Reels: keep text and logos out of the top 14%, the bottom 35% and 6% at each side |
| WCAG | W3C Web Content Accessibility Guidelines 2.1: 1.4.3 contrast, 1.4.1 use of colour, 2.3.1 three flashes |
| ITU | ITU-R BT.1359-1: sound that is early is noticed from about 45 ms, sound that is late from about 125 ms |
| Loudness | Spotify for Artists (-14 LUFS, peak -1 dB) and Apple Podcasts (-16 LKFS, peak -1 dB), both measured by ITU-R BS.1770 |
| Verizon | Verizon Media and Publicis Media survey, 2019, 5,616 US adults: 69% watch with the sound off in public, 25% in private |
| Apple HIG | Apple Human Interface Guidelines, Typography: text no smaller than 11 points |
| Bentivoglio | Bentivoglio et al., "Analysis of blink rate patterns in normal subjects", *Movement Disorders* (1997) |
| owner | A decision the user made; the date is in the journal |
| check_reel | A limit this project enforces in `scripts/check_reel.py`; the number is ours and can be changed there |

### Direction and taste
- [Murch] Six things a cut should serve, in this order of weight: emotion (51%), story (23%), rhythm (10%), where the eye is (7%), the flat picture plane (5%), three-dimensional space (4%). When something must give, give up from the bottom of the list. A move that looks clever but dulls the feeling is wrong.
- [Murch] Eye-trace: the next element appears where the viewer is already looking, or a motion leads the eye there first.
- [Disney: staging] One idea per shot, one focal point per frame. If two things move, one is the subject and the other is quiet.
- [measured: layouts-and-ui.md] One highlight at a time (an outline, a switch, the avatar). Every claim is shown as a state change: a switch turns on, a bar fills, a counter lands.
- [measured: transitions.md] Carry, do not replace: something on screen survives each boundary (in the references a brand chip, a caption bar, the avatar).
- [measured: transitions.md] Most creators own one signature transition and repeat it. Ours is the paper tear.
- [owner: brand sheet] Restraint: one background, one accent colour, two typefaces, one set of sounds.

### Motion
What makes code-made video look alive. Frame counts are at 30 frames a second.
- [Disney: slow in and slow out; Material] Every move is eased. Things entering slow down as they arrive; things leaving speed up as they go. Straight-line speed only for counters and typing.
- [Disney: anticipation] A hero element pulls back 2 to 3 frames, by no more than a tenth of its travel, before a big move.
- [Disney: follow through; measured: moves.md] Hero elements overshoot and settle. Measured settles are 2 to 12 frames after the main change.
- [Disney: overlapping action; measured: M13] The parts of a group arrive one after another, 2 frames apart, never all on one frame. No card or container sits empty for more than 10 frames.
- [Disney: arcs] Things that travel move on a shallow curve, not a straight line.
- [Disney: secondary action] One supporting motion per hero action (its shadow, the lamp, the cursor's glance), never one that competes.
- [Disney: timing; measured: moves.md] Frames set weight. Small things (a tick, a pop, a stamp) take 2 to 6 frames; a card or camera move 8 to 13; a full page scroll about 17.
- [Material; measured] Exits are shorter than entrances.
- [Disney: squash and stretch] A soft landing may squash 5 to 8% for one frame. Type never squashes.
- [measured: M24] Stepped animation (drawing on every second frame) is a deliberate hand-made look in 4 of the 12 references. Use it for a whole scene or not at all.
- [measured: M01] A counter or chart is already moving on frame zero. Never start from a still zero.

### Retention
- [Instagram] For Reels, the predictions Instagram says matter most are whether a viewer will reshare the reel, watch it to the end, like it, and go to the audio page. Design for the send and the full watch.
- [Instagram] Reels that are low-resolution, watermarked, muted, bordered, mostly text, or reposted from elsewhere are shown less. Reels over 3 minutes are not recommended to new viewers.
- [measured: hooks.md] All 12 references start speaking on frame zero with content on screen: no intro, no logo card. 6 to 14 words are spoken in the first 3 seconds and the picture changes 2 to 10 times.
- [measured: moves.md] Outside the transitions there are 0.4 to 1.0 small picture changes a second, and nothing sits still for longer than 1.67 seconds.
- [measured: script.md] A re-hook near 40% in the longer reels; "save this" in one of twelve, just before the ask; 9 of 12 end by asking for one keyword in the comments.
- [Verizon] Many viewers have the sound off, so the hook and every key claim are also on screen.
- [Murch: emotion first] Open a question early and answer it; do not explain before the viewer wants to know.

### Clarity
- [Mayer: coherence] Cut anything that does not serve the one promise.
- [Mayer: signaling] Highlight, underline or point at the thing being talked about.
- [Mayer: temporal contiguity] The picture for a word appears with that word, not after it. The engine's beats come from the `*keywords*` for this reason.
- [Mayer: spatial contiguity] Labels sit next to what they label.
- [Mayer: redundancy] Full sentences on screen while the same sentences are spoken overload the viewer. Captions stay at 2 to 4 words with one keyword stressed.
- [Mayer: personalization, voice] Conversational wording and a natural-sounding voice.
- [Mayer: segmenting; measured: L05-L07] Break the content into numbered parts. Four of the references also show progress (dots, a rail, step numbers); ours is the paper-tab strip.

### Camera
[Katz] One move per shot, always motivated by what the viewer needs to see next, and eased at both ends. [Mayer: temporal contiguity] It lands with the key word.

| Move | Use it for | Measured size (median) |
| --- | --- | --- |
| Push-in | The key word or number | 11% closer over about 12 frames |
| Pull-out | A reveal, or showing the whole system | 13% wider over about 13 frames |
| Slide or page scroll | Step to step | A fifth to a quarter of the frame over 10 to 18 frames |
| Small camera move | Keeping a held shot alive | Under 1% over 8 to 9 frames |
| Whip | A fast change of subject | 3 to 4 frames, heavily blurred |
| Ramp into a cut | Energy into a still scene | 9 to 12 frames of acceleration, then a hard cut |
| Orbit or travel in 3D | Hero scenes: showing an object or moving through a space | No reference numbers (one of twelve references is 3D); keep the subject in frame and ease both ends |

- [measured: T12, T17] Fast moves are blurred in the direction of travel; the engine's `ctx.blur` does this.
- [Katz] A camera that follows a subject never lets it leave the frame.

### Depth, light and shading
Flat fills are the main reason code-made video looks cheap. Every scene follows one lighting plan.

1. [owner: Paper Studio] One light plan: a warm key light from the top-left. Shadows fall down and to the right. No glow and no rim light: they read wrong on paper.
2. [Gurney: the form principle] No flat surface. Each card and panel is a little lighter toward the light and darker away from it.
3. [Gurney] Shade the dark side with a darker tone of the same colour, never grey and never pure black. Shadows are warm brown on this paper.
4. [Material: light and shadows] Two shadows per object: a tight dark one from the key light right under it, and a wide soft one from the ambient light. As an object lifts, the tight one fades and the soft one grows.
5. [Gurney: occlusion shadows] Darken where surfaces meet: the base of a card on the desk, inner corners, the crease behind an overlapping layer.
6. [Gurney: atmospheric perspective] Farther layers are lighter, lower in contrast and softer; the nearest layer is the sharpest.
7. [Gurney: cast shadows] A cast shadow is sharp near the object and softer farther away.
8. [Disney: the multiplane camera] Under any camera move, near layers travel more than far ones (parallax).
9. [owner] Real 3D (three.js, `studio/scenes3d.js`) for one or two hero scenes a reel: objects with real thickness, the same top-left key light, shadows cast onto the paper by a shadow-only floor, no tone mapping so the paper colours match the flat scenes.
10. [measured: T12, T17] Motion blur on anything fast.

### Type and captions
- [measured: C01-C07] Captions are 2 to 4 words at a time in the top fifth, each word arriving as it is spoken, one keyword stressed (ours: Lora italic on a strip of paper tape).
- [Meta] Captions and key text stay below the top 14% (268 px). [Meta; check_reel] Meta's bottom limit for ads is 35%; organic reels show less interface, so this project allows key elements down to 1490 px and keeps the hook promise and the keyword above 1250 px.
- [WCAG 1.4.3] Text is 4.5 to 1 against its background (3 to 1 for very large type).
- [Apple HIG; check_reel] Nothing the viewer must read is under 30 px; aim for 40 px and up.
- [measured: M10] The key word may arrive at 2 to 3 times size and settle into the line in about 6 frames.
- [Mayer: redundancy] Never put the whole spoken sentence on screen.

### Sound
- [measured: sound.md] About half the picture events carry a sound (103 of 210). Give one to every transition and to the one or two moves in a scene that carry the point, not to everything.
- [measured: sound.md; ITU] The sound starts on the frame of the picture event or one frame before it (the references' middle value is half a frame early). Never more than one frame early; late sound is noticed less than early sound.
- [measured: sound.md] Transitions take a soft swoosh about 10 dB under the voice; clicks and ticks sit 12 to 17 dB under; one hit a scene at most (stamp, slam, counter landing) may reach the level of the voice.
- [Murch: dense clarity] The ear follows about two and a half things at once. Voice, music and one effect is the limit: never two effects on one frame, and nothing under a key word.
- [measured: sound.md] In talking reels the music and effects together sit 17 to 24 dB under the voice.
- [Loudness] Mix to -14 to -16 LUFS with peaks at or under -1 dB.
- [owner] Voice, music and sound effects all come from ElevenLabs. The paper sounds (tear, stamp, pencil) are the signature set: keep them the same in every reel.

### Voice and avatar
- [owner] The channel voice at normal speed.
- [owner] The large avatar opens the hook and returns for "Save this" and the outro; the small cursor head travels to whatever is being talked about. [measured: A01-A07]
- [Bentivoglio] People blink about 17 times a minute at rest and more in conversation, so the avatar blinks every 3 to 4 seconds, for about 3 frames.
- [Mayer: temporal contiguity] Mouth shapes change only while a word is being spoken.
- [Disney: arcs, secondary action] The cursor head travels on a shallow arc, tilts into the move, and sends one ring out when it arrives.

## Style library (Lemo-Opuscar)

A library of 99 film styles made in code, in 15 families. Use it to choose a treatment for a hero scene or a hero object, not for variety's sake. Paper Studio stays the background in every scene, so a style is applied to what sits on the paper (a card, an object, a 3D prop), never to the whole frame.

The pairings below are this skill's own starting suggestions, not rules from the library. Replace them with the user's choices as they approve or reject looks.

| What the scene shows | Families and styles to try first |
| --- | --- |
| App or repo page, web page, UI panel | Screens and Interfaces: Tabletop App Flythrough, Mascot Screencast; Dark Tech Keynote only as the inside of a card |
| How a tool works inside, layers, pipeline | Line Diagrams: Exploded Teardown, Isometric Infographic, Color-Coded Mechanism, Assembly-Line Diagram |
| Prices, counters, comparisons | Data and Maps: Data Storytelling, Data Physicalization; Graphic and Type: Scale Zoom Explainer |
| Hook words, labels, keyword hits | Graphic and Type: Swiss Motion Graphics, Text Flash Cuts |
| Hero object, product moment | 3D and Miniature: Low-poly Isometric Island, Tilt-Shift Miniature, Brick Toy, Glass Product Render |
| Cutouts, documents, evidence, the "mistake" beat | Print and Printmaking: Halftone Dossier, Vintage Engraving Collage; Instruments and Evidence: Archive Light Table, Engineering Briefing Board |
| Terminal, code, glitch | Film and Tape: CRT ASCII Terminal, as a screen sitting on the desk |
| Explaining an idea simply | Sketch and Board: Whiteboard Explainer, Sketchnote, Marker on Paper |
| Science channel topics | Painting and Illustration: Colored-Pencil Science Illustration; Instruments and Evidence: Under the Microscope, Satellite Briefing; Data and Maps: 3D Map Explainer |

Other families (Edit and Documentary, Traditional Crafts, Cartoons, Games) are available when a topic calls for them.

Rules:
- Locked and signature items keep their given look in every style. The avatar takes that scene's light direction and shadow.
- A style arrives on a carry (a push through, a flip, a morph), never as a bare swap.
- Name the style in the look card. Read that style's own files in the library before writing code; do not copy their text.
- To use it: `git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar` outside the repo. If it cannot be cloned, write that in the ledger and build with the look card alone.

## Environments

- **Cloud workspace:** research, writing, test frames with `studio/render.py`. It cannot reach social sites and cannot play audio; do not try to work around that.
- **GitHub Actions (Exp1):** `reference.yml` (fetch and study a reference), `make-reel.yml` (storyboard, animatic, finished reel, checks), `voice-setup.yml` (voice, music test, sound set), `auto-reel.yml` (topic to storyboard; needs `CLAUDE_CODE_OAUTH_TOKEN`), `add-asset.yml` (bring a file in from a link).
- **Linux server (optional):** needs git, Python 3, ffmpeg, Playwright's Chromium, yt-dlp and the GitHub CLI. Skills are read from the repo's `.claude/skills/` folder, so cloning Exp1 brings reel-director and Hook Master along.
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

Lead with what was produced and where. Then the eleven stages, one line each: done with its evidence, or BLOCKED with the reason. Then the number of failed checks and what the fresh reviewer found. Then what the user must check or decide. No recap of effort.
