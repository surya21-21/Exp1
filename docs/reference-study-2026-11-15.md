# Reference study: 12 reels (15 Nov 2026)

Twelve reels the user chose as references, each reported by the user as its creator's most viral (above 500k views). Studied for layout, UI handling, avatar use, transitions and script structure. Study only; nothing here is reused as footage.

## How this was studied, and its limits

- Every frame measured with `scripts/study_reference.py` (cuts, motion peaks, shot lengths).
- Looked at: every reel's first 3 seconds at 10 frames a second, every reel's full body at 1 frame a second, and three 20-frame strips across transitions at full frame rate (r03, r05, r10).
- **Not done:** no speech transcript (Whisper is not available in the cloud workspace), so script notes come from on-screen captions only. No sound labelling (it runs only on GitHub, and the videos were not sent there). The remaining burst strips were generated but not all viewed.
- "Still share" from the script is unreliable on these files (it reads 46-72% on reels that clearly move); treat it as a bug to fix, likely repeated frames from re-encoding.

## The numbers

| # | Reel | Length | Hard cuts | Motion peaks | Median shot | Build |
| --- | --- | --- | --- | --- | --- | --- |
| r01 | EarnEdits, "Editing alone" (Discord) | 39.5 s | 14 | 15 | 1.8 s | Illustrated scenes, cut and whip |
| r02 | EarnEra, "Purple Cow" branding rule | 43.4 s | 19 | 12 | 1.35 s | Mixed media, fast cuts |
| r03 | Dami, "Claude Code sounds" | 28.7 s | 7 | 13 | 1.0 s | Demo of styles, spins and pushes |
| r04 | Ben Zogby, "trial reels" | 42.9 s | 17 | 5 | 1.9 s | Paper studio, cut every ~2-3 s |
| r05 | Ben Zogby, "app made this video" | 39.9 s | 12 | 3 | 2.8 s | Dark/light flip, pixel wipe |
| r06 | Ben Zogby, "$1M ARR" | 56.1 s | 18 | 0 | 2.7 s | Dark/light flip, pixel wipe |
| r07 | Do Agenticly, "10 animation styles" | 90.4 s | 15 | 25 | - | 3D gallery, camera travels |
| r08 | Piyush Singh, "videos from code" | 42.4 s | 1 | 17 | - | One dark canvas |
| r09 | mrcreates.ai, "AI video editing setup" | 83.6 s | 0 | 18 | - | One canvas, never cuts |
| r10 | mrcreates.ai, "Claude + five tools" | 37.0 s | 0 | 4 | - | One canvas, never cuts |
| r11 | mrcreates.ai, "personal video editor" | 32.7 s | 2 | 8 | - | One canvas |
| r12 | mrcreates.ai, "six settings" | 72.6 s | 2 | 9 | - | One canvas |

Two families: **cutters** (r01-r06: a cut or wipe every 1 to 3 s) and **one-canvas builders** (r08-r12: zero to two cuts in the whole reel; everything slides, morphs or swaps in place). Both went viral. The choice follows the content: persuasion and lists cut; tutorials stay on one canvas.

## Hooks: what frame zero and the first 3 seconds do

| Reel | Spoken or shown hook | What is on screen by 1 s |
| --- | --- | --- |
| r01 | "Editing alone ... lonely road" | Keyboard and hands slide in; pixel title assembles |
| r02 | "This is a branding rule every entrepreneur needs to know" | Tiny text on black, one word highlighted, then flash to a photo grid |
| r03 | "Claude Code makes great motion, but the sound..." | Revenue counter racing $0 to $48,210 inside a dashboard; "Free sounds at the end" badge pinned on top from frame 0 |
| r04 | "Claude can now post trial reels for you, up to 10 times a day" | Racing bar chart of view counts already moving at frame 0 |
| r05 | "This brand new Claude plugin lets you run your Instagram on autopilot" | Real logos as cards, a toggle that flips ON at the word "autopilot" |
| r06 | "The fastest way to hit $1 million ARR" | Counter racing to $1,000,000 with a rising line chart |
| r07 | "Claude animation, 10 styles ke naam" | Ten different style posters flashing on a pedestal at about 0.2 s each, then a "GENERIC" stamp |
| r08 | "You can now build an entire YouTube channel in one prompt" | Subscriber counter racing 0.51M to 5.54M on a rebuilt channel page |
| r09 | "Everyone is editing videos with Claude now, but most people lock..." | Avatar alone, centre; a live counter chip appears; then a $497 checkout card |
| r10 | "Stop using Claude without these five MCPs" | Title "Claude + five tools." fixed; avatar; five tool icons connect by lines |
| r11 | "I turned Claude into my personal video editor" | Avatar, then a staff ID badge on a lanyard drops in with Claude's logo |
| r12 | "Forget hashtags, if you want more views you need these six settings" | Hashtags around the avatar get struck through and fall away; a views chip counts up |

Patterns:
1. **A number is already moving at frame zero** (r03, r04, r06, r08, r09, r12). Counters start mid-run, never at rest.
2. **The promise sits on screen as a fixed title** while captions change under it (r03 badge, r07, r08, r10).
3. **The first 3 seconds contain 3 to 5 distinct visual events**, each tied to a spoken word.
4. **A physical metaphor makes the claim concrete**: staff badge = "my editor", toggle = "autopilot", struck hashtags = "forget hashtags", checkout card = "paid courses".
5. **A bonus is promised up front** and paid at the end (r03: "Free sounds at the end").

## Layout and UI handling

- **Fixed furniture, changing middle.** Each creator keeps a frame that never moves: brand chip top-centre (Ben Zogby "Ripping"), a header strip and progress dots (mrcreates), a section label pill (Dami), a number badge "01 ... 05" (r10). Only the middle zone changes.
- **Three vertical zones.** Caption or headline in the top fifth; the UI card in the middle; the avatar or a secondary card below. Nothing important in the bottom fifth.
- **Rebuilt UI, simplified.** Real product screens (Instagram settings, GitHub repo, checkout, Claude app, terminal) are redrawn as clean cards: rounded corners, 1 px borders, soft shadow, only the 3 to 6 rows that matter, grey bars for the rest.
- **One thing highlighted per moment.** A row gets a blue outline, a toggle flips, a cursor arrives, or a magnifier circle sits on the detail. The viewer never has to search.
- **Real logos as small tiles** in rounded squares, connected with thin curved lines to show "this talks to that" (r09, r10).
- **Progress is always visible**: dots (r12), numbered steps "01/05" (r10), a vertical timeline rail down the left edge with a node per step (r09), a day scale along the bottom (r04).
- **State change as proof**: toggles turn on, checkboxes tick, bars fill, "Follow" becomes "Following", counters land. Every claim is shown as a UI state changing.
- **Background follows mood**: Ben Zogby flips the same layout between dark and light every beat; mrcreates switches a section to dark for one tool, then back; one accent colour per reel throughout.

## Avatar use (mrcreates.ai, r09-r12)

This is the closest model for our avatar.

- **Opens alone, centre, large** (about a third of the frame width) on a faint grid with a soft glow behind it, for the first second.
- **Then gets out of the way**: by about 2 s it shrinks to a small head (about 6-8% of width) and moves to a corner or beside the card, so the UI gets the frame.
- **It acts as the cursor.** The small head travels to whatever is being discussed: it sits on the toggle being flipped, the row being tapped, the button being pressed, the end of a connecting line. It replaces the mouse pointer.
- **Expressions change with the line**: neutral, open-mouth talking, a wink, a tilt. Blinks are frequent. The head tilts a few degrees when moving.
- **It rides the timeline**: in r09 a small head travels down the left-edge timeline rail as steps complete.
- **It returns large for the save prompt and the outro** ("Save this." with the avatar centre), then becomes the profile picture in a rebuilt Instagram profile card where "Follow" is tapped and turns to "Following".
- **Flat line art, no shading**, on a near-white background. Reads clearly at tiny sizes because the face is simple: hair shape, round glasses, mouth.

For us: our avatar is more detailed (beard, headphones, shading). At cursor size the detail will blur, so we need a simplified small version (head only, bolder lines) alongside the full bust.

## Transitions (from the 30 fps strips)

- **Ben Zogby pixel-block wipe (r05):** about 8 frames end to end. The outgoing scene breaks into small squares for 2 to 3 frames, a flat background colour fills, then the incoming cards assemble from scattered squares over 4 to 5 frames while the caption's first word is already readable. The brand chip at the top never moves. The background flips dark to light on the same cut.
- **Dami spin-push (r03):** the camera pushes into a spinning object over about 4 frames with heavy motion blur, the colour floods the frame, and the next title is already there on frame 5. Colours swap on single frames after that (flash cuts on the beat).
- **mrcreates in-place build (r10):** no cut at all. Icons fade in one by one about 2 frames apart, lines draw from each icon to the centre over about 6 frames, the caption's keyword gets its highlight box as the line lands.
- **Caption style, mrcreates:** light grey sans words appear one at a time; the keyword turns italic serif inside a pale highlight box; the previous phrase blurs out as the next begins.
- **Caption style, Ben Zogby:** bold sans at the top, word by word; the key word arrives huge (2-3x) in the accent colour, overlapping the line, then shrinks into place within about 6 frames.
- **Do Agenticly (r07):** a 3D gallery. Each style is a poster on a pedestal; the camera glides to the next pedestal, the room colour changes to match the style, and props spill out of the poster into 3D (coins, tube lines, blocks). A restaurant "cloche" metaphor bookends it.

## Script structure (from on-screen captions; no audio transcript)

- **Sentence one names the tool and the payoff** in under 3 s (all 12).
- **Problem, then tool, then proof, then how, then ask.** Ben Zogby: claim, "but that's not even...", "most people use AI for video, the hard part was never making the video", "this tool lets you...", a run of features each shown as a UI state, "no expensive token limits or API credits", proof number ("over 2 million views in 2 weeks"), "completely free for 7 days", "Comment RIP".
- **Objection beats as question cards**: "Don't know what to post?", "No time to post?", "Hate being on camera?" each answered in one line with a toggle turning on.
- **Numbered walk-through for tutorials**: "First... Then... Next... Last step..." (r09), "01 Perplexity ... 05 Chrome MCP" (r10), "First... Second... Three... Four... Five..." (r12). Each step is one UI screen with one highlighted action.
- **Enemy first**: paid courses ($497 checkout card), paid tools (struck price list), hashtags, generic prompts ("GENERIC" stamp). The reel is framed against something the viewer already resents.
- **Metaphor carried through**: restaurant waiter and dish (r07), staff badge (r11), lonely road (r01), purple cow (r02).
- **Save prompt mid-to-late** as its own full-screen card: "Save this. Your next workflow upgrade." (r10).
- **Outro, same shape in 9 of 12**: "Comment WORD and I'll send you ..." with the keyword huge, then a rebuilt profile card where Follow is tapped. Keywords seen: RIP, SOUND, VID, MCP, EDIT, DISCORD.
- **Honest specifics inside the UI**: file names, folder trees, the exact prompt text, real settings paths. Detail reads as proof.

## What to take into our reels

1. Start with a counter or chart already moving, and the promise as a fixed title.
2. Pick the family per reel: cuts for list or persuasion reels, one canvas for tutorials.
3. Keep fixed furniture: our progress bar, a section number, and a brand chip.
4. Make a small "cursor" version of our avatar and let it travel to the thing being discussed; large only at the hook, save prompt and outro.
5. Rebuild real UI as simplified cards and show every claim as a state change.
6. One highlight at a time: outline, toggle, magnifier or the avatar.
7. Transitions: a signature wipe for cut reels (ours should be our own, not the pixel wipe), in-place builds for tutorials.
8. Outro: keyword tile, then our profile card with Follow tapped, then "This is your AI guy."

## Still to do

- Transcribe the audio (Whisper on GitHub or the server) to study the spoken scripts and words per second.
- Run the sound labelling on these 12.
- View the remaining burst strips and write transition recipes with exact frame counts for r01, r02 and r07.
- Fix the still-share measure in `study_reference.py`.
