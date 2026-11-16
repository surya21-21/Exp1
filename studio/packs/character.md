# Character pack

The avatar drives the story: a paper puppet with a body walks, points, reacts, sits on the cards, uses props and rides the transitions. Recipe cards with all numbers: `collection/recipes/pack-character.md` (R01-R15). Demo pictures: `collection/demo/character/`.

Switch it on in `reel.json`:

```json
"layers": ["puppet"],
"options": { "puppet": {} }
```

## Layer

| Name | z | Options | What it does |
| --- | --- | --- | --- |
| `puppet` | `front` | `heads`, `expressions` (folders; default the brand ones) | Draws the puppet on every frame from the current scene's `character(t)`, or from the transition's `character()` inside its window. Hides the engine's bust and cursor chip on every frame he is drawn. Keeps a `data-key="avatar"` box over him for the audit. Gives each scene `ctx.shared.puppet.fg(index)`, a layer in front of him that moves with that scene. Engine scene types without `character()` use an adapter: `cta` shows the large approved face low on the left, which becomes the picture in the sign-off card and grins after Follow. |

## Scene types (`type`)

| Type | Props | Beats, in order | He does |
| --- | --- | --- | --- |
| `charHook` | `label`, `sub`, `chips` (list), `frames` (frames per reel, summing to the total) | the head flies down and his body unfolds; the stomp that lands the total | big face talks; unfolds; hops across the reels counting them; stomps the counter home; points at it |
| `charDeal` | `title`, `sub`, `items` (4 short lines) | the deal (cards 2, 3, 4 fly to the wall, 3 frames apart) | deals with flicks of the wrist; shows card 1 at his side; winds up to throw it |
| `charUnderline` | `kicker`, `name`, `line`, `a`, `b` (the two rejected cards), `ledgeY`, `cardRect` (for `charThrow`) | finger up ("one"); the run that underlines; the golf swing at `a`; the stomp on `b` | runs along the card's top edge with a giant pencil; knocks `a` off; flattens `b` |
| `charMeasure` | `title`, `sub`, `bars` (as `chart`; the first is the hero, `text` is shown in the lens), `seatY`, `hole`, `holeCard` (for `charHole`) | (legs never stop); the magnifier; a head tilt | sits on the card's top edge, legs swinging; holds a magnifier over the first bar |
| `charMute` | `title`, `label`, `early` | every speaker blares; "No." (jump and slam); the muting run starts; the strip | covers his ears; slams the desk; mutes every other channel; points at the strip |
| `charSort` | `kicker`, `title`, `piles` (each `n`, `label`) | stack held up; the stream into pile 1; one card high into pile 2; two dropped into pile 3 | deals the endings into piles, shrugs |
| `charSave` | `title`, `sub`, `face` ([x, y, size] of the large face, for `charPush`) | the bookmark fills | the large face nods to the bookmark, winks |
| `charDemo` | `S`, `y` | none | test bench for the puppet: front pose, walk, point, react, hop, sit (not for reels) |

## Transitions (`in`)

| Name | Frames | He | Use |
| --- | --- | --- | --- |
| `charTear` | 18 (lead 10, settle 8) | grabs the right edge and leaps across dragging it; the torn edge follows his fist | Chapter changes: our signature tear, with a cause |
| `charThrow` | 14 (6, 8) | throws the card in his hand at the camera; it fills the frame and lands as the next card | Into a detail the card names (needs a `card` prop in his hand) |
| `charLift` | 18 (8, 10) | jumps off the old ledge, lands on the next card as it rises, rides it up sitting | Step to step |
| `charHole` | 24 (12, 12) | hops into a punched hole that shows the next scene, climbs up behind the next desk | A change of place |
| `charWhip` | 14 (4, 10) | is whipped off with the scene, flies in with the next, lands with a squash | A fast change of subject |
| `charPush` | 10 (10, 0) | the camera rams into his face until it is the next scene's large face; hard cut | Energy into a close-up |

## Actions (`act.js`), for new scene types

`stand(x, y, S)` starts a pose; then, in order: `idle`, `walk(walkPlan(...))`, `hop`, `point`, `reach`, `armsTo`, `look`, `face`, `react` (`leanBack`, `tilt`, `shake`, `nod`), `sit`, `carry`, `push`, `haul`, `bigHead`. Props in his hand (`pose.props`): `pencil`, `stamp`, `magnifier`, `sign`, `card`, `stack`. `solve(resolve(pose))` gives the joints, so a scene can put its marks exactly where his hand or a prop's tip is.
