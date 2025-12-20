# DynamicChart.tsx Migration Plan

**Date:** 2025-12-20T17:28:48Z  
**Component:** `components/DynamicChart.tsx` (DEPRECATED)  
**Target:** Remove by v12.0.0 (June 2025)

---

## Current Usage Audit

### Active Imports (2 files)

| File | Usage | Priority | Complexity |
|------|-------|----------|------------|
| `app/admin/visualization/page.tsx` | ✅ ACTIVE | 🔴 **CRITICAL** | Medium |
| `components/UnifiedDataVisualization.tsx` | ⚠️ DEPRECATED | 🟡 Medium | Low (already deprecated) |

### Documentation References (1 file)

| File | Type | Action Required |
|------|------|-----------------|
| `REUSABLE_COMPONENTS_INVENTORY.md` | Documentation | Update to reference ReportChart |

### Self-References (1 file)

| File | Type | Action |
|------|------|--------|
| `components/DynamicChart.tsx` | Internal import (TextChart, ImageChart) | Will be removed with parent component |

---

## Migration Priority

### Phase 1: Critical Active Usage (Week 1)

#### File: `app/admin/visualization/page.tsx`

**Current State:**
- Imports DynamicChart from `@/components/DynamicChart`
- Line 6: `import { DynamicChart } from '@/components/DynamicChart';`
- Used in preview/visualization rendering
- **26 inline style violations** also need fixing

**Migration Steps:**
1. Replace DynamicChart with ReportChart
2. Update props to match ReportChart interface
3. Fix 26 inline styles → CSS modules
4. Test visualization preview rendering
5. Test chart algorithm manager preview

**Estimated Effort:** 4 hours (2 hours migration + 2 hours inline style fixes)

**Risk:** Medium (preview functionality critical to admin workflow)

---

### Phase 2: Deprecated Component (Week 1-2)

#### File: `components/UnifiedDataVisualization.tsx`

**Current State:**
- Already marked as deprecated (line 2)
- Import on line 13
- Low usage (legacy system)

**Migration Options:**
1. **Option A:** Migrate to ReportChart (1 hour)
2. **Option B:** Archive component if fully replaced (30 minutes)

**Recommended:** Option B - Archive if component not actively used

**Risk:** Low (already deprecated, likely unused)

---

### Phase 3: Documentation Update (Week 2)

#### File: `REUSABLE_COMPONENTS_INVENTORY.md`

**Current State:**
- Line 272: Reference to DynamicChart

**Action:**
- Update documentation to reference ReportChart
- Add deprecation notice
- Update component inventory

**Estimated Effort:** 30 minutes

**Risk:** None (documentation only)

---

### Phase 4: Component Deletion (Week 2)

#### File: `components/DynamicChart.tsx`

**Pre-Deletion Checklist:**
- [ ] All active imports migrated to ReportChart
- [ ] UnifiedDataVisualization archived or migrated
- [ ] Documentation updated
- [ ] ESLint warnings addressed
- [ ] Visual regression testing completed
- [ ] No grep matches for "DynamicChart" imports

**Deletion Steps:**
1. Run final grep audit: `grep -r "DynamicChart" --include="*.tsx" --include="*.ts" app/ components/`
2. Verify ESLint passes: `npm run lint`
3. Delete `components/DynamicChart.tsx`
4. Delete `components/DynamicChart.module.css` (if exists)
5. Update package.json version: MINOR bump (v11.37.0 → v11.38.0)
6. Commit with message: "feat: Remove deprecated DynamicChart.tsx (v12 migration complete)"

**Estimated Effort:** 1 hour (including testing)

**Risk:** Low (all migrations complete)

---

## Migration Guide: DynamicChart → ReportChart

### Props Mapping

**DynamicChart Props:**
```typescript
interface DynamicChartProps {
  result: ChartCalculationResult;
  className?: string;
  chartWidth?: number;
  showTitleInCard?: boolean;
  pageStyle?: PageStyleEnhanced;
}
```

**ReportChart Props:**
```typescript
interface ReportChartProps {
  result: ChartResult;      // Same structure
  width?: number;           // Same as chartWidth
  className?: string;       // Same
}
```

### Code Changes

**Before (DynamicChart):**
```typescript
import { DynamicChart } from '@/components/DynamicChart';

<DynamicChart
  result={chartResult}
  chartWidth={2}
  showTitleInCard={true}
  className={styles.chart}
/>
```

**After (ReportChart):**
```typescript
import ReportChart from '@/app/report/[slug]/ReportChart';

<ReportChart
  result={chartResult}
  width={2}
  className={styles.chart}
/>
```

### Key Differences

| Feature | DynamicChart | ReportChart | Migration Notes |
|---------|--------------|-------------|-----------------|
| Import path | `@/components/DynamicChart` | `@/app/report/[slug]/ReportChart` | Update import |
| Default export | Named export | Default export | Update syntax |
| `chartWidth` prop | Supported | Renamed to `width` | Rename prop |
| `showTitleInCard` prop | Supported | Always true | Remove prop (no-op) |
| `pageStyle` prop | Supported | Not supported | Remove prop (charts use CSS vars) |
| Chart types | KPI, PIE, BAR, TEXT, IMAGE, VALUE | Same 6 types | No change needed |

### Testing Checklist

After migration, test:
- [ ] KPI charts display correctly
- [ ] PIE charts show percentages
- [ ] BAR charts render all 5 elements
- [ ] TEXT charts format properly
- [ ] IMAGE charts maintain aspect ratio
- [ ] VALUE charts show both KPI and BAR
- [ ] Chart formulas evaluate correctly
- [ ] No console errors
- [ ] PDF export works (if applicable)
- [ ] Responsive layout correct (mobile/tablet/desktop)

---

## Timeline

| Week | Phase | Tasks | Owner | Status |
|------|-------|-------|-------|--------|
| Week 1 | Phase 1 | Migrate visualization page | Dev Team | ⏳ In Progress |
| Week 1-2 | Phase 2 | Archive UnifiedDataVisualization | Dev Team | 📋 Planned |
| Week 2 | Phase 3 | Update documentation | Dev Team | 📋 Planned |
| Week 2 | Phase 4 | Delete DynamicChart.tsx | Dev Team | 📋 Planned |

**Target Completion:** End of Week 2 (2025-12-27)

---

## Rollback Plan

If critical issues discovered after migration:

1. **Immediate:** Revert last commit
2. **Short-term:** Fix forward if possible, document issue in LEARNINGS.md
3. **Long-term:** Add to manual testing checklist

**Git Commands:**
```bash
# Revert last commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>

# Push revert
git push origin main
```

---

## Success Criteria

Migration considered successful when:
- [ ] Zero DynamicChart imports in codebase
- [ ] ESLint passes without DynamicChart warnings
- [ ] All chart types render correctly in visualization page
- [ ] No visual regressions reported
- [ ] Documentation fully updated
- [ ] DynamicChart.tsx deleted
- [ ] Version bumped to v11.38.0+

---

## Related Documents

- **Technical Audit:** `TECH_AUDIT_REPORTING_SYSTEM.md` Part 2.1
- **Chart Architecture:** `WARP.md` Chart System & Visualization section
- **Coding Standards:** `CODING_STANDARDS.md` Component patterns
- **Component Inventory:** `REUSABLE_COMPONENTS_INVENTORY.md`

---

**End of Migration Plan**
