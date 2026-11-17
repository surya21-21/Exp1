# Motion pack

Kinetic type and operated interfaces, where elements carry from scene to scene instead of being replaced. Code: `motion.js` and `motion/` (`kit.js`, `morph.js`, `transitions.js`, `scenes-a.js`, `scenes-b.js`). Recipe cards with every number and source: `collection/recipes/pack-motion.md` (G01-G15). Demo strips: `collection/demo/motion/`.

A reel that uses these scene types should switch on the word clock, so moves can land on any spoken word: `"layers": ["wordClock"]`. Without it every scene still works from its beats.

## Transitions (`in`)

Every transition here also flies any `data-morph` pairs across (G01), so something always carries.

| Name | ID | From | Frames | Use |
| --- | --- | --- | --- | --- |
| `morphCarry` | G01 | T01-T24 carry, M20 | 6 + 10 (props `carry`: `lead`, `settle`, `stagger`) | The default change: elements with the same `data-morph` name travel from one scene into the other on an arc, changing size, corners and paint; the rest leaves and arrives around them. |
| `dotZoom` | G04 | T10, T05, T18 | 8 + 10 | Out of a statement into the next point: the camera dives into the old scene's `data-zoom` dot, which fills the frame and shrinks onto the new scene's `data-zoom` badge. |
| `typeWipe` | G02 | C06, T09 | 4 + 15 | A numbered chapter or one-word change of subject: `"wipe": "TWO"` slides in as giant letters with the next scene inside them, then the camera dives through a letter (`"wipeAt": [letter, x, y]`). |
| `blindFlip` | G03 | T11, T04 | 6 + 10 (`carry.strips`, `carry.turn`) | A section change with a full change of layout: six paper strips turn over in sequence. |

Options are read from the incoming scene's props. For a scene from another file, carried pairs are given by selector: `"morphIn": { "name": [selectorInOld or null, selectorInNew] }`.

## Scene types and their props

All of them build their own entrances (`selfEnter`) and accept `"stepped": 15` (G13: the whole scene on twos).

| Type | ID | Props | Beats, in order (and words used with the word clock) |
| --- | --- | --- | --- |
| `reelDeal` | G05 | `count` (12), `cols` (6), `label`, `counter: {from, to, land (a word), landAt (seconds)}`, `gridY`, `fanY`, `counterY` | the avatar becomes the cursor and the hand is dealt; the frame steps start ("viral", "by", the second "frame") |
| `countSlam` | G06 | `counter` (as above; digits carry with `reelDeal`), `word`, `wordSize`, `counterY`, `wordY`, `farY`, `midY`, `nearY` | the counter lands (the `land` word, or beat 0); the word lands on its spoken word, then its dot (`data-zoom`) |
| `chapterList` | G07 | `n`, `title`, `sub`, `items` (list), `tap` (row carried on, default 0), `badgeX`, `badgeY`, `rowY` | the number lands in the badge; the tap is on "found" |
| `trackTimeline` | G08 | `n`, `title`, `tracks` (12), `flag`, `reject` (list of words), `cardY`, `headY`, `rejectY`, `rejectSize` | chapter tile; waveforms draw; first rejected word; second rejected word ("twelve", "very", "first", "intro", "logo") |
| `tapeMeasure` | G09 | `n`, `title` (list of words, the last one boils), `bars` (each `label`, `v`; the first is the hero), `max`, `unit`, `tapeY`, `tapeW`, `stepped` | chapter tile; the last heading word; the tape starts; the number lands ("nothing", "sits", "seconds") |
| `soundLane` | G10 | `n`, `moves` (12), `keep` (indices that keep their sound), `of`, `statLabel`, `early`, `slam`, `slamSize`, `cardY` | chapter tile; sounds painted; the answer slams; half removed and the count; the push-in ("only") |
| `tallyDots` | G11 | `n`, `title`, `of` (12), `typed`, `rows` (each `label`, `n`, `icon`: `comment`, `follow` or `stop`), `dotsY` | chapter tile; one beat per row ("ending", "word", "follow", "stop") |
| `saveTap` | G12 | `title`, `button`, `done`, `titleY`, `buttonY`, `avatarY` | the first word slams ("this", "edit" presses the button) |

Carry names the scene types share: `dg0`-`dg4` (counter digits, `reelDeal` to `countSlam`), `head` (`chapterList` row to `trackTimeline` header), `tile` (chapter tile, `trackTimeline` to `tapeMeasure` to `soundLane` to `tallyDots`), `ruler` (`tapeMeasure` tape to `soundLane` ruler), `mk0`-`mk11` (`soundLane` marks to `tallyDots` dots), `pill` (`saveTap` button, to the `cta` comment field by selector). Zoom pair: `countSlam` dot to `chapterList` badge.

## Layers

| Name | ID | Where | Options | What it does |
| --- | --- | --- | --- | --- |
| `wordClock` | G14 | `under` | none | Draws nothing; puts every spoken word with its time in `ctx.shared.words` (helpers `wordAt`, `wordEnd`, `reelWord` in `kit.js`). |

## Notes for whoever builds on this

- Transition graphics go in the `pack-over` slot (above the scenes, under the avatar, captions and grain), and the incoming scene's `z-index` is cleared, so a carry never covers the cursor or the captions.
- `exit(k)` on a scene lets it choose how it leaves under a carry (the hook's cards fly past the camera; the list's rows fall away).
- Key elements are marked on readable claims (a title, a flag, a count), not on containers, so a camera push-in can crop a container without leaving the safe zone.
- Everything is a function of time; the on-twos grid starts at each scene's own first frame.
