# Release Notes — v11.57.0

**Release date:** 2026-02-22

## New Features

- **Landing page overhaul (messmass.com)**  
  - Single consistent container (max-width 1200px) and section spacing (56px / 80px vertical) across all sections.  
  - New conversion-oriented hero: “Sovereign Decision Intelligence for Regulated Data” with supporting copy and microcopy for KYC/onboarding/fraud/compliance teams.  
  - Static value-proposition cards: Private by default, Controlled access, Auditable decisions (with Material Icons: lock, bolt, shield).  
  - “The problem” section with three bullets and closing line on local agentic workflows and compliance.  
  - “How it works”: Ingest, Know, Act, Govern with outcome line (“From raw KYC to action-ready decisions in minutes, not days”).  
  - “What you get out of the box”: sovereign AI workspace, KYC-ready data model, playbooks/personas, evidence-grade audit logs, operational dashboard.  
  - Pricing tiers updated: Welcome (Free forever), Business ($99 USD/month), Organisation (Custom) with subheads and “workspace” terminology; CTAs: Start free / Contact us.  
  - FAQ reduced to four items with credible phrasing (data in environment, no training on customer data, what gets audited, who it’s for).  
  - Typography scale aligned to design spec (H1 48/36px, H2 32/26px, body 18/16px, max line length 65ch).  
  - Unified card styling (border, 14px radius, 24/32px padding, 24px icons) for value and how-it-works cards.  
  - Optional report block still shown when static snapshot has blocks; “See how it works” scrolls to #how-it-works.

## Fixed Bugs

- **Landing layout and content**  
  - Inconsistent section widths and inner max-widths replaced with a single 1200px container and responsive horizontal padding (24/32/48px).  
  - Placeholder or DB-driven marketing copy replaced with fixed, professional sales copy; no “100% safe” or absolute security claims.  
  - Icons on the static landing sections render via MaterialIcon (lock, bolt, shield, upload, insights, touch_app, admin_panel_settings) so icon names are not shown as raw text when the Material Icons font loads (font is loaded in app layout).  
  - Em dashes in new copy replaced with commas where appropriate for coding-standards compliance.

## Known Issues

- **Icons:** If the Material Icons font fails to load (e.g. network block), the icon name may appear as text in some contexts; font is loaded in `app/layout.tsx`.  
- **Live path:** When no static snapshot is available, the landing falls back to `LandingPageLive`, which still uses report/API-driven hero and report block; hero copy there is unchanged.  
- **Lint:** Existing lint warnings (e.g. console statements, admin login inline styles) remain; no new lint errors introduced by this release.

## Future Roadmap

- Optional: hide icon name when Material Icons font fails (e.g. fallback glyph or aria-hidden + visual fallback).  
- Consider aligning `LandingPageLive` hero and sections with the same conversion copy when static snapshot is missing.  
- Lighthouse and responsive QA pass; document any layout-shift or contrast tweaks.
