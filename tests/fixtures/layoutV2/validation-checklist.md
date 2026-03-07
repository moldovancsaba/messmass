# LayoutV2 Validation Checklist (X-LAYOUT-01)

**Purpose:** Validate that Admin LayoutV2 output conforms to Reporting LayoutV2 renderer input (schema + contract).

---

## 1. Schema Conformance

For each **block** in the fixture/template:

- [ ] **Block capacity:** `sum(chart.width)` ≤ 4
- [ ] **Chart width:** Each `chart.width` is 1 or 2
- [ ] **Order uniqueness:** Block `order` and each chart `order` are unique within scope
- [ ] **blockAspectRatio (if present):** String format `"4:N"` where N is 1–10; only for TEXT-only or TABLE-only blocks
- [ ] **tableHeightMultiplier (if present):** Number in range 0.1–5.0; only for TABLE-only blocks; must not be used together with blockAspectRatio for same block

---

## 2. Contract Conformance (Reporting Input)

- [ ] **Block structure:** Each block has `id`, `title`, `showTitle`, `order`, `charts`
- [ ] **Charts array:** Each chart has `chartId`, `width`, `order`
- [ ] **Deterministic packing:** Same input produces same layout (no random/heuristic placement)
- [ ] **Unit-based width:** Item width = (itemUnits / totalUnits) × blockWidth
- [ ] **Height uniformity:** All items in a block share same block height (default 4:1 or overridden by blockAspectRatio/tableHeightMultiplier)

---

## 3. Fixture Run-Through

| Fixture | Capacity | blockAspectRatio | Expected |
|---------|----------|------------------|----------|
| 1-unit-block.json | 1 | — | Pass |
| 2-unit-block.json | 2 | — | Pass |
| mixed-block.json | 4 | — | Pass |
| 4-unit-max.json | 4 | — | Pass |
| text-block-with-aspect-ratio.json | 2 | 4:6 | Pass (TEXT-only) |

---

## 4. Running the Validator

From repo root:

```bash
node tests/fixtures/layoutV2/validate-fixtures.js
```

Or use the Jest test: `tests/layoutV2-fixtures-validation.test.ts` (if added).

---

## 5. References

- `docs/design/design-report-layout-v2-contract.md`
- `docs/admin/admin-layout-v2-schema.md`
- `lib/layoutV2BlockCalculator.ts` (validateLayoutV2BlockCapacity, validateAspectRatioRange, validateAspectRatioOverride)
