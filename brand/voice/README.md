# Voice

The channel's voice lives in ElevenLabs. `voice.json` holds its `voice_id`, model, speed and pace target; every reel uses it unless its `reel.json` names another voice.

- Since 20 Nov 2026: **Jarnathan** (ElevenLabs library voice, American English), model `eleven_v4_turbo`, speed 1.2, target 3.2 words a second (owner's choice: 3-point-something).
- ElevenLabs' speed setting stops at 1.2x, which is not enough on its own. Right after a new voice is made, `scripts/voice_pace.py` shortens pauses longer than 0.22 s and speeds the take up by at most `max_tempo` (pitch kept), and moves the word timings with it. A saved `voiceover.mp3` in a reel folder is never changed.
- The first reel (15 Nov) and the three director versions keep their saved voice (the 15 Nov voice `mUfWEBhcigm8YlCDbmGP`, about 2.63 words a second).
- To change one reel, add `"voice": {"speed": 1.1}` to its `reel.json`.
