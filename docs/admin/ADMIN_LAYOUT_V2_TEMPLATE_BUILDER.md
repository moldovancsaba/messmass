# Admin LayoutV2 Template Builder (Operator Guide)
Status: Active
Version: 1.0.0
Created: 2026-01-15T14:46:42.000Z
Last Updated: 2026-01-15T14:46:42.000Z
Owner: Admin (Katja)
Audience: Operators, Support

1 Purpose
- Provide operator guidance for authoring LayoutV2 blocks in the Admin Visualization Editor.
- Ensure output matches the LayoutV2 contract for Reporting consumption.

2 Where to edit
- Admin UI -> Visualization -> select a template -> open a data block -> Show Settings.

3 LayoutV2 fields per chart
- unitSize: 1 or 2
- aspectRatio: 1:1, 2:1, 16:9, 9:16
- width: stored equal to unitSize for legacy compatibility

4 Allowed options by chart type
- KPI: unitSize 1, aspectRatio 1:1
- PIE: unitSize 1, aspectRatio 1:1
- BAR: unitSize 1 or 2, aspectRatio 1:1 or 2:1
- TEXT: unitSize 1 or 2, aspectRatio 1:1 or 2:1
- TABLE: unitSize 1 or 2, aspectRatio 1:1 or 2:1
- IMAGE: unitSize 1 or 2, aspectRatio 1:1, 16:9, or 9:16

5 Block capacity
- Total unitSize per block must be at most 4.
- Save is blocked when sum(unitSize) > 4.

6 Authoring workflow
- Use the Unit size selector to allocate horizontal space (1 or 2 units).
- Use the Aspect ratio selector to set the content shape.
- Image rules:
  - 16:9 -> unitSize 2
  - 1:1 or 9:16 -> unitSize 1
- Text/Bar/Table rules:
  - 2:1 -> unitSize 2
  - 1:1 -> unitSize 1
- KPI/PIE: fixed to unitSize 1 and aspectRatio 1:1.

7 Validation behavior
- Save is blocked if a block exceeds 4 total units.
- Only allowed unit sizes and aspect ratios are selectable in the editor.

8 Migration note
- Existing templates without LayoutV2 fields are normalized on load:
  - unitSize derived from existing width (clamped to 1 or 2).
  - aspectRatio defaults to 1:1 for charts; image charts use their configured aspect ratio when available (default 16:9).
  - No changes to block ordering or chart membership.
- After any edit, blocks save with explicit unitSize and aspectRatio.

9 References
- docs/admin/ADMIN_LAYOUT_V2_SCHEMA.md
- docs/design/REPORT_LAYOUT_V2_CONTRACT.md
