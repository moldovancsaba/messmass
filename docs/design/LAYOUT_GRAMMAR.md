# Layout Grammar CI Guardrail Rules

**Version:** 1.0.0  
**Created:** 2025-01-XX  
**Status:** Active  
**Authority:** Based on DESIGN_SYSTEM_PLAN.md Section 0 (Structural Fit & Typography Enforcement Policy)

---

## Overview

The Layout Grammar CI Guardrail automatically scans code for patterns that violate the Structural Fit & Typography Enforcement Policy. This prevents "temporary" fixes that would violate the layout grammar rules.

**Command:** `npm run check:layout-grammar`  
**CI Integration:** Runs automatically on pull requests and pushes to main

---

## Forbidden Patterns

The following patterns are **explicitly prohibited** and will cause CI to fail:

### Scrolling Patterns ❌

- `overflow: auto`
- `overflow: scroll`
- `overflow-x: *` (any value)
- `overflow-y: *` (any value)

**Why:** Scrolling is prohibited. Content must fit by structural change or height increase.

**How to fix:**
- Increase block height
- Split block into multiple blocks
- Reflow layout (legend position, chart orientation)
- Reduce semantic density (Top-N, aggregation)

---

### Truncation Patterns ❌

- `text-overflow: ellipsis`
- `line-clamp` (any value)
- `-webkit-line-clamp` (any value)

**Why:** Truncation is prohibited. Content must fit fully or structure must adapt.

**How to fix:**
- Increase block height
- Split block into multiple blocks
- Reduce content density
- Use structural changes instead

---

### Clipping Patterns ❌ (Content Layers Only)

- `overflow: hidden` on content layers

**Why:** Clipping content is prohibited. Content must be fully visible.

**Exception:** `overflow: hidden` is allowed **only** on decorative/mask layers with explicit comment:

```css
/* ALLOWED: decorative-only */
. decorative-mask {
  overflow: hidden;
}
```

**How to fix:**
- Remove `overflow: hidden` from content layers
- Use structural changes (height increase, block split)
- For decorative elements, add explicit comment: `/* ALLOWED: decorative-only */`

---

## Allowed Patterns ✅

The following patterns are **allowed**:

### Decorative Clipping (with comment)

```css
/* ALLOWED: decorative-only */
.mask-layer {
  overflow: hidden; /* Decorative mask, not content */
}
```

### Structural Changes

- Height increases
- Block splits
- Layout reflow
- Semantic density reduction (Top-N, aggregation)

---

## CI Integration

### GitHub Actions

The guardrail runs automatically on:
- Pull requests (when report-related files change)
- Pushes to main (when report-related files change)

**Workflow:** `.github/workflows/layout-grammar-guardrail.yml`

### Local Testing

Run the guardrail locally before committing:

```bash
npm run check:layout-grammar
```

---

## How to Fix Violations

### Step 1: Identify the Violation

The guardrail will show:
- File path
- Line number
- Violation type
- Code snippet

### Step 2: Choose the Fix

**For scrolling:**
- Increase block height
- Split block
- Reflow layout

**For truncation:**
- Increase block height
- Split block
- Reduce content density

**For clipping:**
- Remove `overflow: hidden` from content layers
- Add `/* ALLOWED: decorative-only */` comment if decorative

### Step 3: Verify Fix

Run the guardrail again:

```bash
npm run check:layout-grammar
```

Should show: `✅ No Layout Grammar violations found!`

---

## Whitelist Mechanism

### Decorative-Only Clipping

To allow `overflow: hidden` on decorative layers:

1. Add explicit comment: `/* ALLOWED: decorative-only */`
2. Place comment on the same line or adjacent lines
3. Ensure it's truly decorative (mask, decorative element, not content)

**Example:**

```css
/* ALLOWED: decorative-only */
.image-mask {
  overflow: hidden; /* Decorative mask for image crop effect */
}
```

**Not allowed:**

```css
/* This will fail - content layer */
.text-content {
  overflow: hidden; /* ❌ Violation - content layer */
}
```

---

## Scanned Directories

The guardrail scans:
- `app/report/` - Report pages
- `components/charts/` - Chart components
- `app/report/[slug]/` - Dynamic report pages

**File types:** `.css`, `.tsx`, `.ts`

---

## Excluded Patterns

The guardrail automatically excludes:
- `node_modules/`
- `.next/`
- `out/`
- `.git/`
- `dist/`
- `build/`

---

## Policy Reference

This guardrail enforces:
- **DESIGN_SYSTEM_PLAN.md** Section 0: Structural Fit & Typography Enforcement Policy
- **UNIFIED_DESIGN_SYSTEM_MASTER_PLAN.md** Part 1: Design System Specification

**Key Rules:**
1. Scrolling is prohibited
2. Truncation is prohibited
3. Clipping is prohibited (except decorative layers)
4. Content must fit by structural change or height increase

---

## Troubleshooting

### CI Fails but Code Looks Correct

1. Check if violation is in a content layer (not decorative)
2. Verify comment format: `/* ALLOWED: decorative-only */`
3. Ensure comment is on same/adjacent lines

### False Positives

If you believe a violation is a false positive:
1. Review the Structural Fit Policy (Section 0)
2. Consider if structural change is possible
3. Document why exception is needed
4. Add explicit comment with justification

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Development Team

