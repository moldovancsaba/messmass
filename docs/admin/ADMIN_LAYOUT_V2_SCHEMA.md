# Admin LayoutV2 Schema (Layout Configuration)
Status: Active
Version: 1.0.0
Created: 2026-01-15T12:24:23.000Z
Last Updated: 2026-01-15T14:46:42.000Z
Canonical: Yes
Owner: Admin (Katja)

1 Purpose
- Define the Admin-side LayoutV2 schema that Reporting consumes.
- Provide validation rules to reject invalid layouts before they reach Reporting.
- Describe backward compatibility behavior when LayoutV2 fields are missing.

2 Data Model (Schema)

2.1 Types
```ts
type LayoutUnit = 1 | 2;
type AspectRatio = '1:1' | '2:1' | '16:9' | '9:16';
type LayoutItemType = 'kpi' | 'pie' | 'bar' | 'text' | 'table' | 'image';
type LayoutBindingType = 'chart' | 'contentAsset' | 'statsField';

interface LayoutV2 {
  blocks: LayoutBlock[];
  // Optional: if missing, template is treated as legacy LayoutV1
  layoutMode?: 'legacy' | 'layoutV2';
}

interface LayoutBlock {
  id: string;
  order: number;           // vertical order in report
  items: LayoutItem[];
}

interface LayoutItem {
  id: string;
  order: number;           // horizontal order within block
  type: LayoutItemType;
  unitSize: LayoutUnit;    // 1 or 2 units
  aspectRatio: AspectRatio;
  binding: LayoutBinding;
}

interface LayoutBinding {
  kind: LayoutBindingType;
  chartId?: string;        // for kind: 'chart'
  assetSlug?: string;      // for kind: 'contentAsset' (text/image)
  statsField?: string;     // for kind: 'statsField' (text fields)
}
```

2.2 Block Capacity
- Each block must total at most 4 units.
- `sum(item.unitSize) <= 4`

3 Allowed Aspect Ratios per Item Type

| Item Type | Allowed Aspect Ratios |
| --- | --- |
| kpi | 1:1 |
| pie | 1:1 |
| bar | 1:1, 2:1 |
| text | 1:1, 2:1 |
| table | 1:1, 2:1 |
| image | 1:1, 16:9, 9:16 |

4 Allowed Unit Sizes per Item Type

| Item Type | Allowed Unit Sizes |
| --- | --- |
| kpi | 1 |
| pie | 1 |
| bar | 1, 2 |
| text | 1, 2 |
| table | 1, 2 |
| image | 1, 2 |

5 Bindings (What Each Item References)

| Item Type | Binding Kind | Required Fields |
| --- | --- | --- |
| kpi, pie, bar, text, table | chart | `chartId` |
| image | contentAsset | `assetSlug` |
| text | statsField (optional fallback) | `statsField` |

Rules:
- `chartId` must reference an existing chart config.
- `assetSlug` must reference a content asset entry (text or image as appropriate).
- `statsField` must match a KYC variable or approved report content field.

6 Validation Rules (Admin-Side)

6.1 Structural Validation (hard fail)
- Block unit totals must not exceed 4.
- `unitSize` must be `1` or `2`.
- `aspectRatio` must be allowed for the given item type.
- `unitSize` must be allowed for the given item type.
- `order` values must be unique within each block.
- `block.order` values must be unique across the template.
- Each item must have a valid `binding` for its type.

6.2 Data Validation (hard fail)
- `chartId` must exist in chart configurations.
- `assetSlug` must exist in content assets.
- `statsField` must be a valid variable name.

7 Backward Compatibility (Missing LayoutV2 Fields)

If `layoutMode` is missing or set to `legacy`:
- Treat template as LayoutV1 (legacy data blocks + chart widths).
- Do not enforce LayoutV2 validation.
- Reporting consumes the legacy block + chart width model as-is.

If `layoutMode: 'layoutV2'` but fields are incomplete:
- Reject save with validation error (do not persist).
- Admin UI should surface the error and keep previous saved layout intact.

8 Failure Mode (Invalid Layout Save)

Admin must prevent saving invalid layouts:
- Server-side schema validation runs before save.
- On validation failure:
  - Return an error with a clear reason (e.g., "Block 2 unit total = 3, must equal 4").
  - Do not persist invalid changes.
  - UI should block save and show errors (UI constraints to be added later).

9 References
- Reporting contract: `docs/design/REPORT_LAYOUT_V2_CONTRACT.md`
- Admin report templates: `/admin/visualization` (template editor)
