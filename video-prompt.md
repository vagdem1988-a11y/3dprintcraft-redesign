# Portfolio intro video — origami unfold

Mobile only. Plays once per session when the portfolio page opens, then
cross-fades into the grid of projects.

## Model and settings

**Model: `seedance_2_5`** — the only video model here that accepts a real
**start image**, so frame 1 is your actual medallion rather than a lookalike.

| Setting | Value | Why |
|---|---|---|
| mode | `omni_reference` | required in order to pass a start image |
| start_image | `hf_20260719_092037_10f5b14e-d535-4201-b735-9a66d3e8257f.png` | the medallion render |
| aspect_ratio | `9:16` | mobile only |
| resolution | `1080p` | it fills the whole screen |
| duration | `4` | an intro longer than this gets skipped |
| generate_audio | `false` | the site must never make noise |
| bitrate_mode | `high` | large flat gradients band badly at standard |

## The prompt

Locked-off centred shot on a black studio background. A circular badge — black
outer ring, white disc, a sharp blue origami-style lightning mark raised on its
face — sits perfectly centred. The black ring and the white disc quietly
dissolve into fine drifting particles and fade to nothing, leaving only the blue
origami mark floating alone in the dark. The blue paper then begins to unfold:
each angular triangular fold swings open in sequence, creases straightening, the
sheet flattening and expanding smoothly toward the camera. The opening sheet
keeps growing until it fills the frame completely edge to edge, its deep blue
lightening as it flattens, resolving into a clean, empty, evenly lit off-white
surface. Final frame: a flat, featureless off-white field, no object, no text,
no shadow. One continuous move, no cuts, premium product-film feel.

## Command

Run from `C:\Users\vagde\Desktop\Webdesign\3DPrintCraft`:

```powershell
higgsfield generate create seedance_2_5 `
  --mode omni_reference `
  --start-image ".\hf_20260719_092037_10f5b14e-d535-4201-b735-9a66d3e8257f.png" `
  --aspect_ratio 9:16 `
  --resolution 1080p `
  --duration 4 `
  --bitrate_mode high `
  --generate_audio false `
  --prompt "Locked-off centred shot on a black studio background. A circular badge - black outer ring, white disc, a sharp blue origami-style lightning mark raised on its face - sits perfectly centred. The black ring and the white disc quietly dissolve into fine drifting particles and fade to nothing, leaving only the blue origami mark floating alone in the dark. The blue paper then begins to unfold: each angular triangular fold swings open in sequence, creases straightening, the sheet flattening and expanding smoothly toward the camera. The opening sheet keeps growing until it fills the frame completely edge to edge, its deep blue lightening as it flattens, resolving into a clean, empty, evenly lit off-white surface. Final frame: a flat, featureless off-white field, no object, no text, no shadow. One continuous move, no cuts, premium product-film feel."
```

## What matters in the result

The **last frame decides whether the handoff works**. It has to end on a flat,
empty, near-white field with nothing left in it. The site cross-fades that frame
into its own background colour (`#f5f6f9`), which is what makes the video feel
like it turns into the page rather than stopping and being replaced.

If the first take does not land there — the mark is still visible at the end, or
it fades to black instead of white — say so and I will generate a matching
**end image** and re-run with `--end-image`, which pins the final frame exactly.

## Where to put it

Paste the resulting URL to me, or download it yourself to:

```
C:\Users\vagde\Desktop\Webdesign\3DPrintCraft\redesign\assets\video\portfolio-intro.mp4
```

I will then re-encode it for the web (the raw file will be several MB; the hero
clip went 2,673 KB to 313 KB the same way) and tune the cross-fade timing to the
actual last frame.
