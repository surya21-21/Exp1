# Reel style guide (from 6 reference reels)

Measured from 6 vertical AI-tool reels (720x1280, 30fps, 37-90s): Piyush Singh (video from code), Do Agenticly (10 animation styles, Hinglish), Ben Zogby x3 (Ripping app), and a "5 MCPs" reel. All six are faceless motion-graphics reels with a voiceover and burned-in captions.

Method: frames compared every 0.2s, hard cuts detected frame by frame, captions read with OCR and cleaned into transcripts, words counted against speaking time. Treat numbers as approximate (about ±10%).

## The numbers

| Reel | Length | Words/sec | WPM | Hard cuts | Visual beat every* | 0.2s windows with change |
|---|---|---|---|---|---|---|
| Piyush (video from code) | 42s | 3.0 | 181 | 0 (one canvas, elements morph) | ~1.0s | 100% |
| Do Agenticly (10 styles, Hinglish) | 90s | 2.9 | 176 | 7 | ~1.1s | 100% |
| Ben: trial reels | 43s | 4.2 | 250 | 6 transitions (~every 6.3s) | ~1.0s | 100% |
| Ben: app made this | 40s | 4.0 | 242 | 12 (~every 3.1s) | ~1.2s | 99% |
| Ben: solo founders $1M ARR | 56s | 4.1 | 244 | 18 (~every 3.0s) | ~1.5s | 99% |
| 5 MCPs | 37s | 3.1 | 187 | 0 (one canvas) | ~1-2s (by eye) | 94% |

*Visual beat = at least 12% of the picture outside the captions differs from 1 second earlier.

**What this means:**
- **Speech: 3-4 words per second** (176-250 WPM). Calm explainers sit at about 3, Ben's sales style at about 4. The sound never drops out: under 3% of the audio is near-silent, so pauses are cut tight and covered by music.
- **Something changes in essentially every 0.2s window.** Usually it's both the caption (next word appears or gets highlighted) and the visual (counter ticking, cursor moving, element sliding, slow camera drift). A fully frozen 0.2s window is rare (0-6%).
- **Nothing sits still for more than about 1-2 seconds.** The longest near-still stretch in any reel was 1.0-2.2s.
- **New visual idea every ~1-1.5s.** A new card, icon, number, UI state or diagram.
- **Hard cuts are optional.** Piyush and the MCP reel never cut. They keep one canvas and animate elements in and out. Ben cuts or wipes every ~3s.

## How they hold attention

### The first 3 seconds (looked at every 0.2s)
- **Frame 0 is already moving.** A counter counts up (0.64M to 5.54M subs in 1s; $337,412 to $1,000,000 in 1s), a bar chart races, or a montage flips through 5 payoff visuals at one every 0.2s (Do Agenticly).
- **The claim lands in the first sentence** and names the tool or the payoff: "You can now build an entire YouTube channel without paying for a single video tool." "Stop using Claude without these five MCPs." "The fastest way to hit $1 million ARR..."
- **The keyword pops big, then settles.** The key word (Claude, million, ARR) appears 2-3x size for ~0.4-0.6s, then shrinks into the sentence line.
- **Problem contrast early.** A "GENERIC" stamp on a grey box, a price list struck through ("paying for a single video tool").

### Captions
- Word-by-word, synced to the voice. Either karaoke (2-4 words on screen, active word in accent color; Piyush, Do Agenticly) or a sentence that builds up word by word (Ben, MCPs).
- One keyword per line is styled differently: italic serif, accent color, or a highlight box.
- Caption position varies by style: bottom third (Piyush, Do Agenticly), top fifth (Ben, MCPs), middle (Ben trial reels).

### Dialogue delivery
- **Short lines, spoken fast with no gaps.** Most reels average 8-12 words per sentence. Ben's trial-reels video averages 22 but never pauses.
- **Question, then answer.** "Don't know what to post? It digs through... Not sure how to say it? It turns... Can't edit? Pick one of 100 styles..." Each objection takes about 3-5s.
- **Numbered list.** "One, Perplexity. It gives Claude live search..." Each item gets ~5s (MCP reel: items at 4s, 10s, 15s, 20s, 25s). Do Agenticly: ~5-7s per style.
- **Pattern interrupts.** "But that's not even the craziest part." "Yes, really." "My favorite part:"
- **Proof with numbers.** "over 2M views in the last 2 months", "66 styles", "100K views".
- **Analogy and callback.** Do Agenticly opens with a restaurant analogy (tell the waiter "bring something", what do you get?) and returns to it mid-video.
- **Save prompt mid-video.** "Save this so you can come back to it" (MCPs, ~31s), "Save karlo" (Do Agenticly, ~66s).
- **Comment-keyword CTA in the last 3-5 seconds.** "Comment VID / RIP / MCP and I'll send you..." The keyword is shown huge on screen.

### Visual style
- Each reel keeps one look the whole way: one background family, one accent color, one type pairing (bold sans + italic serif or highlight).
  - Piyush: near-black, lime accent, bold caps + italic serif.
  - Do Agenticly: off-white 3D studio with pedestals, lime accent, big numbered cards.
  - Ben: cream paper or white/navy or white/charcoal with gold. 3D-looking UI cards, floating pixels, pixel-block wipe transitions, a progress bar at the bottom.
  - MCPs: white with thin wireframe UI, blue italic keywords, a line-drawn avatar character.
- **Real UI as the visual.** Screenshots and rebuilt app screens (GitHub page, prompt box, terminal render bar, dashboards) are the main material.
- **Constant slow drift.** The camera always pushes or floats slightly, so even a "still" card moves.

## Rules for our reels (Remotion)

| Setting | Value |
|---|---|
| Size | 1080x1920, 30fps |
| Length | 45-60s |
| Voice speed | 3.0-3.5 words/sec (~180-210 WPM); 3.5+ only for hype sections |
| Captions | Word-by-word, synced from Whisper word timestamps; 1 keyword per line in the accent color |
| Change rate | Something animates in every 0.2s; a new visual element every 1-1.5s; never more than 1.5s fully still |
| Scene change | Wipe or cut every 3-6s, or one continuous canvas with elements swapping in place |
| Hook (0-3s) | Moving from frame 0 (counter, montage or race), claim plus tool name in sentence 1, keyword pop |
| Body | One list item per 4-6s: number card, name, what it replaces (price struck through), one-line benefit |
| Middle | Pattern interrupt ("But here's what I got wrong...") around 40-50%; save prompt around 60-70% |
| End | Comment-keyword CTA in the last 4s, keyword shown huge |
| Look | One background, one accent, bold sans + italic serif keyword, real UI screenshots, slow constant camera drift |

### Template for "9 GitHub repos that replace paid subscriptions" (~55s)
- **0-3s hook.** A counter of monthly subscription cost ticking up, then struck through: "These 9 free GitHub repos replaced $___/month of my subscriptions."
- **3-6s stakes.** A line about your journey or a mistake you made.
- **6-51s: 9 repos x ~5s each.** Number card, then repo card (name + stars), then paid tool with price struck, then a one-line benefit. A savings counter climbs the whole time.
- **~30s pattern interrupt.** "Number 6 is the one I wish I'd found first."
- **~38s save prompt.**
- **51-55s CTA.** "Comment REPO and I'll send you all 9 links."
