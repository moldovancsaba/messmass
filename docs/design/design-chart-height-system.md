# Chart Block Height System
Status: Active
Last Updated: 2026-09-16
Canonical: Yes
Owner: Architecture

## Overview

Every cell in a report block shares one height, `H`. The block is given a width
by its container; the solver divides that width among the cells and derives the
single height that makes them fit it exactly.

This document described a different system until 2026-09-16 — a lookup table
mapping unit counts to height multipliers, in `lib/chartHeightCalculator.ts`,
applied by `components/UnifiedDataVisualization.tsx`. Neither file exists, and
the table had no importers. What follows is read off the code that runs.

## The solver

`solveBlockHeightWithImages(cells, blockWidthPx)` in
[`lib/blockHeightCalculator.ts`](../../lib/blockHeightCalculator.ts).

Each cell contributes **effective units** — how many multiples of `H` its width
comes to:

| Cell | Effective units |
|------|-----------------|
| IMAGE | its aspect ratio as a number (`16:9` → 1.778) |
| BAR / PIE / KPI in a row of 1–2 cells | `(3 / cellCount) × cellWidth` |
| Anything else (3+ cell rows, TEXT) | `cellWidth` |

Then:

```
H = blockWidth / totalEffectiveUnits
```

The derivation is just the width identity: an IMAGE cell is `aspectRatio × H`
wide and every other cell is `cellWidth × H` wide, so the widths sum to
`H × totalEffectiveUnits`, which must equal `blockWidth`.

The 1–2 cell case exists to stop a nearly-empty row from becoming extremely
tall: the multiplier makes the **whole row** about 3:1, split across however
many cells are in it — one cell takes 3×, two take 1.5× each.

`H` is then clamped to `--mm-block-height-min` and `--mm-block-height-max`
(150px / 800px when the tokens cannot be read, as during SSR) and rounded.
An empty block falls back to `--mm-block-height-default`.

## Height resolution priorities

`resolveBlockHeightWithDetails(input)` wraps the solver and can override its
answer. Priorities are declared in
[`lib/layoutGrammar.ts`](../../lib/layoutGrammar.ts) as
`HeightResolutionPriority`:

1. **INTRINSIC_MEDIA** — a cell with `bodyType: 'image'` and
   `imageMode: 'setIntrinsic'` dictates the height from its own aspect ratio,
   overriding the solver.
2. **BLOCK_ASPECT_RATIO** — an explicit `blockAspectRatio` on the input. The
   `isSoftConstraint` flag says whether it may be exceeded.
3. **READABILITY_ENFORCEMENT** — `validateElementFit`
   ([`lib/elementFitValidator.ts`](../../lib/elementFitValidator.ts)) raises the
   height when content would otherwise fall below the minimum font size.
4. **STRUCTURAL_FAILURE** — nothing fits; the result sets `requiresSplit`.

The returned `BlockHeightResolution` carries `heightPx`, the `priority` that
decided it, a human-readable `reason`, and the `canIncrease` / `requiresSplit`
flags callers use to react.

## Who calls it

- [`lib/editorValidationAPI.ts`](../../lib/editorValidationAPI.ts) —
  `resolveBlockHeightWithDetails`, validating a block as it is edited.

That is the only importer. Report rendering measures its own widths in
`app/report/[slug]/ReportContent.tsx`; if you are chasing a height problem on a
rendered report, start there, not here.

## Aspect ratios

`getAspectRatioValue` in
[`lib/aspectRatioResolver.ts`](../../lib/aspectRatioResolver.ts) converts an
`AspectRatio` (`'16:9' | '9:16' | '1:1'`, defined in
[`lib/chartConfigTypes.ts`](../../lib/chartConfigTypes.ts)) to the number the
solver multiplies by.

Ratios do **not** map to fixed grid widths. A unit is `1 | 2`
(`app/admin/visualization/page.tsx`); documentation claiming ratios map to 1–3
units described a module that was deleted on 2026-09-16.
