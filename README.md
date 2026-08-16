# 3DPrintCraft — portfolio redesign

A redesign proposal for the live site at https://3dprintcraft.gr (a friend's site).
Nothing here is deployed. The live site is untouched.

## Folders

| Folder | What it is |
|---|---|
| `current/` | Exact copy of the live site as downloaded on 16 Aug 2026. Reference only — never edit. |
| `redesign/` | The proposal. This is where all work happens. |
| `.claude/launch.json` | Preview servers: `redesign` on port 4331, `current` on 4332 for side-by-side. |

## Looking at it

Start the preview from Claude Code, or manually:

```bash
npx serve redesign -l 4331
```

Then open http://localhost:4331/portfolio.html

## Changing the portfolio

`redesign/data/projects.json` is the source of truth for all 28 projects.
The grid in `portfolio.html` is generated from it — do not hand-edit the markup
between the `BUILD:GRID` markers, it gets overwritten.

To add a project: add an entry to `projects.json`, drop the photo in
`redesign/assets/img/work/`, then:

```bash
cd redesign && npm run all
```

| Command | What it does |
|---|---|
| `npm run images` | Makes WebP versions of every photo (640px for the grid, 1400px for fullscreen) |
| `npm run build` | Regenerates the portfolio grid from `projects.json` |
| `npm run all` | Both, in order |

## What changed vs the live site

- Portfolio grid rebuilt: 2 columns on phones, 3 on tablets, 4 on desktop.
  Cards alternate sliding in from the left and the right as you scroll.
- Cards support multiple shots: they cycle on hover with a mouse, and on a
  2.6 second timer on phones — but only while the card is actually on screen.
- Fullscreen gallery: the whole photo always fits on screen, then tap (or use
  the + button, or scroll wheel) to zoom to 2.6x and drag to look around.
  Swipe on touch, arrow keys and buttons with a mouse, thumbnail strip,
  position counter. Changing shot resets the zoom.
- Photos converted to WebP: 3,258 KB of JPEGs became 719 KB. First load of the
  portfolio page is now about 363 KB.
- Filter chips are 44px tall (comfortable tap size) and stick to the top while
  scrolling.
- Works with JavaScript switched off: every card is a plain link to its photo.
- All motion is disabled for visitors who have "reduce motion" turned on.

- Hero masthead video on the homepage: the logo medallion sting, blended so its
  black background disappears over the blue hero. 2,673 KB source became a
  313 KB mp4. It only loads when motion is welcome and the connection is not
  metered; otherwise the original SVG torus / benchy render stays.

## Mobile portfolio (below 720px)

The grid stops being a long scroll and becomes pages of four projects, one
screenful each, advanced by a single swipe up — never a continuous scroll.

- Page 1 runs a tour: each card grows while the others dim, cycling that
  project's shots at 1.2s each. Later pages cycle shots without growing.
  The two five-shot projects lead page 1 so the tour has something to show.
- Any tap ends the tour and opens what was tapped.
- A batch slides up as one block when you swipe; the closing call to action and
  the footer appear only on the last page.
- Swiping uses `touchstart`/`touchend`, and the grid is `touch-action: none`.
  With `pan-y` the browser claims vertical drags and fires `pointercancel`, so
  paging worked with a mouse and was silently dead on a phone.
- An origami intro video plays on every load before the grid. Skipped on
  desktop, on metered or slow connections, for reduced-motion visitors, and via
  the Skip button. If the video file is missing it is skipped silently.
  `?intro=1` forces it, `?intro=0` skips it, and `?intro=1` also records a
  timeline to `sessionStorage['pf-intro-log']` — far more reliable than trying
  to watch a four-second animation on someone else's phone.
- The homepage hero video plays once and holds its last frame.
- The portfolio background is a folded-paper field (`assets/img/pattern-origami.svg`,
  2 KB) built from the real logo paths, so the page continues the white sheet the
  intro video unfolds into. Density and strength are the `background-size` and
  `opacity` on `.pf-paper` in `portfolio-v2.css`.

Desktop is untouched — still the 4-column grid with left/right slide-in.

### Regenerating the intro video

Raw clips from Higgsfield come back as HEVC, which most browsers refuse to
play, so re-encoding is mandatory, not an optimisation. Sources are kept out of
the web folder in `video-sources/`.

```bash
cd redesign && npm run intro
```

Prompt, model and settings that produced the current one: `video-prompt.md`.

## Multi-shot projects

Two projects carry five shots each — the real photograph first, then generated
ones. Every generated shot is marked `"generated": true` in `projects.json`.

| Project | Shots |
|---|---|
| `12-logo-bag-tag` | real photo + 4, sliced from a Higgsfield contact sheet |
| `15-zeta-heart-keychain` | real photo + 4, generated via `higgsfield product-photoshoot` |

**These are AI renders of real products, not photographs of them.** Say so when
showing the site to the owner.

To add shots to another project:

```bash
cd redesign
node build/set-shots.mjs <project-id> <file> [file …]
npm run all
```

## Temporary things to remove later

- `redesign/build/extract-projects.mjs` and `patch-portfolio.mjs` — one-off
  migration scripts, already run.
- `redesign/build/make-placeholder-shots.mjs` — generated stand-in crops before
  real shots existed. No project uses them any more.
