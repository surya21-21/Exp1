# Voice

The channel's voice lives in ElevenLabs. `voice.json` holds its `voice_id`; every reel uses it unless its `reel.json` names another voice.

- Made with ElevenLabs instant voice cloning from six samples the owner supplied (about 80 seconds).
- The samples were kept here only encrypted for the setup run, then deleted.
- To change speed or model for all reels, edit `voice.json`. To change one reel, add `"voice": {"speed": 1.1}` to its `reel.json`.
