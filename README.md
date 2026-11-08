# Motion video pipeline

A script goes in and a finished, captioned reel comes out. Everything renders on GitHub Actions, so your phone only starts the run.

```
script.txt --ElevenLabs--> voice + word timings --> timeline (scenes, repo data, sound cues)
          --Remotion--> video --ffmpeg--> voice + synthesized SFX + music (ducked) --> final.mp4
```

The pacing rules come from `docs/reel-style-guide.md`, which was measured from the reference reels.

## Make a reel

1. Copy `assets/script.example.txt` to `assets/script.txt` and write your script (format below).
2. **Preview first.** Go to Actions > **Render motion video** > Run workflow, keep `engine = remotion-preview`. In a few minutes you get 8 still frames as `preview.jpg` (in Releases, or the run's Artifacts). This uses no ElevenLabs credits.
3. **Full render.** Run again with `engine = remotion`. It makes the ElevenLabs voice, renders, mixes the audio and puts `final.mp4` plus `captions.srt` in a draft release.

For heavy videos, set `chunks` to 3-4 to render in parallel.

## Script format

```
# Lines starting with # are notes, never spoken.
[[hook]]
These *9 free GitHub repos* replaced my paid tools.
[[repo remotion-dev/remotion | replaces=After Effects | price=22.99]]
Number one, *Remotion*. You write the animation as code.
[[text]]
But here's the *mistake* I made at first.
[[cta REPO]]
Comment *REPO* and I'll send you every link.
```

| Marker | Scene |
|---|---|
| `[[hook]]` | Monthly cost counts up, repo names flash every 0.2s, then a strike-through and "$0" |
| `[[repo owner/name \| replaces=Tool \| price=12]]` | Number card, Apple-style Safari window with a restyled repo page (main tabs, live star count, cursor clicking Star), "Replaces Tool $12/mo" with a strike-through and a FREE stamp. The savings counter goes up. |
| `[[text]]` | Big kinetic statement (the `*keywords*`) |
| `[[cta KEYWORD]]` | "Comment KEYWORD" end card |

The repo name, description, stars, forks, language and issue count are fetched from GitHub when the workflow runs. `*asterisks*` mark keywords, which pop in the accent colour in the captions. Change the accent in `props.base.json`.

## Voice

- **ElevenLabs (default):** add the repo secret `ELEVENLABS_API_KEY` (Settings > Secrets and variables > Actions). Pick a voice with the `voice_id` box. Free plan: about 10 min/month, non-commercial, credit required. A monetized channel needs a paid plan.
- **Saving credits:** a full render reuses the last ElevenLabs voiceover whenever the script and voice are unchanged, so re-rendering after visual changes is free. Preview mode never uses credits.
- **Your own recording or a voice made elsewhere (e.g. InVideo):** upload it as `assets/voiceover.mp3`. An uploaded file is always used instead of ElevenLabs; delete it to go back. Whisper times it and the words are matched to your script, so captions keep your spelling.

## Sound

- **Sound effects** are synthesized in code (whoosh, pop, click, tick, impact, riser) and placed on every animation beat from `src/beats.json`. No licences needed.
- **Music:** put one royalty-free track in `assets/music/` (YouTube Audio Library or Pixabay Music). It loops to fit, dips under the voice and fades out. The final mix is normalized to -14 LUFS for Reels and Shorts.
- **Openverse:** with no track in `assets/music/`, the workflow searches Openverse for music and for the whoosh, pop, click, impact, swoosh and riser sounds, using `assets/audio.json` (CC0 / public domain by default, so no credit is needed). Results are cached, so every render sounds the same until you change a query. Anything not found falls back to the code-generated sound. Credits go in `CREDITS.txt` in the release. If no music turns up, add `by` to `licenses` and copy the credit into your caption.

## Other pieces

- **Study a reference video** workflow: yt-dlp plus Whisper on a URL. Instagram blocks GitHub's servers, so for reels save them on your phone and share them in chat.
- **HyperFrames engine:** `npx hyperframes init hyperframes`, commit the folder, pick `hyperframes`.
- The science-channel `Explainer` composition is still there. Set `composition = Explainer` and size 1280x720.
- Remotion is free for individuals and small teams. Check its license if the channel grows.
