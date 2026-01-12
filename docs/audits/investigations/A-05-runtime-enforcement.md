# A-05: Layout Grammar Runtime Enforcement

**Version:** 1.0.0  
**Created:** 2026-01-12T02:05:00.000Z  
**Status:** COMPLETE  
**Owner:** Engineering

---

## Purpose

Implement production-only fail-fast behavior for critical Layout Grammar violations to prevent violations from reaching production while preserving development workflow (warnings only).

**Source:** A-05: Layout Grammar Runtime Enforcement (AUDIT_ACTION_PLAN.md)

---

## Implementation Summary

### Runtime Enforcement Module

**File:** `lib/layoutGrammarRuntimeEnforcement.ts`

**Features:**
- Environment-aware enforcement (warnings in dev, errors in prod)
- Critical CSS variable validation
- Height resolution validation
- Element fit validation
- Safe validation wrapper (error boundary)

### Critical CSS Variables

The following CSS variables are considered critical and will block rendering in production if missing:

- `--row-height`: Row height for responsive rows
- `--block-height`: Block height for report blocks
- `--chart-body-height`: Chart body height for BAR charts
- `--text-content-height`: Text content height for TEXT and TABLE charts

### Enforcement Behavior

**Development Mode:**
- Console warnings for missing CSS variables
- Console warnings for height resolution failures
- Console warnings for element fit failures
- No blocking - warnings only

**Production Mode:**
- Throws errors for missing critical CSS variables
- Throws errors for structural height resolution failures
- Throws errors for element fit failures
- Blocks rendering to prevent violations from reaching users

### Environment Detection

The enforcement module detects environment using:
1. `VERCEL_ENV` (if available): 'production', 'preview', 'development'
2. `NODE_ENV`: 'production' or other
3. Server-side vs client-side detection

**Production is defined as:**
- `VERCEL_ENV === 'production'` OR
- `NODE_ENV === 'production'` (when VERCEL_ENV is not available)

---

## Integration Points

### ReportContent.tsx

**Row-Level Validation:**
- Validates `--row-height` and `--block-height` CSS variables
- Validates height resolution results from `resolveBlockHeightWithDetails()`

**Location:** `ResponsiveRow` component

### ReportChart.tsx

**Chart-Level Validation:**
- BAR charts: Validates `--chart-body-height` and `--block-height`
- TEXT charts: Validates `--text-content-height` and `--block-height`
- TABLE charts: Validates `--text-content-height`, `--chart-body-height`, and `--block-height`

**Location:** Chart-specific `useEffect` hooks

---

## Enforcement Rules

### Rule 1: Critical CSS Variables

**Violation:** Missing critical CSS variable (e.g., `--block-height`)

**Development:** Console warning with context
**Production:** Throws error, blocks rendering

**Example:**
```typescript
validateCriticalCSSVariable(
  element,
  CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
  { chartId: 'chart-1', chartType: 'bar' }
);
```

### Rule 2: Height Resolution Failures

**Violation:** Structural failure (Priority 4) or `requiresSplit === true`

**Development:** Console warning with context
**Production:** Throws error, blocks rendering

**Example:**
```typescript
validateHeightResolution(heightResolution, {
  rowIndex: 0,
  blockWidth: 1200,
  cellsCount: 3
});
```

### Rule 3: Element Fit Failures

**Violation:** Element does not fit (`fits === false`)

**Development:** Console warning with context
**Production:** Throws error, blocks rendering

**Example:**
```typescript
validateElementFit(fitValidation, {
  chartId: 'chart-1',
  chartType: 'bar'
});
```

---

## Safeguards

### Error Boundary

The enforcement module includes a `safeValidate()` wrapper that:
- Catches validation errors
- Logs errors without throwing
- Prevents enforcement from crashing the application
- Returns non-critical result if validation throws

**Usage:**
```typescript
const result = safeValidate(
  () => validateCriticalCSSVariable(element, variableName, context),
  'CSS variable validation failed'
);
```

### Graceful Degradation

- Enforcement errors are caught and logged
- Application continues to render (with warnings)
- Errors are logged with full context for debugging

---

## Testing

**Local Gate:**
- ✅ Build passes
- ✅ TypeScript checks pass
- ✅ Linting passes

**Environment Testing:**
- Development: Warnings only (no blocking)
- Production: Errors thrown (blocking enabled)

---

## Related Files

- `lib/layoutGrammarRuntimeEnforcement.ts` - Enforcement module
- `app/report/[slug]/ReportContent.tsx` - Row-level validation
- `app/report/[slug]/ReportChart.tsx` - Chart-level validation
- `AUDIT_ACTION_PLAN.md` - A-05 task definition

---

**Last Updated:** 2026-01-12T02:05:00.000Z
