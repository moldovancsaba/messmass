# Tutorial: Clicker sets & variable groups
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & admins · Prerequisites: Admin sign-in; variables already exist in KYC · Related: [Variables (KYC)](guides-tutorial-variables-kyc.md) · [Collecting data](guides-tutorial-collecting-data.md) · [Partners](guides-tutorial-partners.md)

## What it is & why it matters
A **clicker set** is a named layout of the data-entry screen. It decides which counters appear in the `/edit/{editSlug}` editor, how they are grouped, and in what order. The **Clicker Sets** page at `/admin/clicker-manager` (titled **↔️ Clicker Sets** — "Configure reusable clicker layouts, variable groups, and editor ordering") is where you build and maintain them.

Why sets exist: different partners count different things. One partner may only track images and fans; another needs full merchandise and value-proposition breakdowns. Rather than force one universal layout, you build a clicker set per need and **assign it to a partner**. Every event under that partner inherits the layout. If a partner has no set assigned, the editor falls back to the built-in **Default Clicker**.

The editor does not hard-code its layout — it renders exactly what the assigned set's variable groups describe. Reorder a group here and the counters move in the editor, with no code change.

## Before you start
- Sign in as an admin and open `/admin/clicker-manager`.
- The variables you want to place must already exist in [KYC](guides-tutorial-variables-kyc.md) **and be flagged "Visible in Clicker"** — only clicker-visible variables are offered when you build a group.
- Decide which clicker set you are editing. The page always works against **one selected set** (persisted in your browser), shown in the **🎮 Clicker Set** selector card.

## Step by step

### 1. Pick or create a clicker set
The **🎮 Clicker Set** card ("Select which clicker layout to edit — partner-assignable") holds the set selector and its controls:
- **➕ New Set** — name it (e.g. "Partner A Clicker"). New sets start **empty**; tick **Clone groups from currently selected set** to copy the current layout as a starting point.
- **✏️ Rename** — rename the selected set.
- **⭐ Make Default** — mark this set as the fallback (Default) layout.
- **🗑️ Delete** — remove the selected set (you cannot delete the current Default).

The dropdown shows each set, a ⭐ on the default, and a partner count (e.g. "(3 partners)") where assigned.

### 2. Seed a starting layout (optional)
On an empty set, click **Seed Defaults** (or the **🌱 Seed Default Groups** button on the empty-state card) to create the standard eight-group layout:

1. Images taken — `remoteImages`, `hostessImages`, `selfies` (with an attached "all images" KPI chart)
2. Fans — `remoteFans`, `stadium`
3. Gender — `female`, `male`
4. Generations — `genAlpha`, `genYZ`, `genX`, `boomer`
5. Merchandise — `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`
6. Image approval — `approvedImages`, `rejectedImages`
7. Visits & value proposition — `visitQrCode`, `visitShortUrl`, `socialVisit`, `visitWeb`, `eventValuePropositionVisited`, `eventValuePropositionPurchases`
8. Event outcome — `eventAttendees`, `eventResultHome`, `eventResultVisitor`

Seeding only runs when the selected set has no groups, so it never clobbers an existing layout.

### 3. Add a variable group
Click **New Group** (enabled once a set is selected). In the group form:
- **Group Order** — a number; groups render top-to-bottom by this order.
- **Chart Algorithm (optional)** — attach a KPI/chart to head the group. Search by name or ID and pick from the dropdown; ✅ marks active charts, ❌ inactive.
- **Title Override (optional)** — a heading for the group (e.g. "Images").
- **Visibility in Edit Modes** — **↔️ Show in Clicker Mode** and **✏️ Show in Manual Mode**. A group can appear in one mode but not the other.
- **Variables in Group** — search the **Add Variables** list (only clicker-visible variables appear), click **+ Add**, and reorder with the **↑ / ↓** buttons or remove with **✕**. The order here is the order counters appear.

A non-special group must have at least one variable. Click **Save Group**.

### 4. Add the special "Report Content" group
Click **Add Report Content** (the 📦 button). This inserts a group with `specialType: 'report-content'` and the title **📦 Report Content**. It carries no counters — it is a placeholder that controls the report-content block in the editor's Builder mode, where operators fill report text, tables, and images. It shows a purple **📦 Report Content** badge instead of a variable count.

### 5. Edit, reorder, and delete groups
Each group card shows its order, title, either a variable count or the Report Content badge, and an attached-chart badge (📊 chart-id) if one is set. From a card you can:
- toggle its **↔️ Clicker** / **Manual** visibility checkboxes inline,
- **Edit** to reopen the full group form,
- **Delete** (with confirmation) to remove just that group.
Reordering is done by editing a group's **Group Order** number.

### 6. Housekeeping
- **Refresh Variables** (🔄) — forces the shared KYC variable cache to refresh, so a variable you just created in KYC becomes available to add here.
- **Delete All** — removes every group in the **currently selected set only** (with confirmation). It resets that set's layout; other sets are untouched.

### 7. Assign the set to a partner
A layout only reaches an event through its partner. On the [Partners](guides-tutorial-partners.md) edit form, choose this clicker set. Events under that partner then render its layout in the editor. Leave a partner's set unassigned and its events use the Default Clicker.

### 8. A worked example — a stripped-down partner layout
A partner only tracks images and attendance and finds the full default overwhelming:
1. Select their set (or **➕ New Set** "Partner A Clicker" — you can clone from the default to start).
2. **Delete All** the groups you don't need, or start empty.
3. **New Group** — order 1, title "Images", add `remoteImages`, `hostessImages`, `selfies`, both modes visible.
4. **New Group** — order 2, title "Attendance", add `eventAttendees`, both modes visible.
5. **Add Report Content** so operators can still fill the report's text/images in Builder mode.
6. On the [Partners](guides-tutorial-partners.md) form, assign "Partner A Clicker" to the partner.

Every event under that partner now shows just two counter groups plus the report-content block — no merchandise, no generations, no clutter.

## Managing it
**One set, one selection.** The page edits exactly one set at a time; your selection is remembered in the browser. All group create/edit/delete operations are scoped to that set — there is no accidental cross-set editing.

**Groups vs variables.** A **variable group** owns three things: an order, an ordered list of variable names, and per-mode visibility. It optionally owns a title override and an attached chart. The variables themselves (their type, label, and clicker/manual flags) still live in [KYC](guides-tutorial-variables-kyc.md) — a group only *references* them by name.

**Missing variables.** If a group lists a variable name that no longer exists (deleted or renamed in KYC), the card shows a yellow "N missing" badge. Fix it by editing the group and removing or replacing the stale entry.

**What the editor does with all this.** In `/edit/{editSlug}`, the editor loads the event's partner clicker set, then renders its groups by order, then the variables inside each group by list order, filtered by the per-mode visibility flags. That full chain is described in [Collecting data](guides-tutorial-collecting-data.md).

## Gotchas & good practice
- **Only clicker-visible variables can be added.** If a variable you want isn't in the **Add Variables** list, set its **Visible in Clicker** flag in [KYC](guides-tutorial-variables-kyc.md) first, then click **Refresh Variables**.
- **New sets are empty on purpose.** Either **Seed Defaults** or clone from an existing set — otherwise the partner's editor falls back to Default with a warning banner.
- **Delete All is per-set, not global.** It only clears the selected set. That is deliberate, but double-check which set is selected before confirming.
- **Report Content is a control, not a counter.** It has no variables; it exists to switch on the report-content block for Builder mode.
- **Reordering is by number.** To move a group, change its Group Order; to move a counter within a group, use the ↑/↓ controls in the group form.
- **Assign before you expect results.** Building a set does nothing until a partner points at it.

## How it connects
- **The dictionary:** groups reference variables defined in [Variables (KYC)](guides-tutorial-variables-kyc.md).
- **The entry screen:** the assigned set drives what operators see in [Collecting data](guides-tutorial-collecting-data.md).
- **The assignment:** sets are attached to partners — see [Partners](guides-tutorial-partners.md).
- **Attached charts:** the optional group chart comes from [Charts & formulas](guides-tutorial-charts-formulas.md).
- **Admin reference:** deeper notes live in [../admin/admin-clicker-manager.md](../admin/admin-clicker-manager.md).

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Variables (KYC)](guides-tutorial-variables-kyc.md)
- [Collecting event data](guides-tutorial-collecting-data.md)
- [Partners](guides-tutorial-partners.md)
- [Charts & formulas](guides-tutorial-charts-formulas.md)
- [Reports](guides-tutorial-reports.md)
