# Report Text Sizing & Markdown Enhancement Plan
Status: Active
Last Updated: 2026-01-11T22:45:21.000Z
Canonical: No
Owner: Architecture

**Version:** 1.0.2  
**Status:** Planning  
**Date:** 2025-01-02  
**Owner:** Tribeca

---

## 📋 Overview

This plan addresses two requirements for report text charts:
1. **Full markdown support** - Universal but simple markdown features for text decoration
2. **Optimal text sizing** - Largest possible text that fits and fills the text area without empty spaces

---

## 🎯 Goals

### Goal 1: Full Markdown Support
- Enable all standard markdown features (universal but simple)
- Maintain security (XSS protection)
- Preserve backward compatibility
- Support common markdown syntax patterns

### Goal 2: Optimal Text Sizing
- Calculate largest font-size that fills available space
- Eliminate empty spaces (no gaps, no scrolling)
- Respect Layout Grammar (no overflow, no truncation)
- Work with all markdown elements (headings, lists, paragraphs)

---

## 📊 Current State Analysis

### Current Markdown Support

**✅ Currently Supported:**
- Bold: `**text**`
- Italic: `*text*`
- Headings: `# H1`, `## H2`, `### H3` (all normalized to `<h1>`)
- Unordered lists: `- item`
- Ordered lists: `1. item`
- Links: `text (TODO: unresolved target)`

**❌ Currently Disabled:**
- Blockquotes: `> quote` (stripped)
- Code blocks: ` ```code``` ` (stripped)
- Inline code: `` `code` `` (stripped)
- Strikethrough: `~~text~~` (stripped)
- GFM features (tables, task lists, etc.)

**⚠️ Issues:**
- All headings normalized to h1 (no h2, h3, h4, h5, h6)
- Limited markdown features (not "universal")
- Custom renderer strips unsupported features

### Current Text Sizing

**✅ Currently Working:**
- Unified font-size calculation for all text charts in a block
- Binary search algorithm for optimal font-size
- Container query fallback: `clamp(0.75rem, min(12cqh, 10cqw), 2.5rem)`
- Font-size range: 0.75rem (12px) to 1.5rem (24px) in calculator, 2.5rem (40px) in CSS

**❌ Current Issues:**
- `overflow-y: auto` violates Layout Grammar (scrolling not allowed)
- Font-size calculation doesn't account for "filling space without empty spaces"
- Max font-size too conservative (1.5rem in calculator, 2.5rem in CSS)
- Text may not fill vertical space (leaves gaps)
- Binary search only checks if content fits, doesn't maximize fill

**⚠️ Layout Grammar Violations:**
- Text content has `overflow-y: auto` (scrolling not allowed per Layout Grammar)
- No enforcement of "no empty spaces" requirement
- Font-size calculation doesn't maximize vertical fill

---

## 🎨 Design Requirements

### Requirement 1: Full Markdown Support

**Universal but Simple:**
- Support all standard CommonMark features
- Keep it simple (no complex extensions)
- Maintain security (sanitize all output)
- Preserve backward compatibility

**Features to Enable:**
1. **Headings:** `# H1`, `## H2`, `### H3`, `#### H4`, `##### H5`, `###### H6`
   - Preserve heading levels (don't normalize to h1)
   - Style with relative sizes (h1 = 1.5em, h2 = 1.3em, h3 = 1.1em, etc.)

2. **Blockquotes:** `> quote`
   - Render as `<blockquote>` with styling
   - Indent and style with border-left

3. **Code blocks:** ` ```code``` `
   - Render as `<pre><code>` with monospace font
   - Preserve whitespace and line breaks

4. **Inline code:** `` `code` ``
   - Render as `<code>` with monospace font
   - Inline with surrounding text

5. **Strikethrough:** `~~text~~`
   - Render as `<del>` or `<s>` with strikethrough styling

6. **Horizontal rules:** `---` or `***`
   - Render as `<hr>` with styling

7. **GFM features (optional):**
   - Task lists: `- [ ] task` (if simple enough)
   - Tables: Already supported in TableChart (don't duplicate)

**Security:**
- All HTML sanitized via DOMPurify
- No inline HTML allowed (marked default)
- No script tags, event handlers, or dangerous attributes

### Requirement 2: Optimal Text Sizing

**Fill Space Without Empty Spaces:**
- Calculate font-size that maximizes vertical fill
- No gaps at top or bottom
- No scrolling (Layout Grammar compliance)
- Work with all markdown elements

**Algorithm Requirements:**
1. **Measure actual rendered content:**
   - Parse markdown to HTML
   - Measure rendered height with test font-size
   - Account for all markdown elements (headings, lists, paragraphs)

2. **Maximize vertical fill:**
   - Binary search for font-size that fills container height
   - Prefer slightly larger font that causes minimal overflow (then clamp)
   - Or use exact fit algorithm (find size where content height ≈ container height)

3. **Respect constraints:**
   - Min font-size: 0.75rem (12px) - readability minimum
   - Max font-size: 4rem (64px) - reasonable maximum
   - Container width: Must fit within available width
   - Container height: Must fill without overflow

4. **Handle edge cases:**
   - Very short content: Use larger font to fill space
   - Very long content: Use smaller font to fit
   - Mixed content (headings + paragraphs): Account for all elements

**Layout Grammar Compliance:**
- Remove `overflow-y: auto` (no scrolling)
- Ensure content fits within container (no overflow)
- No truncation (content must be fully visible)
- Fill available space (minimize empty spaces)

---

## 🔧 Implementation Plan

### Phase 1: Full Markdown Support

#### Step 1.1: Update Markdown Parser (`lib/markdownUtils.ts`)

**Changes:**
1. Remove custom renderer limitations:
   - Remove `renderer.blockquote` override (enable blockquotes)
   - Remove `renderer.code` override (enable code blocks)
   - Remove `renderer.codespan` override (enable inline code)
   - Remove `renderer.del` override (enable strikethrough)
   - Update `renderer.heading` to preserve heading levels (h1-h6)

2. Enable GFM features:
   - Set `gfm: true` in marked options
   - Enable strikethrough, task lists (optional)

3. Update sanitization:
   - Add `blockquote`, `pre`, `code`, `del`, `s`, `hr` to allowed tags
   - Add `class` attribute for code blocks (syntax highlighting future)

**Files:**
- `lib/markdownUtils.ts` - Update parser configuration
- `lib/sanitize.ts` - Update `sanitizeMarkdownHTML` allowlist

#### Step 1.2: Update CSS Styles (`app/report/[slug]/ReportChart.module.css`)

**Changes:**
1. Add heading level styles:
   ```css
   .textMarkdown h1 { font-size: 1.5em; }
   .textMarkdown h2 { font-size: 1.3em; }
   .textMarkdown h3 { font-size: 1.1em; }
   .textMarkdown h4 { font-size: 1.05em; }
   .textMarkdown h5 { font-size: 1em; }
   .textMarkdown h6 { font-size: 0.95em; }
   ```

2. Add blockquote styles:
   ```css
   .textMarkdown blockquote {
     border-left: 3px solid var(--mm-gray-300);
     padding-left: 1em;
     margin: 0.5em 0;
     font-style: italic;
   }
   ```

3. Add code block styles:
   ```css
   .textMarkdown pre {
     background: var(--mm-gray-100);
     padding: 0.5em;
     border-radius: var(--mm-radius-sm);
     overflow-x: auto;
   }
   .textMarkdown code {
     font-family: monospace;
     font-size: 0.9em;
   }
   .textMarkdown pre code {
     display: block;
   }
   ```

4. Add strikethrough styles:
   ```css
   .textMarkdown del,
   .textMarkdown s {
     text-decoration: line-through;
   }
   ```

5. Add horizontal rule styles:
   ```css
   .textMarkdown hr {
     border: none;
     border-top: 1px solid var(--mm-gray-300);
     margin: 1em 0;
   }
   ```

**Files:**
- `app/report/[slug]/ReportChart.module.css` - Add markdown element styles

#### Step 1.3: Update Font Size Calculator (`lib/textFontSizeCalculator.ts`)

**Changes:**
1. Update measurement element styles:
   - Match all new markdown element styles
   - Account for heading sizes, blockquote margins, code block padding

2. Update binary search algorithm:
   - Measure actual rendered height (including all markdown elements)
   - Account for line-height, margins, padding of all elements

**Files:**
- `lib/textFontSizeCalculator.ts` - Update measurement styles and algorithm

---

### Phase 2: Optimal Text Sizing

#### Step 2.1: Enhance Font Size Calculator (`lib/textFontSizeCalculator.ts`)

**Changes:**
1. **Increase max font-size:**
   - Current: 1.5rem (24px)
   - New: 4rem (64px) - reasonable maximum for large containers

2. **Implement "fill space" algorithm:**
   - Current: Binary search finds largest size that fits
   - New: Binary search finds size that fills container height (minimize empty space)
   - Algorithm:
     ```typescript
     // Find font-size where content height ≈ container height
     // Prefer slightly larger (causes minimal overflow, then clamp)
     // Or use exact fit (content height = container height)
     ```

3. **Account for vertical fill:**
   - Measure content height at test font-size
   - Calculate fill ratio: `contentHeight / containerHeight`
   - Optimize for fill ratio ≈ 1.0 (perfect fill)
   - Allow slight overflow (0-5%) then clamp to fit

4. **Handle edge cases:**
   - Very short content: Use larger font to fill space
   - Very long content: Use smaller font to fit
   - Mixed content: Account for all markdown elements

**Files:**
- `lib/textFontSizeCalculator.ts` - Enhance `calculateOptimalFontSize`

#### Step 2.2: Remove Scrolling (Layout Grammar Compliance)

**Changes:**
1. Remove `overflow-y: auto` from `.textContent`:
   - Current: `overflow-y: auto !important;` (allows scrolling)
   - New: `overflow: hidden !important;` (no scrolling, Layout Grammar compliant)

2. Ensure content fits:
   - Font-size calculation must ensure content fits within container
   - No overflow allowed (Layout Grammar requirement)

**Files:**
- `app/report/[slug]/ReportChart.module.css` - Remove scrolling, add overflow hidden

#### Step 2.3: Update Unified Font Size Hook (`hooks/useUnifiedTextFontSize.ts`)

**Changes:**
1. Update max font-size:
   - Pass `maxFontSize: 4` to `calculateOptimalFontSize` (4rem = 64px)

2. Ensure fill optimization:
   - Verify calculator uses "fill space" algorithm
   - Test with various content lengths

**Files:**
- `hooks/useUnifiedTextFontSize.ts` - Update max font-size parameter

#### Step 2.4: Update CSS Fallback (`app/report/[slug]/ReportChart.module.css`)

**Changes:**
1. Update container query fallback:
   - Current: `clamp(0.75rem, min(12cqh, 10cqw), 2.5rem)`
   - New: `clamp(0.75rem, min(12cqh, 10cqw), 4rem)` (increase max to 4rem)

2. Ensure no scrolling:
   - Remove `overflow-y: auto`
   - Add `overflow: hidden`

**Files:**
- `app/report/[slug]/ReportChart.module.css` - Update fallback and overflow

---

## 🧪 Testing Strategy

### Test Case 1: Full Markdown Support

**Test all markdown features:**
1. Headings (h1-h6): Verify all levels render with correct sizes
2. Blockquotes: Verify styling and indentation
3. Code blocks: Verify monospace font and whitespace preservation
4. Inline code: Verify inline rendering with monospace
5. Strikethrough: Verify line-through styling
6. Horizontal rules: Verify border and spacing
7. Lists: Verify existing functionality still works
8. Links: Verify existing functionality still works

**Security tests:**
1. XSS attempts: Verify sanitization blocks script tags
2. HTML injection: Verify marked doesn't allow inline HTML
3. Event handlers: Verify DOMPurify removes event handlers

### Test Case 2: Optimal Text Sizing

**Test fill space algorithm:**
1. Short content: Verify large font fills space
2. Long content: Verify small font fits without overflow
3. Mixed content: Verify algorithm accounts for all elements
4. Edge cases: Very short (1 word), very long (1000 words)

**Test Layout Grammar compliance:**
1. No scrolling: Verify `overflow-y: auto` removed
2. No overflow: Verify content fits within container
3. No truncation: Verify all content visible
4. Fill space: Verify minimal empty spaces

### Test Case 3: Backward Compatibility

**Test existing content:**
1. Existing markdown: Verify still renders correctly
2. Plain text: Verify still renders correctly
3. Mixed content: Verify markdown + plain text works

---

## 📝 Implementation Checklist

### Phase 1: Full Markdown Support
- [ ] Update `lib/markdownUtils.ts` - Remove renderer limitations
- [ ] Update `lib/markdownUtils.ts` - Enable GFM features
- [ ] Update `lib/sanitize.ts` - Add new tags to allowlist
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Add heading level styles
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Add blockquote styles
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Add code block styles
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Add strikethrough styles
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Add horizontal rule styles
- [ ] Update `lib/textFontSizeCalculator.ts` - Match new markdown element styles
- [ ] Test all markdown features
- [ ] Test security (XSS protection)

### Phase 2: Optimal Text Sizing
- [ ] Update `lib/textFontSizeCalculator.ts` - Increase max font-size to 4rem
- [ ] Update `lib/textFontSizeCalculator.ts` - Implement "fill space" algorithm
- [ ] Update `lib/textFontSizeCalculator.ts` - Account for vertical fill
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Remove `overflow-y: auto`
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Add `overflow: hidden`
- [ ] Update `app/report/[slug]/ReportChart.module.css` - Increase max font-size to 4rem
- [ ] Update `hooks/useUnifiedTextFontSize.ts` - Pass maxFontSize: 4
- [ ] Test fill space algorithm (short content, long content, mixed)
- [ ] Test Layout Grammar compliance (no scrolling, no overflow, no truncation)

---

## 🔒 Security Considerations

1. **XSS Protection:**
   - All markdown parsed HTML sanitized via DOMPurify
   - No inline HTML allowed (marked default)
   - No script tags, event handlers, or dangerous attributes

2. **Sanitization:**
   - Update `sanitizeMarkdownHTML` to allow new tags (blockquote, pre, code, del, s, hr)
   - Maintain strict allowlist (no arbitrary HTML)

3. **Testing:**
   - Test XSS attempts with new markdown features
   - Verify sanitization blocks dangerous content

---

## 📚 Documentation Updates

1. **Update markdown documentation:**
   - Document all supported markdown features
   - Provide examples for each feature
   - Update `MARKDOWN_TEXT_FEATURE.md` (if exists)

2. **Update text sizing documentation:**
   - Document "fill space" algorithm
   - Explain Layout Grammar compliance
   - Update Layout Grammar docs if needed

---

## 🚀 Rollout Plan

1. **Phase 1 (Full Markdown Support):**
   - Implement markdown parser updates
   - Add CSS styles for new elements
   - Test all features
   - Deploy to preview

2. **Phase 2 (Optimal Text Sizing):**
   - Implement fill space algorithm
   - Remove scrolling (Layout Grammar compliance)
   - Test sizing with various content
   - Deploy to preview

3. **Verification:**
   - Test on multiple reports
   - Verify backward compatibility
   - Check security (XSS protection)
   - Monitor for errors

---

## 📊 Success Criteria

### Full Markdown Support
- ✅ All standard markdown features render correctly
- ✅ Security maintained (XSS protection)
- ✅ Backward compatibility preserved
- ✅ All features documented

### Optimal Text Sizing
- ✅ Text fills available space (minimal empty spaces)
- ✅ No scrolling (Layout Grammar compliant)
- ✅ No overflow (content fits within container)
- ✅ No truncation (all content visible)
- ✅ Works with all markdown elements

---

## 🔮 Future Enhancements (Out of Scope)

1. **Syntax highlighting for code blocks:**
   - Add syntax highlighting library (e.g., Prism.js, highlight.js)
   - Support multiple languages

2. **Markdown toolbar:**
   - Visual formatting buttons
   - Keyboard shortcuts

3. **Advanced GFM features:**
   - Task lists with checkboxes
   - Footnotes
   - Definition lists

---

**End of Plan**

— Tribeca

