# Layout V2 Grid System & Section Coalescing
Status: Active
Last Updated: 2026-11-20T16:00:00.000Z
Canonical: Yes
Owner: Architecture / Layout
Version: 12.3.51

## 1. 6-Unit Proportional Grid Grammar

Messmass reports use an editorial 6-unit desktop grid (`desktopUnits: 6`, `MAX_BLOCK_UNITS = 6`). Chart cards occupy proportional grid fractional units (`fr`):

- **KPI Cards / ValueChain**: 1 unit width (`1fr`)
- **Image Banners**: 1 unit (square `1:1`) or 2 units (landscape `16:9`)
- **Horizontal Bar / Donut Charts**: 2 units width (`2fr`)
- **Full Width / Text / Tables**: 3 to 6 units width

Example Row: `1fr 1fr 2fr` (e.g. Marketing Opt-in % + Estimated Marketing Value + Database Value for Sponsors).

## 2. Multi-Row Section Coalescing (`coalesceReportBlocks`)

To avoid repeating block headings when charts span multiple visual rows:
- `coalesceReportBlocks` partitions cards into logical rows based on cumulative unit widths.
- Section titles render once at the top of the coalesced block rather than creating fragmented sub-headers.

## 3. Explicit Height Cascade & Loop Prevention

To guarantee pixel-perfect vertical alignment and eliminate resize loops:
1. Container row establishes `--block-height`.
2. Body zone explicitly measures: `containerHeight - titleHeight - subtitleHeight`.
3. CSS variable `--chart-body-height` or `--text-content-height` is applied via `requestAnimationFrame` with a 2px hysteresis threshold, preventing infinite `ResizeObserver` cycles.

## 4. Zero-Data State Handling

- Empty KPI cards (evaluating to `0`, `'NA'`, or undefined on events with no data inputs) are safely suppressed without collapsing the CSS grid container.
- Multi-element bar and pie charts filter out individual 0-value entries while retaining non-zero items.
- If an entire block has zero valid data, the block container smoothly hides to preserve an executive presentation.
