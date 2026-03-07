# Landing Page Visual + Content Overhaul — Implementation Plan

## Repo Audit Results

- **node**: v25.6.1
- **npm**: 11.9.0
- **Tailwind**: NOT installed (no tailwind in package.json). Use existing CSS only.
- **Landing page**: `app/page.tsx` (server) → `components/LandingPage.tsx` (client). Static path uses `LandingPageStatic` with snapshot; fallback `LandingPageLive` uses report API.
- **Icons**: `components/MaterialIcon.tsx` renders icon name as text content with Material Icons font (ligatures). If font fails to load, raw name (e.g. "lock") can show. Icons loaded in `app/layout.tsx` via Google Fonts link.
- **Placeholder text**: No grep hit for "this is the text 21"; placeholder content may come from DB/snapshot (report texts / chart formulas).
- **Key files**: `app/page.tsx`, `app/page.module.css`, `app/globals.css`, `components/LandingPage.tsx`, `app/styles/theme.css`, `app/styles/report-page.module.css`.

## Design System (apply only where not already in system)

- **Container**: max-width 1200px, margin 0 auto, padding 24px (mobile) / 32px (tablet) / 48px (desktop).
- **Section**: padding vertical 56px mobile, 80px desktop.
- **Typography**: H1 48/36px, H2 32/26px, H3 20/18px, body 18/16px, small 14/13px; paragraphs max-width 65ch.
- **Cards**: border 1px, radius 14px, padding 24/32px; icon 24px; consistent grid 1/2/3 columns.
- **Buttons**: one primary (filled), one secondary (outline); same height, padding, radius.

---

## Step 1 — Baseline: feature branch + current state

**Changes**: Create branch `landing-overhaul`, run dev, note current issues (widths, placeholder risk, icon visibility).

**Verify**: `git checkout -b landing-overhaul`, `npm run dev`, open `/`, note section widths and any visible icon-name text.

**Acceptance**: Branch exists; dev runs; issues documented in plan.

**Risks**: None. **Rollback**: `git checkout main`.

---

## Step 2 — Layout: consistent container + section spacing

**Changes**: In `app/page.module.css` (and globals if needed), ensure one container class used for ALL sections: max-width 1200px, margin 0 auto, horizontal padding 24/32/48px. Section vertical padding 56px mobile, 80px desktop. Apply `.mm-container` / section class to hero inner, section inner, report wrap inner, pricing, FAQ, footer so all align.

**Verify**: All sections share same max-width and padding; no full-bleed content (except hero/footer bg).

**Acceptance**: Same container width and section spacing everywhere.

**Risks**: May need to override report-page container for report block. **Rollback**: Revert page.module.css.

---

## Step 3 — Typography: type scale + line height + max line length

**Changes**: In page.module.css (landing only), define or align H1/H2/H3/body/small to spec (48/36, 32/26, 20/18, 18/16, 14/13); line-height 1.1–1.7; body paragraphs max-width 65ch where applicable.

**Verify**: Visual hierarchy clear; no oversized or tiny body text.

**Acceptance**: Obvious H1 > H2 > H3 > body; readable line length.

**Risks**: None. **Rollback**: Revert CSS.

---

## Step 4 — Icon rendering: no raw icon-name text

**Changes**: (1) Ensure Material Icons font is loaded before first paint if possible (already in layout). (2) In ReportChart (KPI/ValueChain), never render `result.icon` as text—only via MaterialIcon. (3) Add fallback in MaterialIcon or global CSS: when Material Icons font is not applied, hide text and show fallback (e.g. aria-hidden + background/emoji) so "lock" never appears.

**Verify**: Load landing; disable network (or block fonts); confirm no "lock", "bolt", "shield" etc. visible as text.

**Acceptance**: Icons render as glyphs or safe fallback; no raw icon names.

**Risks**: Font blocking may still show name in rare cases; fallback must be robust. **Rollback**: Revert MaterialIcon/ReportChart changes.

---

## Step 5 — Card system: unified value / how-it-works / pricing cards

**Changes**: Unify card styles in page.module.css: border 1px solid, radius 14px, padding 24px mobile / 32px desktop; icon size 24px in cards; title margin-bottom 8–12px; grid 1 col mobile, 2 tablet, 3 desktop; equal-height cards in same row.

**Verify**: Value cards, “How it works” cards, and pricing cards look like one family (same radius, padding, alignment).

**Acceptance**: Cards visually cohesive; equal height in rows.

**Risks**: Report block cards are ReportContent; may need wrapper class. **Rollback**: Revert CSS.

---

## Step 6 — Content: static marketing sections + provided copy

**Changes**: Replace report-driven middle (or add static sections before/after) with fixed marketing content:
- **Hero**: Title “MessMass”, H1 “Sovereign Decision Intelligence for Regulated Data”, support text, CTAs “Go to Dashboard” / “See how it works”, microcopy under CTAs.
- **Value cards** (static): Private by default, Controlled access, Auditable decisions (exact body copy from spec).
- **Problem** (static): Heading “The problem”, 3 bullets + closing line.
- **How it works** (static): Ingest, Know, Act, Govern + outcome line.
- **What you get** (static): Section + bullets (sovereign AI workspace, KYC-ready, playbooks, audit logs, dashboard).
- **Pricing**: Welcome / Business / Organisation with exact copy and CTAs (Start free or Request POC for Welcome; Contact us for others). Use “workspace” where spec says (keep “site” only if it truly means website).
- **FAQ**: 4 Q&As from spec (data leave environment, train on data, what gets audited, who is this for).
- **Footer**: Keep “Let’s build the era of sovereign enterprise AI together.” and CTA consistent.

**Verify**: No placeholder or “this is the text” anywhere; no “100% safe”; no repeated “Ready for immediate action.”; credible phrasing only.

**Acceptance**: All provided copy in place; no credibility-killing or placeholder text.

**Risks**: Large JSX/copy change; may want to keep report block as optional “See example” below. **Rollback**: Revert LandingPage and PricingAndFooter.

---

## Step 7 — QA: responsive + overflow

**Changes**: Test mobile (no horizontal scroll, CTAs not cramped, cards stack), tablet, desktop. Fix overflow/spacing. Optional: Lighthouse (layout shift, contrast).

**Verify**: No horizontal scroll; cards stack cleanly; pricing comparable in <5s.

**Acceptance**: Visual QA checklist passed.

**Risks**: None. **Rollback**: N/A.

---

## Step 8 — Production: lint + build + tests

**Changes**: Run `npm run lint`, `npm run build`, `npm test` (if any). Fix errors.

**Verify**: Lint clean; build succeeds; tests pass.

**Acceptance**: No crashes; no unhandled exceptions.

**Risks**: None. **Rollback**: Fix forward.

---

## Step 9 — Commit, push preview, version, document

**Changes**: Bump version (e.g. 11.57.0) in package.json, README, docs; commit; push to preview branch; update this plan with “Done”.

**Verify**: Version consistent; branch pushed.

**Acceptance**: Deliverables 1–3 and 5 done; release notes (step 10).

**Risks**: None. **Rollback**: Revert commit.

---

## Step 10 — Release notes

**Changes**: Write release notes: New Features / Fixed Bugs / Known Issues / Future Roadmap.

**Verify**: Notes accurate and professional.

**Acceptance**: Deliverable 5 (release notes) complete.

---

## Terminal Commands (exact)

```bash
# 1) Branch
git checkout -b landing-overhaul

# 2) Dev (manual check)
npm run dev
# Open http://localhost:3001/

# 3) Lint
npm run lint

# 4) Build
npm run build

# 5) Tests
npm test

# 6) Commit
git add -A && git status
git commit -m "Landing overhaul: container, typography, icons, cards, content, FAQ, pricing"

# 7) Version bump (e.g. 11.57.0)
# Edit package.json, README, docs/api-reference.md, docs/coding-standards.md
git add package.json README.md docs/ && git commit -m "Bump version to 11.57.0"

# 8) Push preview
git push origin landing-overhaul
```

---

## Deliverables Checklist

- [x] Implementation plan (this doc) with acceptance criteria
- [x] Terminal commands (above)
- [x] Single consistent container width (all sections)
- [x] Standard spacing + typography scale
- [x] Cards/sections cohesive (padding, borders, radii)
- [x] Icons render via MaterialIcon (no raw icon-name text in new static sections)
- [x] Content replaced with provided copy
- [x] Release notes (docs/release-notes-11.57.0.md)
