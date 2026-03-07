# LayoutV2 Contract Conformance Fixtures (X-LAYOUT-01)

**Purpose:** Minimal fixture templates that represent Admin LayoutV2 output and validate against Reporting LayoutV2 renderer input contract.

**References:**
- Contract: `docs/design/design-report-layout-v2-contract.md`
- Admin schema: `docs/admin/admin-layout-v2-schema.md`
- Validation checklist: `VALIDATION_CHECKLIST.md`

## Fixture Files

| File | Description | Units | Use case |
|------|-------------|-------|----------|
| `1-unit-block.json` | Single block, one 1-unit chart | 1 | Minimal row |
| `2-unit-block.json` | Single block, one 2-unit chart | 2 | Wide single cell |
| `mixed-block.json` | Single block, 2+1+1 units | 4 | Mixed widths |
| `4-unit-max.json` | Single block, four 1-unit charts | 4 | Max capacity |

Each fixture is an array of **blocks** in the shape Reporting expects (same as `populateDataBlocks` output / `ReportBlock`).

## Block Shape (Reporting Input)

```ts
{
  "id": string,
  "title": string,
  "showTitle": boolean,
  "order": number,
  "charts": Array<{ "chartId": string, "width": number, "order": number }>,
  "blockAspectRatio"?: string,   // optional, e.g. "4:6"
  "tableHeightMultiplier"?: number  // optional, 0.1–5.0
}
```

- **Capacity:** `sum(chart.width) <= 4` per block.
- **blockAspectRatio:** Allowed only for TEXT-only or TABLE-only blocks; range 4:1 to 4:10.
