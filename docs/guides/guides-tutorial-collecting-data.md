# Tutorial: Collecting event data (Clicker & Manual)
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & implementation partners (partners can self-serve data entry via a shared link) · Prerequisites: An event already exists (see Events); the edit link or an admin sign-in · Related: [Events](guides-tutorial-events.md) · [Variables (KYC)](guides-tutorial-variables-kyc.md) · [Clicker sets](guides-tutorial-clicker-sets.md) · [Sharing & access](guides-tutorial-sharing-access.md)

## What it is & why it matters
Every chart on a report is fed by the event's `stats{}` — the numbers and text captured during and after an activation. This tutorial covers how those stats get in, and the single most important rule: **the different data sources never overwrite each other.**

There are **three ways stats enter an event**:

1. **The Editor (Clicker / Manual / Builder)** at `/edit/{editSlug}` — hands-on counting and typing.
2. **Google Sheets sync** — pull/push numbers from a connected sheet.
3. **Fanmass** — image/person/brand analytics synced into dedicated variables.

Each source writes to its own variables, so counting attendees in the clicker will not be clobbered by a Fanmass sync, and a Google Sheets pull will not wipe your clicker totals. Understanding which source owns which variable keeps your data clean.

| Source | Where you use it | Typical variables it owns |
|---|---|---|
| Clicker / Manual editor | `/edit/{editSlug}` | Core counts — images, fans, gender, generations, merch, visits, event outcome |
| Google Sheets | Editor sync (pull/push) | Whatever the connected sheet maps to |
| Fanmass | `/admin/events` → Fanmass Sync | `[fanmass.*]` and `[fanmass*]` analytics variables |

## Before you start
- Get into the editor one of two ways:
  - **As an admin:** sign in, open the event from `/admin/events`, and choose **Open Editor** (or navigate to `/edit/{editSlug}`). Signed-in admins skip the password prompt.
  - **As a partner / field operator:** open the **edit link** you were given and enter the **page password** when prompted (see the sharing section below). No admin account needed.
- Know your event's clicker set. Which counters appear, and in what order, is decided by the event's partner **clicker set** and the admin-defined **variable groups** — not by the editor itself.

## Step by step

### 1. Open the editor and pick a mode
At `/edit/{editSlug}` the **EditorDashboard** loads. One button cycles through three modes:

- **🖱️ Clicker** — tap/click a counter card to increment it by one. Built for live counting on a phone or tablet during the activation.
- **✏️ Manual** — type exact numbers into each field. Values save automatically when you leave a field (on blur); a **Save** button is also shown.
- **🏗️ Builder** — shows the report template's layout and, for each chart block, the inputs that feed that chart (numbers, text areas, image uploads). Use this to fill report-specific content in context. A **Save** button is shown here too.

Clicker and Manual show the **same variables** — the difference is only how you enter them (tap to count vs. type a number).

### 2. Enter the core counts (Clicker)
In **Clicker** mode you will see grouped cards such as images taken, fans, gender split, generations, merchandise, image approval, visits, and event outcome. Tap a card each time you observe that thing. The running total updates immediately. Because clicker increments are per-tap, this mode is designed to be used live rather than reconciled afterwards.

### 3. Correct or bulk-enter numbers (Manual)
Switch to **Manual** to type exact figures — useful when you already have totals (e.g. official attendance) or need to fix a mis-tap. Enter the number and click away; it saves on blur. Use **Save** to confirm.

### 4. Fill report content (Builder)
Switch to **Builder** when you need to populate the text, tables, and images that appear on the report — the inputs are grouped by the chart they feed, so you fill exactly what each block needs. See [Reports](guides-tutorial-reports.md) and the [Reporting & Builder feature guide](../features/features-reporting-builder.md) for how these map to charts.

### 5. Sync from Google Sheets (optional)
If the event is connected to a Google Sheet, the editor exposes an event-level sync (pull/push). Use it to bring spreadsheet-maintained numbers into the event or push the event's numbers out. See [Google Sheets](guides-tutorial-google-sheets.md) and the [Google Sheets integration feature guide](../features/features-google-sheets-integration.md).

### 6. Sync Fanmass analytics (optional)
From `/admin/events`, the per-event **Fanmass Sync** action links a Fanmass batch and imports its analytics into the event. Fanmass writes to its **own** variables — nested ones like `[fanmass.peopleCount]`, `[fanmass.projectedReach]`, `[fanmass.brands]`, and flat ones like `[fanmassPeopleCount]`, `[fanmassProjectedReach]`, `[fanmassTopBrandName]` — so it never overwrites clicker or manual stats. See [Fanmass](guides-tutorial-fanmass.md).

## Managing it
**How clicker sets and variable groups decide what you see.**

The editor does not hard-code its layout. It renders from **variable groups** (admin-defined) that belong to a **clicker set**:

- A **clicker set** is a named collection of variable groups. Each partner can be assigned a clicker set; the event inherits it from its Partner 1 (or Partner 2). If a partner has no clicker set, the editor falls back to the **Default Clicker** layout and shows a banner: "Using default clicker layout because the partner's assigned clicker set is missing. Please update the partner's clicker set in Admin."
- A **variable group** has a **group order**, a list of **variables in order**, and visibility flags **visible in clicker** and **visible in manual**. Groups render top-to-bottom by group order, and within a group the counters appear in the order the variables are listed.
- Individual variables also carry flags — **visible in clicker** and **editable in manual** — so an admin can show a variable in one mode but not the other.

So the answer to "which counters appear and in what order" is always: the assigned clicker set → its variable groups (by group order) → the variables inside each group (in list order), filtered by the per-mode visibility flags.

**A concrete example.** A freshly seeded Default Clicker lays out groups roughly like this:

1. Images taken — `remoteImages`, `hostessImages`, `selfies`
2. Fans — `remoteFans`, `stadium`
3. Gender — `female`, `male`
4. Generations — `genAlpha`, `genYZ`, `genX`, `boomer`
5. Merchandise — `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`
6. Image approval — `approvedImages`, `rejectedImages`
7. Visits & value proposition — `visitQrCode`, `visitShortUrl`, `socialVisit`, `visitWeb`, and so on
8. Event outcome — `eventAttendees`, `eventResultHome`, `eventResultVisitor`

Reorder a group or move a variable within it in Admin, and the editor's counters move with it — no code change and no per-event fiddling.

If the editor shows **"No groups configured — Go to Admin → KYC Variables to configure variable groups"**, an admin needs to set up groups at `/admin/variables`. See [Variables (KYC)](guides-tutorial-variables-kyc.md) and [Clicker sets](guides-tutorial-clicker-sets.md).

**Sharing the edit page with a partner (self-service data entry).**

Partners can enter their own data without an admin account:

1. From `/admin/events`, open the event's **Share Edit Page** action. The Share popup generates a **shareable URL** for `/edit/{editSlug}` plus a **page password**.
2. Send the partner the **URL and the password separately** (the popup even suggests this for security).
3. The partner opens the link, enters the password once, and lands directly in the editor. Their session is remembered for **24 hours**, after which they re-enter the password.
4. Signed-in admins never see the prompt — they bypass it automatically.

Full details, page types, and session behaviour are in [Sharing reports & access control](guides-tutorial-sharing-access.md).

## Gotchas & good practice
- **Sources are additive, not competitive:** clicker, manual, Google Sheets, and Fanmass each own their variables. Re-syncing Fanmass will not reset your clicker attendance, and a sheet pull will not erase manual edits. If a number "disappeared," check whether you were looking at a different variable, not an overwrite.
- **Clicker is for live counting; Manual is for reconciliation:** don't try to "fix" a live-count discrepancy by tapping backwards — switch to Manual and type the correct total.
- **Manual saves on blur:** click out of the field (or use Save) to persist. Navigating away mid-edit before blur can drop the last value.
- **Empty editor? It's configuration, not a bug:** "No groups configured" means an admin must set up variable groups at `/admin/variables`. The fallback banner means the partner's clicker set is missing and the default layout is standing in.
- **Order is admin-controlled:** if operators want counters reordered, that's a change to the variable group order in Admin, not something you fix per-event.
- **Share the password out-of-band:** send the edit URL and its page password through separate channels so a single leaked message can't unlock editing.

## How it connects
- **Events:** the editor edits one event's `stats{}` — see [Events](guides-tutorial-events.md).
- **What appears in the editor:** driven by [Variables (KYC)](guides-tutorial-variables-kyc.md) and [Clicker sets](guides-tutorial-clicker-sets.md).
- **What the numbers become:** charts and formulas on the report — see [Charts & formulas](guides-tutorial-charts-formulas.md) and [Reports](guides-tutorial-reports.md).
- **Other inbound sources:** [Google Sheets](guides-tutorial-google-sheets.md) and [Fanmass](guides-tutorial-fanmass.md).
- **Letting partners in:** [Sharing reports & access control](guides-tutorial-sharing-access.md).

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Events](guides-tutorial-events.md)
- [Variables (KYC)](guides-tutorial-variables-kyc.md)
- [Clicker sets](guides-tutorial-clicker-sets.md)
- [Charts & formulas](guides-tutorial-charts-formulas.md)
- [Google Sheets](guides-tutorial-google-sheets.md)
- [Fanmass](guides-tutorial-fanmass.md)
- [Sharing reports & access control](guides-tutorial-sharing-access.md)
