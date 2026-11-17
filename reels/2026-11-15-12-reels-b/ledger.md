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

## Version B: motion-graphics remake (director B, 16-17 Nov 2026)

Brief: `directors/BRIEF.md` (the owner's three-director remake). Same spoken words, voice, music and outro; new pictures. Angle: kinetic type and operated UI, elements carried from scene to scene, dense moves, signature transitions, one scene on twos.

- [x] **0-4.** Unchanged from the approved version above (brief, research note, reference study, hooks, script). No new number was added to the screen; one fact-table row was added for the three runner-up still moments already in `collection/recipes/moves.md`.
- [ ] **5 Storyboard and animatic (Gate 1).** Shot table with energy scores (4, 5, 3, 3, 2, 4, 3, 2, 3) and the look card for version B are in `script.md`. Storyboard run #16 (Actions run 44041573908): `storyboard.jpg`, `transitions.jpg`, `animatic.mp4` and `timing.md` on `reel-previews`, looked at (frame 0, every scene's end state, every transition strip). `plan_reel.py --check-approval` prints "script approved": the words are the approved ones. NOT DONE: the owner has not seen or approved this version's storyboard and look card. The finished render below was made because the brief asks for it, for the owner's comparison of the three versions, not for posting.
- [x] **6 Audio.** Reused `voiceover.mp3`, `words.json` and `music.mp3` from this folder; no credits spent. Sounds: the ten in `assets/sfx`, cue list written by the engine (83 cues, none on the same frame).
- [x] **7 Build.** Motion pack: `studio/packs/motion.js` and `studio/packs/motion/`, 8 scene types, 4 transitions, the on-twos effect, the word-clock layer and the type kit (G01-G15, `collection/recipes/pack-motion.md`, demo strips in `collection/demo/motion/`, table in `studio/packs/motion.md`). Commits 5a9c753, a3a7405, 4814f35, 5d41aa3. Local stills viewed: frame 0 and a still in every scene (0, 1.0, 2.5, 3.6, 4.6, 5.8, 6.9, 7.7, 10.2, 12.4, 13.5, 16.0, 18.9, 21.0, 23.5, 25.0, 28.5, 31.0, 33.6, 35.4, 37.5, 40.5 s); every transition as an 8-frame strip across its whole window; six moves as strips 2 frames apart (deal 1.25 s, landing 4.30 s, "4" 6.55 s, INTRO 11.70 s, STILL 15.30 s, NO. 21.85 s); 8 consecutive frames of the scene on twos (15.43 s on); a frame every 0.5 s for the frame-in-use estimate (94% of samples pass, the low ones are the first 2.5 s of the locked outro). Local audit: 653 key boxes, 0 outside the safe zone; smallest text 32 px; frames drawn in two different orders are identical (9 times compared, including mid-transition frames). Engine test reel still draws.
