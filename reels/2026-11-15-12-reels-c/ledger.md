# Ledger: I made Claude study 12 viral reels, frame by frame

Written after the fact on 16 Nov 2026, because this reel was made before the ledger was enforced. Each line says what evidence exists, or that the stage was not done.

- [x] **0 Brief.** Channel "This is your AI guy", Instagram Reels 1080 x 1920 at 30 fps, promise: four measured things viral reels do. Keyword STUDY. No separate `brief.md`; these facts are in `script.md` and `reel.json`.
- [ ] **1 Trend and topic research.** NOT DONE. The topic came from the owner's own project (the 12-reel study), not from a trend pass.
- [x] **2 Reference study.** `collection/` (all 18,271 frames measured, 210 events, 72 viewed as strips; transcripts; 146 kept sounds). Sound labels not checked by ear.
- [x] **3 Hooks.** Three hooks in `script.md`, scored with the skill's rubric. Fewer than the five the skill asks for, and Hook Master was not run (it was not installed then).
- [x] **4 Script.** `script.md`: voiceover, fact table with sources, truth-check list. 106 words; the channel voice speaks it at 2.63 words a second (the owner chose normal speed on 15 Nov).
- [x] **5 Storyboard (Gate 1).** Stills on the `reel-previews` branch. Owner's approval: "Yes" on 15 Nov 2026 to "Do you approve the first reel's script and storyboard?". Recorded in `reel.json` (`approved`).
- [x] **6 Audio.** ElevenLabs voice `mUfWEBhcigm8YlCDbmGP`, ElevenLabs music bed, ElevenLabs sound effects (`assets/sfx`). Loudness -14.5 LUFS. Licences in `docs/licences.md`.
- [x] **7 Build.** `reel.json` on the reel engine; two 3D hero scenes (`hook3d`, `cards3d`).
- [x] **8 Render.** GitHub Actions run 43766387362; MP4 on `reel-previews` and in a draft release.
- [x] **9 Quality check.** 17 of 17 lines passed on 16 Nov with the checks of that day. The stricter checks added afterwards FAIL this version: only the captions change for 3.6 s at one point (limit 2.0 s), and the page scroll is used three times in a row. The three-director remake is the fix.
- [ ] **10 Deliver and learn.** Not posted yet. No results.


## Director C: the character version (16 Nov 2026)

Branch `director-c`, this folder. The script is the approved one (`plan_reel.py --check-approval` prints `script approved` after every edit); only the picture is remade. Stages 0 to 4 and 6 are unchanged from the approved reel above (voice, word timings and music reused from this folder, no credits spent).

- [x] **5 Storyboard and animatic.** Storyboard run 13 (Actions run 43892711304): `storyboard.jpg`, `transitions.jpg`, `animatic.mp4`, `timing.md` on `reel-previews/2026-11-15-12-reels-c/`. Shot table with energy (4, 4, 3, 2, 5, 4, 2, 3) and look card in `script.md`. Eight scene types, seven transitions, none repeated. **NOT APPROVED YET:** the owner compares the three directors' versions; this version's storyboard, animatic and the puppet's new body (`collection/demo/character/r01-puppet.jpg`) wait for the owner's yes. The workflow's Gate 1 checks the script only, which is approved, so the finished render ran.
- [x] **7 Build.** Pack `character`: `studio/packs/character.js` and `studio/packs/character/` (`rig.js`, `act.js`, `props.js`, `scenes.js`, `transitions.js`, `make_demo.py`); recipe cards R01-R15 in `collection/recipes/pack-character.md`; reference `studio/packs/character.md`; demo pictures in `collection/demo/character/` (15). Local stills viewed as strips of consecutive frames for every transition (tear 5.80-6.40, throw 7.80-8.33, lift 13.43-14.03, hole 19.0-19.9, whip 26.03-26.56, push 33.90-34.37, tear into the outro 36.0-36.37) and for the key moves (unfold 1.27-1.87, stomp 4.0-4.6, golf swing 11.55-12.15, measure 15.9-16.83, the hero desk 21.0-22.1), plus single stills across the reel. Local audit: 635 boxes, 0 outside the safe zone, the puppet never in the caption band (225-465 px), no two sounds on a frame. Frames drawn in a different order are byte-identical (6.0, 13.8, 20.5, 33.0 s). The engine test reel still draws. Shared files changed: none.
- [x] **8 Render.** Finished run 14 (Actions run 43893915001): 27 of 28, 1 fail (a 2.13 s stretch, 16.2-18.3 s, where only captions changed: once the magnifier was in place only his small legs moved). Fixed in the scene (the lens reads the bar, the other bars step back, he breathes and swings wider), not in the check. **Finished run 15 (Actions run 43896145753): `final.mp4`, `contact.jpg`, `checks.md` on `reel-previews/2026-11-15-12-reels-c/`, and a draft release.**
- [x] **9 Quality check.** Part 1, `checks.md` of run 15: "28 of 28 lines are pass or not applicable; **0 fail**" (stillness 0.90 s; only captions changing 1.80 s; frame in use 98%; rhythm 1.65 a second; safe zone 635 boxes, 0 outside; smallest text 30 px; -14.4 LUFS, peak -1.9 dBFS; voice word for word). Part 2, by eye:

| Check | Judged on | Result |
| --- | --- | --- |
| Hook | `storyboard.jpg` frame 0 at 360 px | Pass, with a note: the large face, the counter already rolling and "frames studied" read muted; the subline "12 viral reels, every single frame" arrives 4 frames in, not on frame 0. |
| Motion quality | `transitions.jpg`, local strips, `final.mp4` frames at 4.47, 7.97, 11.75, 16.6, 21.90, 21.97, 26.40, 34.20, 39.30 s | Pass: entrances ease out, exits ease in; anticipation before the hops, the point, the throw and the swing; overshoot on the cards, the point and the landings; squash of 7-8% for one frame on landings, body only; cards dealt 3 frames apart; nothing empty for more than 10 frames. |
| Carry | `transitions.jpg` | Pass: he survives every change (he causes or rides six of the seven); the thrown card becomes the next card; captions and progress tabs carry too. |
| Hero moment | `contact.jpg` 20-24 s | Pass: the desk scene has the largest puppet (S 290), the biggest action (ears, jump, slam, shake, run) and the only foreground layer in front of him. |
| Light | `contact.jpg` | Pass: every shadow falls down and to the right; the puppet has a contact shadow and a drop shadow in the same direction. |
| Locked and Signature | `contact.jpg` | Pass: Paper Studio in every frame; the heads and faces are the approved images (uniform scale and rotation only); the outro is the `cta` scene unchanged; voice unchanged. **The body is new and waits for the owner.** |
| Look card | `contact.jpg`, `script.md` | Pass against the director C look card; not yet approved by the owner. |
| Flashes and colour | `transitions.jpg` | Pass: no full-frame flashes; nothing told by colour alone (muted channels also get a cross, dimmed bars also move back). |
| Facts, truth, licences | `script.md`, `docs/licences.md` | Pass: every number on screen is in the fact table (row added for the frames per reel the counter adds up, from `collection/data/rNN/events-summary.json`); no new assets, so no licence change; the "I" lines are unchanged from the approved script. |

No fresh reviewer: the brief does not allow starting other agents here.
- [ ] **10 Deliver and learn.** Not posted. The owner chooses between the three versions first.
