# Reels

One folder per reel. The folder holds `reel.json`; the **Make reel** workflow turns it into a finished MP4.

## One click

1. GitHub app or site > **Actions** > **Make reel** > **Run workflow**.
2. Type the folder name (for example `engine-test`).
3. Choose **finished reel** or **storyboard stills only**.

When it finishes: the MP4 is in **Releases** (a draft, only you can see it), and the storyboard, a contact sheet and the check table are on the branch `reel-previews` in a folder with the reel's name.

Voice, in this order: `voiceover.mp3` in the reel's folder if you recorded one; otherwise ElevenLabs if the repository secret `ELEVENLABS_API_KEY` is set; otherwise a silent draft with estimated timing (the checks say BLOCKED for voice).

Music: the first file in `assets/music/`, if there is one.

## reel.json

```json
{
  "title": "Working title",
  "accent": "#c2381d",
  "keyword": "STUDY",
  "wps": 3.4,
  "voice": { "id": "ElevenLabs voice id", "speed": 1.08 },
  "scenes": [
    { "type": "hookCounter", "say": "The line spoken over this scene, with *keywords* in asterisks.", "props": { } },
    { "type": "uiCard", "in": "tear", "say": "...", "props": { }, "hold": 0.4 }
  ]
}
```

- `say` is what the voice says during the scene. Each `*keyword*` is highlighted in the captions and becomes a **beat**: the moment an animation in the scene lands. Beats are used in order.
- `in` is the transition into the scene. `hold` adds silence after the line. `wps` (words a second) is only used when there is no voice.
- `accent` must reach 4.5 to 1 against the paper; the checks measure it.

### Transitions (`in`)

| Name | From | Frames | Use |
| --- | --- | --- | --- |
| `cut` | T01, T02 | 1 | Default. The new scene is already moving on its first frame. |
| `tear` | N01 | 8 | Our signature. Chapter changes, at most 2 or 3 a reel. |
| `shuffle` | N09 | 9 | Card to card. |
| `iris` | N11 | 5 | Into a detail; add `"at": [x, y]` for where the hole opens. |
| `railScroll` | T17 | 17 | Step to step in a tutorial. |
| `whip` | T12 | 7 | A fast change of subject. |
| `dissolve` | T20 | 7 | Calm reels. |
| `rampCut` | T05 | 10 | Energy into a still scene (before "Save this"). |
| `flicker` | N04 | 6 | Change of topic without moving. |

### Scene types and their props

| Type | Props | Beats, in order |
| --- | --- | --- |
| `hookCounter` | `from`, `to`, `label`, `sub`, `chips` (list), `prefix`, `suffix`, `run` (seconds) | avatar shrinks to the cursor; then one per chip |
| `bigWord` | `word`, `over`, `sub`, `font`; `note: false` for plain type with an underline | the word lands |
| `uiCard` | `kicker`, `title`, `rows` (each `label` and `kind`: `toggle`, `tick`, `value` with `value`/`unit`, or `bar` with `v`), `stamp: {text}` | one per row; then the stamp |
| `steps` | `n`, `of`, `name`, `underline` (px), `lines` (list), `prompt` | underline; one per line; then the prompt types |
| `network` | `title`, `hub: {name, logo}`, `tiles` (each `name`, `sub`, `logo`) | one per tile |
| `compare` | `a` and `b` (each `tag`, `title`, `lines`), `strikeW` | `a` is struck out; `b` is ticked |
| `chart` | `title`, `sub`, `bars` (each `label`, `v`, `text`, `hero`), `run` | none (racing from the first frame) |
| `save` | `title`, `sub` | the bookmark fills |
| `cta` | `keyword`, `send`, `signoff` | the keyword types; the sign-off card |
| `hook3d` (3D hero) | same as `hookCounter`, plus `count` (cards in the fan, default 12) | avatar shrinks to the cursor; then one per chip |
| `cards3d` (3D hero) | `title`, `sub`, `items` (up to 4 short lines, one per card) | the cards fan out from the stack into a grid |

3D hero scenes use real depth (three.js): paper cards with thickness, the key light from the top-left casting soft shadows on the desk, and a moving camera. Use one or two a reel, for the hook and the main reveal.

`logo` is a path to an official logo file in `logos/`. Without one the tile shows the name's first letter; logos are never redrawn.

## Rules that stay in force

- The storyboard is approved before a reel is posted, and you press post.
- Every number on screen has a named source in the reel's `script.md`.
- Every "I" statement is true for you.
- The last scene is always `cta`, which carries the outro.
