# Tutorial: Content Library (images & text)
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & admins · Prerequisites: Admin sign-in · Related: [Charts & formulas](guides-tutorial-charts-formulas.md) · [Variables (KYC)](guides-tutorial-variables-kyc.md) · [Reports](guides-tutorial-reports.md)

## What it is & why it matters
The **Content Library** at `/admin/content-library` (titled **📚 Content Library** — "Define image and text variables for event-specific content") is where you manage the non-numeric content that appears on reports: images (logos, photos, sponsor artwork) and text blocks (executive summaries, captions, markdown tables).

Every asset gets a **slug**, and that slug becomes a reference **token** you drop into a chart formula — `[MEDIA:slug]` for an image, `[TEXT:slug]` for text. Instead of hardcoding a URL or a paragraph into a chart, you reference the library entry by token. Update the library entry once and every chart that references it updates too.

The library supports two modes that solve two different problems:

| Mode | What it is | Use it for | Content at creation |
|---|---|---|---|
| **📋 Variable Definition** | A field filled per-event in the editor's Builder/Manual mode | Content that changes every activation ("Event Photo 1") | Optional — filled later per project |
| **🌐 Global Asset** | Reusable content shared across all projects | A company logo, a boilerplate disclaimer | Required — uploaded/entered now |

Both produce the same kind of token; the difference is *when and where* the actual content is supplied.

## Before you start
- Sign in as an admin and open `/admin/content-library`.
- Decide the mode for what you're creating: is this a per-event slot to be filled later (Variable Definition), or fixed content reused everywhere (Global Asset)?
- Have your image ready to upload (for image assets) or your text/markdown ready to paste (for text assets) if you're creating a Global Asset — content is required in that mode.

## Step by step

### 1. Browse and filter the library
Each asset is a card showing a preview (image thumbnail or text snippet), its **title**, an **Image / Text** badge, its reference **token** as a code chip, its category and tags, and — if referenced — a **Used in N charts** badge. The hero shows a **Variable Registry** badge and a live count of variables.

Narrow the list with:
- the hero **search** (matches title, description, slug, tags),
- **Type** (All / 🖼️ Images / 📝 Text),
- **Category** (built from your assets),
- **Sort By** (Date Created / Title / Usage Count) and **Order** (Descending / Ascending).

### 2. Create an image asset
Click **📷 New Image Variable**. In the modal:
1. Choose the mode — **📋 Variable Definition** (define the field, upload the actual image per-project in Manual Edit) or **🌐 Global Asset** (upload a reusable image now).
2. **Title** — e.g. `Event Photo 1` or `{messmass} Logo`.
3. **Slug** — auto-generated from the title (e.g. `event-photo-1`); editable.
4. **Description** (optional, aids search).
5. **Category** and **Tags** (type a tag, press Enter or **Add**; click a tag to remove it).
6. **Aspect Ratio** — 16:9 (Landscape), 1:1 (Square), or 9:16 (Portrait).
7. **Upload Image** — required for a Global Asset; optional for a Variable Definition (the field is filled per-project later).

Click **Create Variable**.

### 3. Create a text asset
Click **📝 New Text Variable**. The flow mirrors images: pick the mode, set title/slug/description/category/tags, then enter **Text Content** (markdown supported). Content is required for a Global Asset and optional for a Variable Definition. A character counter is shown.

### 4. Copy the reference token
Every card has a **Copy Token** button. It copies the exact token to your clipboard — `[MEDIA:slug]` for images, `[TEXT:slug]` for text — ready to paste into a [chart formula](guides-tutorial-charts-formulas.md). The token is also shown on the card as a code chip.

### 5. Edit an asset
Click **Edit** to change the title, description, category, tags, image/aspect ratio, or text content. If you change the **slug**, the modal warns you: existing chart references to the old token will break. If the asset is already used, the modal also notes how many charts reference it.

### 6. Check usage and delete safely
- Click the **Used in N charts** badge (or **Delete**) to see exactly which charts reference the asset — each listed with its title, chart ID, and type.
- A plain **Delete** on an unused asset asks for confirmation and removes it.
- If the asset **is** in use, deletion is blocked and the **⚠️ Asset In Use** dialog lists the affected charts. You can proceed with **Force Delete Anyway** — but doing so will break those charts, so fix or repoint them first.

### 7. A worked example
To put a sponsor logo on every report and a per-event hero photo on each one:
1. Create a **🌐 Global Asset** image titled `Sponsor Logo`, slug `sponsor-logo`, and upload the artwork. Its token becomes `[MEDIA:sponsor-logo]`.
2. Create a **📋 Variable Definition** image titled `Hero Photo`, slug `hero-photo`, no upload yet. Its token becomes `[MEDIA:hero-photo]`.
3. In [Charts & formulas](guides-tutorial-charts-formulas.md), build two image charts: one whose element formula is `[MEDIA:sponsor-logo]`, one whose formula is `[MEDIA:hero-photo]`.
4. Place both charts on the report. The sponsor logo shows everywhere immediately; the hero photo shows once each event's operator uploads it in Builder/Manual mode.
5. Update the sponsor artwork later by editing the one Global Asset — every report refreshes without touching a single chart.

## Managing it
**Variable Definition vs Global Asset — which to choose.** Use a **Variable Definition** when each event supplies its own value (the library defines the *slot*; operators fill the image or text per-project in the editor's Builder/Manual mode). Use a **Global Asset** when the content is the same everywhere (a logo, a boilerplate disclaimer) and you want to store it once and reference it by token from any chart.

**Slugs are the contract.** A slug is the stable identifier a token points at. Slugs are lowercase and URL-safe (kebab-case such as `partner-abc-logo`, or a `stats.camelCase` field name). Because tokens embed the slug, renaming a slug orphans every chart that referenced the old one — the edit modal warns you precisely for this reason.

**Usage tracking is automatic.** The library counts how many charts reference each asset and exposes it as the **Used in N charts** badge and the usage dialog. This is your safety net before deleting.

**Slug rules and auto-generation.** When you type a title, the slug is auto-suggested by lowercasing it, stripping punctuation, and replacing spaces with hyphens (`Partner ABC Logo` → `partner-abc-logo`). You can override it. A valid slug is either kebab-case (`partner-abc-logo`) or a `stats.camelCase` field name (`stats.fanSelfiePortrait1`); the form rejects anything else.

**Aspect ratio drives layout width.** For image and text assets the aspect ratio you pick (16:9 Landscape, 1:1 Square, 9:16 Portrait) determines how wide the content sits in the report grid. Choose the ratio that matches the artwork so it isn't letterboxed or cropped on the report.

## Gotchas & good practice
- **Don't rename slugs casually.** A slug change breaks existing `[MEDIA:slug]` / `[TEXT:slug]` references. If you must, update every referencing chart afterwards.
- **Force Delete breaks charts.** The dialog lists exactly which ones — treat that list as a to-do, not a formality.
- **Global content belongs in Global Assets.** Putting a shared logo in a per-event Variable Definition means re-uploading it for every event; store it once as a Global Asset and reference the token.
- **Variable Definitions can be created empty.** That's intentional — you're defining the field now and filling content per-project later. Don't expect a preview until an event fills it.
- **Tokens are case-specific prefixes.** Images use `MEDIA`, text uses `TEXT`. Use **Copy Token** rather than typing to avoid mistakes.
- **Categorise and tag as you go.** The filters are only as useful as the metadata you enter.

## How it connects
- **Where tokens are used:** `[MEDIA:slug]` and `[TEXT:slug]` are referenced inside [Charts & formulas](guides-tutorial-charts-formulas.md), typically by image/text/table charts.
- **Per-event content:** Variable Definitions are filled during [Collecting data](guides-tutorial-collecting-data.md) (Builder mode) and surface on [Reports](guides-tutorial-reports.md).
- **The wider catalog:** numeric and short text variables live in [Variables (KYC)](guides-tutorial-variables-kyc.md); the Content Library focuses on images and longer text.

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Charts & formulas](guides-tutorial-charts-formulas.md)
- [Variables (KYC)](guides-tutorial-variables-kyc.md)
- [Collecting event data](guides-tutorial-collecting-data.md)
- [Reports](guides-tutorial-reports.md)
