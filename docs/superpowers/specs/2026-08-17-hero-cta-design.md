# Hero call-to-action buttons — design

Homepage hero, 3dprintcraft.gr redesign. Mobile-first.

## Problem

Measured on the live hero, both buttons were 58px tall, 16px, **weight 700 —
typographically identical**, so neither led. The secondary was a 14% white wash
with no border, which reads as a smudge over the gradient rather than a control.

Below roughly 400px the two buttons did not stack by design: `201px + 169px +
14.4px gap = 384px` overflowed the row and wrapped, leaving two pills of
different widths. What looked like a stacked layout was an accident.

## Decision

Two full-width bars below 720px (option B of three explored). Desktop keeps the
existing side-by-side row.

| | Primary | Secondary |
|---|---|---|
| Label | Δες τη δουλειά μας | Στείλε μας DM |
| Target | portfolio.html | Instagram |
| Fill | white | `rgba(6,10,35,0.28)` |
| Text | `--ink` | white |
| Weight | 700 | 600 |
| Border | 2px transparent | 2px `rgba(255,255,255,0.6)` |
| Glyph | → | ↗ |

Both 61px tall, full width, 12px apart, labels left-aligned with glyphs pushed
right by `justify-content: space-between`.

## Why these numbers

From the ui-ux-pro-max database:

- **44×44px minimum touch target** (high severity) — both bars are 61px.
- **8px minimum between adjacent targets** — 12px.
- **Hero pattern: one dominant CTA.** Option B keeps two buttons, so dominance
  comes from weight rather than count: solid vs outlined, 700 vs 600.
- **4.5:1 minimum text contrast.** White on the gradient's lightest stop
  (`#4a6bff`) measured **4.34:1 — a failure**. The dark wash behind the
  secondary lifts it to **6.82:1** at that stop, 8.23:1 mid, 15.61:1 at the dark
  end. The wash is invisible against the dark end of the gradient.
- **Animation 150–300ms** — the arrow nudge is 200ms, disabled under
  `prefers-reduced-motion`.

## Implementation

`assets/css/hero-cta.css`, loaded after `site.css` on `index.html`. Touches only
`.hero-actions` and its buttons. The transparent 2px border on the primary
exists solely to match the outlined secondary's height — without it the
outlined bar stands 3px taller.

## Verified

| Check | Mobile (375px) | Desktop (1280px) |
|---|---|---|
| Direction | column | row |
| Widths | both 340px | 228 / 193, auto |
| Heights | both 61px | both 61px |
| Gap | 12px | default |
| Touch target | pass | pass |

## Instagram glyph

Inline SVG in the button markup rather than a file: no extra request, and
`currentColor` means it follows the button's colour without a second rule.
Three shapes — rounded square, lens circle, corner dot — at 19px, `aria-hidden`
so the link's accessible name stays "Στείλε μας DM".

Kept monochrome and unaltered. The glyph is Instagram's trademark; using it to
label a link to the studio's own account is ordinary nominative use, but it
should not be recoloured, stretched, or combined with other marks.
