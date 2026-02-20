# Layout Grammar – blocked configurations and editor messages (OPS-LAYOUT-01)

Status: Active
Last Updated: 2026-02-06
Canonical: Yes
Owner: Reporting / Editor

## 1. Where validation runs

- **Editor:** Admin → Visualization Manager → Edit Data Block. Before save, the block is validated via `validateBlockForEditor` (see `lib/editorValidationAPI.ts`). Save is **blocked** when `publishBlocked === true` or when `requiredActions` is non-empty (treated as must-fix before save).
- **Real-time feedback:** In the block edit modal, a "Layout check" line shows either "✓ OK – block can be saved" or the error/warning message so users see issues before clicking Update Block.

## 2. Configurations that block save

| Condition | Editor message (summary) | Cause |
|-----------|---------------------------|--------|
| Structural failure (height resolution priority 4) | `Cannot save block "<name>": Structural failure` (or `heightResolution.reason`) | Block layout cannot be resolved (e.g. height constraints impossible). |
| Element requires block split | `Cannot save block "<name>": Element requires block split` | At least one cell has `requiredActions` including `splitBlock` (content does not fit; splitting into multiple blocks is required). |
| Required actions (reflow, aggregate, increaseHeight) | `Block "<name>" requires: reflow, aggregate, increaseHeight` (or subset) | Element-fit validation requires one or more of: reflow, aggregate, increaseHeight. Save is blocked until the user addresses these (e.g. reduce content, increase height, or aggregate items). |

## 3. Required actions (meanings)

- **reflow** – Content should reflow (e.g. wrap) instead of overflowing.
- **aggregate** – Too many items (e.g. bar/pie elements); consider aggregating or reducing.
- **increaseHeight** – Allocated height is too small; increase block/cell height.
- **splitBlock** – Content does not fit in this block; split into multiple blocks.

## 4. Implementation references

- **Validation API:** `lib/editorValidationAPI.ts` (`validateBlockForEditor`, `checkPublishValidity`).
- **Element fit:** `lib/elementFitValidator.ts`.
- **Height resolution:** `lib/blockHeightCalculator.ts`; priority 4 = structural failure.
- **Editor integration:** `app/admin/visualization/page.tsx` (`validateBlockBeforeSave`, block edit modal "Layout check" UI).
