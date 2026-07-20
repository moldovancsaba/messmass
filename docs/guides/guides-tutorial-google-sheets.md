# Tutorial: Google Sheets sync
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators and technical implementers · Prerequisites: Admin sign-in, a Google service account, a partner to connect · Related: [Partners](guides-tutorial-partners.md), [Events](guides-tutorial-events.md), [Bitly integration](guides-tutorial-bitly.md)

## What it is & why it matters

Google Sheets sync gives spreadsheet-oriented partners a familiar way to manage their events. A partner's events are kept in step **bidirectionally** between a Google Sheet and messmass: they can bulk-edit rows in the sheet, and you can push the latest messmass numbers back into it. The connection is **per partner** — one sheet holds one partner's events, one row per event.

Why it matters: not every partner wants to work inside the admin console. A club's marketing team may live in spreadsheets. This integration lets them add and edit events in a sheet they already understand, while messmass stays the source of truth for computed statistics.

The mechanism is simple and robust:

- Row matching is anchored on **column A**, which holds the messmass event **UUID**. messmass fills it in the first time a row syncs, and uses it forever after to find the same event again.
- A fixed **42-column layout (A–AP)** maps each cell to a messmass field. A few columns are computed and read-only (event name, All Images, Total Fans, sync status).
- Authentication is via a Google **service account**, not a personal Google login, so sync runs unattended.

## Before you start

1. **Sign in as an admin.** All `/api/partners/[id]/google-sheet/*` routes are admin-only.
2. **Create a Google service account and enable the Google Sheets API.** Follow the step-by-step in [../setup/setup-google-service-account-setup.md](../setup/setup-google-service-account-setup.md). You end up with a service-account email and a private key.
3. **Provide the credentials** in one of two ways (never paste the private key into the app or into docs):
   - Environment variables `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY` (the private key may be raw with preserved `\n` newlines, or base64-encoded), **or**
   - A `.google-service-account.json` key file at the project root. If that file exists it is used first; otherwise the integration falls back to the environment variables.
4. **Share the target sheet with the service-account email as Editor.** Viewer access is not enough — sync writes back UUIDs and pushed data. Uncheck "Notify people" when sharing.
5. **Have the partner created** whose events you want to sync. See [Partners](guides-tutorial-partners.md).

Rotate the service-account key periodically and only share the specific sheets that need syncing — a service account you have over-shared can read every sheet it was added to.

> Note: If credentials are missing, the client raises a clear "Missing Google Sheets credentials" error telling you to either create `.google-service-account.json` or set the two environment variables.

### How authentication works

The integration signs in as the service account, not as a person. On each call it builds a Google JWT client scoped to the Sheets API (and the Drive API when it needs to create or rename a spreadsheet). It prefers the `.google-service-account.json` key file if present, and otherwise reads the email and private key from the environment. This is why the sheet must be **shared with the service-account email**: the service account is the "user" doing the reading and writing, and it can only touch sheets that have been shared with it. No end-user OAuth pop-up is involved, which is what lets the nightly job run unattended.

## Step by step

Everything below is driven from the **partner detail page**.

### 1. Connect a sheet

You have two ways to connect:

- **Auto-provision (recommended for new partners).** Use "Create & Connect New Google Sheet". messmass creates a fresh spreadsheet, writes the header row, populates any events the partner already has, prefixes the partner's UUID into the sheet title so it is traceable, and connects it. The service account already has access, so you just open the returned URL and share it with the partner's editors.
- **Connect an existing sheet.** Open the Google Sheets settings, paste the **Sheet ID** (from the sheet's URL), set the tab name (default "Events") and a sync mode (manual or auto), share the sheet with the service-account email as Editor, and connect. Behind the scenes this is `POST /api/partners/[id]/google-sheet/connect`.

After connecting, a status card shows the connection and the last sync time.

> Note: The default tab name is "Events". If your sheet uses a different tab, set that name when you connect so reads and writes target the right tab.

### 2. Add events in the sheet

Fill a row and leave **column A empty** — messmass generates the UUID on first pull. The event type is detected from which columns you fill:

- **Two-partner event:** Partner 1 (col B) + Partner 2 (col C) → name becomes "Partner 1 vs Partner 2".
- **Single-partner event:** Partner 1 (col B) + Event Title (col D) → name is the title.
- **Standalone event:** Event Title (col D) only.

A row with neither a partner nor a title is invalid.

### 3. Pull (Sheet → messmass)

Pull reads sheet rows and creates or updates the matching messmass events:

- **Manually:** click "Pull All Events" on the partner page (`POST /api/partners/[id]/google-sheet/pull`). New events are created, existing ones (matched by UUID) are updated, and the UUID is written back to column A for any new rows.
- **Event-level:** on an event's editor page (`/edit/[slug]`), when the event is sheet-backed, a "Pull from Sheet" button pulls just that one row.
- **Automatically:** a daily job at **3:00 AM UTC** pulls for every partner whose connection is enabled and set to `auto`.

### 4. Push (messmass → Sheet)

Push writes messmass event data back into the sheet:

- **Manually only** — there is no automatic push. Click "Push All Events" on the partner page (`POST /api/partners/[id]/google-sheet/push`), or "Push to Sheet" on an event editor for a single row.
- Computed **formula cells are preserved**: the data columns are updated while the All Images (`=J+K+L`) and Total Fans (`=N+O`) formulas are left in place.

### 5. Check status or disconnect

- **Status:** `GET /api/partners/[id]/google-sheet/status` returns the connection state; add `?checkHealth=true` for a health check (row count and accessibility).
- **Disconnect:** `DELETE /api/partners/[id]/google-sheet/disconnect` removes the connection and cleans up the sync configuration. The sheet itself is untouched.

### Supporting endpoints

Beyond connect/pull/push/status/disconnect, the partner's Google Sheet routes include a few helpers you will not usually call by hand but which power the UI:

- **provision** — create a brand-new sheet, set it up, and connect it in one step (the "Create & Connect New Google Sheet" button).
- **setup** — configure a blank sheet you created yourself (write headers and formatting) so a pasted URL becomes sync-ready.
- **rename** — prefix the spreadsheet title with the partner UUID so the sheet is traceable back to its partner.

### Worked example: add three events in the sheet

Add three rows, each leaving column A empty:

| Row | Col B (Partner 1) | Col C (Partner 2) | Col D (Event Title) | Col F (Date) | Resulting event |
|-----|-------------------|-------------------|---------------------|--------------|-----------------|
| 2 | FC Barcelona | Real Madrid | *(empty)* | 2026-01-15 | "FC Barcelona vs Real Madrid" (two-partner) |
| 3 | FC Barcelona | *(empty)* | Fan Fest 2026 | 2026-02-10 | "Fan Fest 2026" (single-partner) |
| 4 | *(empty)* | *(empty)* | Summer Festival | 2026-06-20 | "Summer Festival" (standalone) |

Then click **Pull All Events** on the partner page. messmass creates three events, writes a UUID into column A of each row, and reports something like "Pulled 3 events (3 created, 0 updated)". Edit and pull again later and those rows update in place instead of duplicating, because the UUID now matches.

## Managing it

- **The 42-column contract (A–AP).** Column A is the UUID. Columns B–F are identity (partners, title, auto name, date). Columns G onward are statistics — attendance, images, fan counts, demographics, merchandise, visit sources — ending with Bitly totals, a last-modified timestamp, sync status and free-text notes. Read-only/computed columns are: A (UUID), E (event name), M (All Images), P (Total Fans) and AO (sync status). Leave those to messmass.

### Column map by group

| Columns | Group | Examples |
|---------|-------|----------|
| A | Identity key | messmass UUID (read-only) |
| B–F | Event identity | Partner 1, Partner 2, Event Title, Event Name (read-only), Event Date |
| G–I | Result | Attendees, Result Home, Result Visitor |
| J–M | Images | Remote, Hostess, Selfies, All Images (computed, read-only) |
| N–P | Fans | Remote Fans, Stadium, Total Fans (computed, read-only) |
| Q–V | Demographics | Female, Male, Gen Alpha, Gen YZ, Gen X, Boomer |
| W–AB | Merchandise | Merched, Jersey, Scarf, Flags, Baseball Cap, Other |
| AC–AK | Visit sources | QR, Short URL, Web, Facebook, Instagram, YouTube, TikTok, X, Trustpilot |
| AL–AM | Bitly | Total Bitly Clicks, Unique Bitly Clicks |
| AN–AP | Sync metadata | Last Modified, Sync Status (read-only), Notes |
- **Bitly totals show up here.** Columns for **Total Bitly Clicks** and **Unique Bitly Clicks** carry the same numbers you manage in the [Bitly integration](guides-tutorial-bitly.md), so partners see click evidence alongside their events.
- **Conflict handling.** Both directions compare timestamps (the sheet's "Last Modified" column against messmass's stored modified time). If the destination is newer than the source, a confirmation modal warns you before overwriting; otherwise the sync proceeds.
- **Scheduled sync is pull-only.** The nightly job never pushes. If you want messmass numbers reflected in the sheet, push manually.

### The nightly sync in detail

A daily cron runs at 3:00 AM UTC against `POST /api/cron/google-sheets-sync`, authorised by an `Authorization: Bearer <CRON_SECRET>` header (the schedule is defined as `0 3 * * *`). It processes every partner whose Google Sheet connection is enabled and whose sync mode is `auto`, pulling each partner's sheet into messmass. Sync results and errors are logged so failures can be reviewed, and superadmins are notified when a scheduled sync fails. Partners set to manual mode are skipped by the job and only sync when someone clicks a button.

### Manual vs auto sync mode

When you connect a sheet you choose a sync mode, and it changes only how **pull** is triggered:

| Mode | Pull (Sheet → messmass) | Push (messmass → Sheet) |
|------|-------------------------|-------------------------|
| Manual | Only when you click Pull | Only when you click Push |
| Auto | Nightly at 3 AM UTC, plus manual | Only when you click Push (never automatic) |

Choose **auto** for partners who edit their sheet regularly and expect messmass to keep up on its own. Choose **manual** for sheets you touch rarely, or while you are still validating the mapping.

## Gotchas & good practice

- **Never edit column A.** The UUID is how messmass finds the row again. Change it and the row will be treated as a new event (or fail to match), producing duplicates.
- **Do not overwrite computed columns.** Event name, All Images, Total Fans and Sync Status are maintained by messmass. If a formula gets clobbered, restore it (`=J2+K2+L2` for All Images, `=N2+O2` for Total Fans) or push events to rewrite it.
- **Share as Editor, not Viewer.** "The caller does not have permission" almost always means the sheet was shared with the wrong access level or the wrong email.
- **Preserve the private key format.** Keep the `\n` newlines (or base64-encode the whole key). "Invalid JWT signature" is the classic symptom of a mangled key.
- **One sheet per partner.** The current model is one sheet, one partner, many event rows. Do not point two partners at the same sheet.
- **Duplicate UUIDs break pulls.** If you copy rows in the sheet, clear column A on the copies so each event gets its own UUID.
- **Secrets stay in the environment (or the key file), never in the app UI.** The two environment variable names are `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY`. If you use the `.google-service-account.json` file instead, keep it out of version control.

### Quick troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| "Missing Google Sheets credentials" | Neither the key file nor both env vars are set | Add `.google-service-account.json`, or set `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY` |
| "The caller does not have permission" | Sheet not shared, or shared as Viewer | Share the sheet with the service-account email as **Editor** |
| "Invalid JWT signature" | Private key newlines lost | Preserve the `\n` characters (or base64-encode the key) and keep the quotes |
| Duplicate events after a pull | Column A duplicated by copied rows | Clear column A on the copies and pull again |
| An event will not match its row | Column A UUID was edited or deleted | Restore the UUID, or pull to regenerate it for a truly new row |
| All Images / Total Fans blank | Formula overwritten | Restore `=J2+K2+L2` (M) and `=N2+O2` (P), or push to rewrite |

## How it connects

- **Partners** own the connection; the sheet syncs that one partner's events. See [Partners](guides-tutorial-partners.md).
- **Events** are the rows; event type detection turns partner/title columns into named events, and the editor exposes per-event pull/push. See [Events](guides-tutorial-events.md).
- **Bitly** click totals ride along in the sheet's dedicated columns. See [Bitly integration](guides-tutorial-bitly.md).
- The nightly sync is secured with the same scheduled-job pattern (`CRON_SECRET`) described in [Authentication, roles & SSO](guides-tutorial-authentication-sso.md).

For the full column map, conflict rules and API reference, see the feature guide at [../features/features-google-sheets-integration.md](../features/features-google-sheets-integration.md), and the credential walkthrough at [../setup/setup-google-service-account-setup.md](../setup/setup-google-service-account-setup.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Partners](guides-tutorial-partners.md)
- [Events](guides-tutorial-events.md)
- [Bitly integration](guides-tutorial-bitly.md)
- [Sport databases](guides-tutorial-sport-databases.md)
- [Authentication, roles & SSO](guides-tutorial-authentication-sso.md)
