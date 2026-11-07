# Motion video pipeline

Voiceover in, captioned motion-graphics video out, all rendered on GitHub Actions.

```
voiceover.mp3 --Whisper--> captions --Remotion (parallel chunks)--> video --ffmpeg--> final.mp4
```

## Set up from the phone (Termux)

```bash
pkg install -y git unzip gh
unzip motion-pipeline.zip && cd motion-pipeline
git init && git add -A && git commit -m "Add motion pipeline"
gh auth login
gh repo create my-motion-videos --private --source=. --push
```

## Render a video

1. Upload your narration to `assets/voiceover.mp3` (GitHub app or web: Add file > Upload files).
2. Edit `props.base.json` for the title, subtitle and accent colour.
3. Actions tab > **Render motion video** > Run workflow.
4. Download `final.mp4` from the draft release (Releases tab), or from the run's Artifacts.

Workflow options: size (720p default, keeps it fast), fps, parallel chunks (use 2-4 for heavy scenes), Whisper model, and engine.

## Other pieces

- **Study a reference video** workflow: yt-dlp + Whisper turn a reference URL into a transcript. YouTube often blocks GitHub's servers; if it fails, run yt-dlp in Termux and upload the audio.
- **HyperFrames engine**: create a project with `npx hyperframes init hyperframes`, commit it, then pick `hyperframes` in the workflow.
- Edit `src/Explainer.tsx` to change the scene. Preview locally with `npm install && npm run studio` on a PC.

## Notes

- Remotion is free for individuals and small teams; check its license if the channel grows.
- Use reference videos for study, not as footage in your own videos.
