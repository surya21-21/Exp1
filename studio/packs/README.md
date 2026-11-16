# Packs

A pack adds scene types, transitions and whole-reel layers to the reel engine without changing `engine.js`. One file per pack in this folder (`camera.js`, `motion.js`, `character.js`), plus a folder of the same name when a pack needs more files. `index.js` lists the packs the engine loads.

A pack exports three things. Any of them may be empty.

## `SCENES`

`type -> (wrap, props, ctx) => { update(t), avatar(t), lamp(t), cues }`, exactly like `studio/scenes.js`.

- `t` is seconds since the scene's start. Every value is a function of `t`: no state kept between calls, no randomness without a fixed seed.
- `ctx`: `accent`, `blur(el, x, y)`, `dur`, `beats`, `pre`, and for packs also `index`, `start`, `end`, `total` (the reel's length), `count` (number of scenes), `options` (the reel's `"options"`), `shared`.
- `ctx.shared` is one object per reel. A layer can put something there (a 3D world, a character rig) and every scene and transition can use it.
- `avatar(t)` returns the brand avatar's state (`bust`, `chip`); return nothing to hide it.
- `cues`: `[{ t, sfx, gain }]`, seconds into the scene. Sound names are the files in `assets/sfx/`.
- Mark what the viewer must be able to read with `data-key="name"`: the safe-zone check measures those boxes. For something drawn on a canvas or in 3D, place an empty `div` with `data-key` and `data-proxy` over its box on screen.

## `TRANSITIONS`

`name -> (overlay, ctx, info) => { lead, settle, both, sfx, gain, apply(p, out, inn, at, win), off() }`, exactly like `collection/lib/transitions.js`.

- `lead` and `settle` are frames before and after the scene boundary; `p` runs 0 to 1 across them.
- `both: true` shows the two scenes together during the window (the incoming one on top).
- `info`: `{ index, from, to }`, the two scenes' entries from the timed spec.
- `win` (fifth argument of `apply`): `{ p, name, from, to, after, both, lead, settle, boundary, t, A, B }`, where `A` and `B` are what the two scenes returned.

## `LAYERS`

`[{ name, z, make(el, spec, ctx) => { update(frame), cues, ready() } }]`: something that lives for the whole reel, such as one 3D world under every scene or a character above them.

- A reel switches a layer on by name: `"layers": ["world"]` in `reel.json`. Reels that do not ask for it are not touched. Settings go in `"options"`.
- `z` is where it sits: `under` (between the paper and the scenes), `over` (above the scenes, under the brand avatar) or `front` (above the avatar, under transitions and captions).
- Layers are made before the scenes, so a scene can use what the layer put in `ctx.shared`.
- `update(frame)` runs on every frame, after the scenes have updated. `frame`: `t` (seconds into the reel), `index`, `local` (seconds into the current scene), `main` (the current scene), `scenes` (all of them: `type`, `props`, `start`, `end`, `in`, `beats`, `impl`, `wrap`), `win` (the transition window, or null), `speaking`, `state` (the brand avatar's state; a layer may replace `frame.state`), `fps`, `duration`.
- `cues`: `[{ t, sfx, gain }]` in seconds from the start of the reel.
- `ready()`: a promise the engine waits for before the first frame (images, fonts).

## Rules

- Names are unique across the engine; a clash stops the engine with an error.
- Paper Studio stays the background. A canvas or 3D layer is transparent and only its objects and shadows are drawn over the paper.
- The key light comes from the top-left; shadows are warm brown and fall down and to the right.
- Each new scene type, transition or layer gets a recipe card in `collection/recipes/` and a demo still in `collection/demo/`.
