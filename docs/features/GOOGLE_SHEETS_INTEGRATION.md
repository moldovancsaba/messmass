# Google Sheets Integration - Feature Guide (v12.0.0)

**Status**: Phase 1 Foundation Complete ✅  
**Next**: Phase 2 Implementation (Partner-Level Sync)  
**Target**: v12.1.0 - Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [User Journey](#user-journey)
3. [Architecture](#architecture)
4. [Setup Guide](#setup-guide)
5. [Sheet Structure](#sheet-structure)
6. [Sync Workflow](#sync-workflow)
7. [Event Type Detection](#event-type-detection)
8. [Conflict Resolution](#conflict-resolution)
9. [API Reference](#api-reference)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [Roadmap](#roadmap)

---

## Overview

**WHAT**: Bidirectional sync between Google Sheets and MessMass events  
**WHY**: Enable partners to manage events in spreadsheets (familiar tool, bulk editing, formulas)  
**HOW**: Service account authentication + partner-level sheet connections + UUID-based row matching

### Key Features (Phase 1-6)

- ✅ **Partner-Level Sheets**: One sheet per partner, multiple event rows
- ✅ **Manual Sync Buttons**: "Pull Data" and "Push Data" on partner and event pages
- ✅ **Automated Daily Sync**: 3:00 AM UTC cron job for all enabled partners
- ✅ **UUID Tracking**: Column A stores MessMass UUID for row matching
- ✅ **Event Type Detection**: Auto-generate event names based on partner columns
- ✅ **Conflict Detection**: Compare timestamps, show confirmation modal
- ✅ **Hardcoded Mapping**: 42 columns (A-AP) map to MessMass fields
- ✅ **Backward Compatible**: Existing events and partners unchanged

### Future Roadmap

- 🔮 **Column Mapping Editor** (Q1 2026): Visual UI for custom mappings
- 🔮 **Advanced Sync Options** (Q2 2026): Field-level sync, filters, webhooks
- 🔮 **Multi-Sheet Support** (Q2 2026): Multiple sheets per partner
- 🔮 **Audit Log** (Q3 2026): Track all syncs with rollback capability

---

## User Journey

### Step 1: Setup Google Sheet Connection (Superadmin)

1. Go to `/admin/partners/[id]` (Partner Detail page)
2. Click "⚙️ Google Sheets Settings" button
3. Fill connection form:
   - **Sheet ID**: Copy from Google Sheet URL
   - **Sheet Tab Name**: Default "Events" (or custom)
   - **Sync Mode**: Manual or Auto (daily at 3 AM)
4. Share Google Sheet with service account email (Editor access)
5. Click "Connect Sheet"
6. Status shows: ✅ Connected with last sync timestamp

### Step 2: Download Template (Optional)

1. Click "📥 Download Template" button
2. Import CSV into your Google Sheet
3. Header row shows all 42 columns with labels
4. Sample data demonstrates 3 event types

### Step 3: Add Events to Sheet

**Option A**: Two-Partner Event (e.g., "FC Barcelona vs Real Madrid")
- Fill Partner 1 (column B): "FC Barcelona"
- Fill Partner 2 (column C): "Real Madrid"
- Fill Event Date (column F): "2025-01-15"
- Leave column A empty (MessMass will generate UUID)

**Option B**: Single Partner Event (e.g., "FC Barcelona - Fan Fest 2025")
- Fill Partner 1 (column B): "FC Barcelona"
- Fill Event Title (column D): "Fan Fest 2025"
- Fill Event Date (column F): "2025-02-10"

**Option C**: Standalone Event (e.g., "Summer Festival")
- Fill Event Title (column D): "Summer Festival"
- Fill Event Date (column F): "2025-06-20"

### Step 4: Pull Data (Sheet → MessMass)

**Partner-Level Pull**:
1. Go to `/admin/partners/[id]`
2. Click "⬇️ Pull All Events" button
3. System reads all sheet rows, creates/updates events
4. UUID written to column A for each event
5. Success message: "✅ Pulled 12 events (5 created, 7 updated)"

**Event-Level Pull**:
1. Go to `/edit/[slug]` (Event Editor)
2. If event is synced, "⬇️ Pull from Sheet" button visible
3. Click button to pull latest data for this event only
4. Conflict modal shows if data modified in both places

### Step 5: Push Data (MessMass → Sheet)

**Partner-Level Push**:
1. Go to `/admin/partners/[id]`
2. Click "⬆️ Push All Events" button
3. System writes all partner events to sheet
4. Rows updated with latest MessMass data
5. Formulas preserved (e.g., `=J2+K2+L2` for All Images)

**Event-Level Push**:
1. Go to `/edit/[slug]` (Event Editor)
2. Click "⬆️ Push to Sheet" button
3. Individual row updated in sheet
4. Confirmation modal if data modified in sheet

### Step 6: Automated Sync (Daily)

- **Schedule**: 3:00 AM UTC every day
- **Scope**: All partners with `googleSheetConfig.enabled: true` and `syncMode: 'auto'`
- **Action**: Pull all events from sheets (Sheet → MessMass)
- **Logging**: Sync status and errors logged to `aggregation_logs` collection
- **Notifications**: Superadmins notified of failures

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│           MessMass Frontend (Next.js)           │
│  - Partner Admin UI                             │
│  - Event Editor with Sync Buttons               │
│  - Conflict Resolution Modals                   │
└──────────────────┬──────────────────────────────┘
                   │
                   │ API Requests
                   ▼
┌─────────────────────────────────────────────────┐
│         MessMass Backend (Next.js API)          │
│  - Partner Sync API (/api/partners/[id]/...)   │
│  - Project Sync API (/api/projects/[id]/...)   │
│  - Cron Job (/api/cron/google-sheets-sync)     │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Service Account Auth
                   ▼
┌─────────────────────────────────────────────────┐
│         Google Sheets API (googleapis)          │
│  - Authentication (JWT)                         │
│  - Read/Write Operations                        │
│  - Batch Updates                                │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Sheet Access
                   ▼
┌─────────────────────────────────────────────────┐
│            Google Sheet (Events Tab)            │
│  - Header Row (Row 1)                           │
│  - Event Rows (Row 2+)                          │
│  - 42 Columns (A-AP)                            │
│  - Formulas (All Images, Total Fans)            │
└─────────────────────────────────────────────────┘
```

### Data Flow (Pull Operation)

1. **User triggers pull** (button click or cron job)
2. **API endpoint** validates partner and sheet connection
3. **Read sheet rows** using `readSheetRows(sheetId, sheetName, 2)`
4. **Parse each row** into structured data using column map
5. **Detect event type** based on Partner 1/2/Title columns
6. **Find or create event** by UUID (column A)
7. **Update event stats** from sheet columns
8. **Write UUID back** to sheet if new event
9. **Update sync metadata** (timestamps, status, counters)
10. **Return result** with created/updated counts

### Data Flow (Push Operation)

1. **User triggers push** (button click)
2. **API endpoint** fetches MessMass events for partner
3. **Convert events to rows** using column map
4. **Find existing rows** by UUID (column A)
5. **Write or update rows** in sheet
6. **Preserve formulas** for computed columns (All Images, Total Fans)
7. **Update sync metadata** in MessMass and sheet
8. **Return result** with push status

---

## Setup Guide

### Prerequisites

1. **Google Cloud Project** with Google Sheets API enabled
2. **Service Account** with JSON key file
3. **Service Account Email** (e.g., `messmass-sync@project-id.iam.gserviceaccount.com`)
4. **Private Key** from service account JSON

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: IAM & Admin → Service Accounts
3. Click "Create Service Account"
4. Name: `messmass-sync`
5. Grant roles: None needed (sheet-level permissions)
6. Click "Create Key" → JSON format
7. Download JSON file (keep secure!)

### Step 2: Set Environment Variables

Add to `.env.local`:

```bash
# Google Sheets Integration (v12.0.0)
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=messmass-sync@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

**Note**: Private key must preserve newlines (`\n`)

### Step 3: Share Sheet with Service Account

1. Open Google Sheet to sync
2. Click "Share" button (top-right)
3. Paste service account email
4. Set access: **Editor** (not Viewer!)
5. Uncheck "Notify people"
6. Click "Done"

### Step 4: Test Connection

Run test script:

```bash
# Set test sheet ID in .env.local
TEST_SHEET_ID=1abc...xyz

# Run tests
npm run test:google-sheets
```

Expected output:
```
🚀 Google Sheets API Integration Tests
🔐 Testing authentication...
✅ Authentication successful - client created
📄 Testing sheet connection...
✅ Connected to sheet: "My Events"
📊 Testing metadata retrieval...
✅ Sheet title: My Events
   Total tabs: 1
   Tab names: Events
📖 Testing read operations...
✅ Read 5 rows from sheet
✍️ Testing write operations...
✅ Test data written to row 100
🔍 Testing UUID search...
✅ Found test UUID at row 100
✅ All tests completed successfully!
```

---

## Sheet Structure

### Column Mapping (42 Columns A-AP)

| Column | Field Path | Type | Description | Read-Only |
|--------|------------|------|-------------|-----------|
| **A** | `googleSheetUuid` | UUID | MessMass UUID | ✅ |
| **B** | `partner1Name` | String | Partner 1 (Home) | ❌ |
| **C** | `partner2Name` | String | Partner 2 (Away) | ❌ |
| **D** | `eventTitle` | String | Event Title (Custom) | ❌ |
| **E** | `eventName` | String | Event Name (Auto) | ✅ |
| **F** | `eventDate` | Date | Event Date (YYYY-MM-DD) | ❌ |
| **G** | `stats.eventAttendees` | Number | Event Attendees | ❌ |
| **H** | `stats.eventResultHome` | Number | Event Result Home | ❌ |
| **I** | `stats.eventResultVisitor` | Number | Event Result Visitor | ❌ |
| **J** | `stats.remoteImages` | Number | Remote Images | ❌ |
| **K** | `stats.hostessImages` | Number | Hostess Images | ❌ |
| **L** | `stats.selfies` | Number | Selfies | ❌ |
| **M** | `stats.allImages` | Number | All Images | ✅ (Computed) |
| **N** | `stats.remoteFans` | Number | Remote Fans | ❌ |
| **O** | `stats.stadium` | Number | Stadium Fans | ❌ |
| **P** | `stats.totalFans` | Number | Total Fans | ✅ (Computed) |
| **Q** | `stats.female` | Number | Female | ❌ |
| **R** | `stats.male` | Number | Male | ❌ |
| **S** | `stats.genAlpha` | Number | Gen Alpha | ❌ |
| **T** | `stats.genYZ` | Number | Gen YZ | ❌ |
| **U** | `stats.genX` | Number | Gen X | ❌ |
| **V** | `stats.boomer` | Number | Boomer | ❌ |
| **W** | `stats.merched` | Number | Merched | ❌ |
| **X** | `stats.jersey` | Number | Jersey | ❌ |
| **Y** | `stats.scarf` | Number | Scarf | ❌ |
| **Z** | `stats.flags` | Number | Flags | ❌ |
| **AA** | `stats.baseballCap` | Number | Baseball Cap | ❌ |
| **AB** | `stats.other` | Number | Other Merch | ❌ |
| **AC** | `stats.visitQrCode` | Number | Visit QR Code | ❌ |
| **AD** | `stats.visitShortUrl` | Number | Visit Short URL | ❌ |
| **AE** | `stats.visitWeb` | Number | Visit Web | ❌ |
| **AF** | `stats.visitFacebook` | Number | Visit Facebook | ❌ |
| **AG** | `stats.visitInstagram` | Number | Visit Instagram | ❌ |
| **AH** | `stats.visitYoutube` | Number | Visit YouTube | ❌ |
| **AI** | `stats.visitTiktok` | Number | Visit TikTok | ❌ |
| **AJ** | `stats.visitX` | Number | Visit X | ❌ |
| **AK** | `stats.visitTrustpilot` | Number | Visit Trustpilot | ❌ |
| **AL** | `stats.totalBitlyClicks` | Number | Total Bitly Clicks | ❌ |
| **AM** | `stats.uniqueBitlyClicks` | Number | Unique Bitly Clicks | ❌ |
| **AN** | `lastModified` | Timestamp | Last Modified (ISO 8601) | ❌ |
| **AO** | `syncStatus` | Status | Sync Status (Auto) | ✅ |
| **AP** | `notes` | Text | Notes (Optional) | ❌ |

### Read-Only Columns

**Column A (UUID)**: Auto-filled by MessMass on first sync  
**Column E (Event Name)**: Auto-generated based on Partner 1/2/Title  
**Column M (All Images)**: Formula `=J2+K2+L2`  
**Column P (Total Fans)**: Formula `=N2+O2`  
**Column AO (Sync Status)**: Auto-updated ("Synced", "Modified", "Conflict")

**Why read-only?** Prevents conflicts and ensures data integrity

---

## Sync Workflow

### Pull Data (Sheet → MessMass)

**Trigger**: Manual button or daily cron  
**Scope**: Partner-level (all events) or event-level (single event)

**Algorithm**:
1. Read all rows from sheet (starting row 2)
2. For each row:
   a. Parse columns into event data
   b. Detect event type (partner1+partner2, partner1+title, or title only)
   c. Find existing event by UUID (column A)
   d. If not found, create new event with generated UUID
   e. Update event stats from sheet columns
   f. Write UUID back to column A if new
   g. Update sync metadata (timestamps, status)
3. Return summary: {created: 5, updated: 7, errors: []}

**Conflict Handling**:
- Compare `googleSheetModifiedAt` (MessMass) vs `lastModified` (Sheet column AN)
- If MessMass newer: Show confirmation modal "Sheet data is older. Overwrite?"
- If Sheet newer: Pull without confirmation
- If timestamps equal: Pull without confirmation

### Push Data (MessMass → Sheet)

**Trigger**: Manual button only (no automatic push)  
**Scope**: Partner-level (all events) or event-level (single event)

**Algorithm**:
1. Fetch all partner events from MessMass
2. For each event:
   a. Convert event data to row array (42 cells)
   b. Find existing row by UUID (column A)
   c. If found, update row in place
   d. If not found, append new row
   e. Preserve formulas for computed columns (M, P)
   f. Update sync metadata
3. Return summary: {updated: 10, created: 2, errors: []}

**Conflict Handling**:
- Compare `lastModified` (Sheet column AN) vs `googleSheetModifiedAt` (MessMass)
- If Sheet newer: Show confirmation modal "Sheet data is newer. Overwrite?"
- If MessMass newer: Push without confirmation
- If timestamps equal: Push without confirmation

---

## Event Type Detection

**Rule-Based Logic**:

```typescript
function detectEventType(row: unknown[]): EventType {
  const partner1 = row[1]; // Column B
  const partner2 = row[2]; // Column C
  const eventTitle = row[3]; // Column D
  
  if (partner1 && partner2) {
    // Two-partner event (e.g., "FC Barcelona vs Real Madrid")
    return {
      type: 'two-partner',
      eventName: `${partner1} vs ${partner2}`,
      partner1,
      partner2
    };
  } else if (partner1 && eventTitle) {
    // Single partner event (e.g., "FC Barcelona - Fan Fest 2025")
    return {
      type: 'single-partner',
      eventName: eventTitle,
      partner1
    };
  } else if (eventTitle) {
    // Standalone event (e.g., "Summer Festival")
    return {
      type: 'standalone',
      eventName: eventTitle
    };
  } else {
    throw new Error('Invalid row: At least one of Partner1, Partner2, or Event Title is required');
  }
}
```

**Examples**:

| Partner 1 | Partner 2 | Event Title | Event Name (Auto) | Type |
|-----------|-----------|-------------|-------------------|------|
| FC Barcelona | Real Madrid | (empty) | "FC Barcelona vs Real Madrid" | Two-Partner |
| FC Barcelona | (empty) | Fan Fest 2025 | "Fan Fest 2025" | Single Partner |
| (empty) | (empty) | Summer Festival | "Summer Festival" | Standalone |
| (empty) | Real Madrid | (empty) | **ERROR** | Invalid |

---

## Conflict Resolution

### Timestamp Comparison

**Fields**:
- **MessMass**: `googleSheetModifiedAt` (ISO 8601)
- **Sheet**: Column AN "Last Modified" (ISO 8601)

**Logic**:
```typescript
function hasConflict(messmassMod: string, sheetMod: string, direction: 'pull' | 'push'): boolean {
  const messDate = new Date(messmassMod);
  const sheetDate = new Date(sheetMod);
  
  if (direction === 'pull') {
    // Conflict if MessMass is newer (pulling would overwrite)
    return messDate > sheetDate;
  } else {
    // Conflict if Sheet is newer (pushing would overwrite)
    return sheetDate > messDate;
  }
}
```

### Confirmation Modal

**Title**: "⚠️ Data Conflict Detected"

**Message**:
```
MessMass last modified: 2025-01-15 14:30:00 UTC
Sheet last modified: 2025-01-15 10:00:00 UTC

MessMass data is newer. Pulling from sheet will overwrite your changes.

Do you want to continue?
```

**Actions**:
- **Cancel**: Abort sync operation
- **Continue**: Proceed with sync (overwrite)

---

## API Reference

### Partner-Level Sync

**Connect Sheet**
```http
POST /api/partners/[id]/google-sheet/connect
Content-Type: application/json

{
  "sheetId": "1abc...xyz",
  "sheetName": "Events",
  "syncMode": "manual"
}
```

**Disconnect Sheet**
```http
DELETE /api/partners/[id]/google-sheet/disconnect
```

**Pull All Events**
```http
POST /api/partners/[id]/google-sheet/pull
```

**Push All Events**
```http
POST /api/partners/[id]/google-sheet/push
```

**Get Sync Status**
```http
GET /api/partners/[id]/google-sheet/status
```

### Event-Level Sync

**Pull Single Event**
```http
POST /api/projects/[id]/google-sheet/pull
```

**Push Single Event**
```http
POST /api/projects/[id]/google-sheet/push
```

### Cron Job

**Daily Sync (3 AM UTC)**
```http
POST /api/cron/google-sheets-sync
Authorization: Bearer <CRON_SECRET>
```

**Vercel cron.json**:
```json
{
  "crons": [{
    "path": "/api/cron/google-sheets-sync",
    "schedule": "0 3 * * *"
  }]
}
```

---

## Testing

### Manual Testing

**Checklist**:
- [ ] Connect sheet (valid Sheet ID)
- [ ] Disconnect sheet
- [ ] Pull events (empty sheet)
- [ ] Pull events (with data)
- [ ] Push events (new events)
- [ ] Push events (existing rows)
- [ ] Conflict modal (MessMass newer)
- [ ] Conflict modal (Sheet newer)
- [ ] Event-level pull
- [ ] Event-level push
- [ ] Daily cron job

### Automated Testing

Run test script:
```bash
npm run test:google-sheets
```

### Load Testing

**Scenario**: 100+ events in sheet  
**Target**: Pull completes in <30 seconds

---

## Troubleshooting

### Authentication Failed

**Error**: "Missing Google Sheets credentials"

**Solution**:
1. Verify `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL` set
2. Verify `GOOGLE_SHEETS_PRIVATE_KEY` set
3. Check private key format (must preserve `\n` newlines)

### Permission Denied

**Error**: "The caller does not have permission"

**Solution**:
1. Share sheet with service account email
2. Set access level to "Editor" (not Viewer)
3. Verify sheet ID is correct

### UUID Not Found

**Error**: "Event UUID not found in sheet"

**Solution**:
1. Ensure column A contains MessMass UUIDs
2. Check if row was deleted in sheet
3. Pull events again to regenerate UUIDs

### Duplicate UUIDs

**Error**: "Duplicate UUID detected in sheet"

**Solution**:
1. Find duplicate rows (column A)
2. Delete or modify duplicate UUIDs
3. Pull events again

### Formula Broken

**Error**: "All Images formula missing"

**Solution**:
1. Manually restore formula in column M: `=J2+K2+L2`
2. Manually restore formula in column P: `=N2+O2`
3. Push events to overwrite with correct formulas

---

## Roadmap

### Phase 1: Foundation ✅ (v12.0.0)
- [x] TypeScript types
- [x] Column mapping
- [x] API client wrapper
- [x] Sample CSV template
- [x] MongoDB schema updates
- [x] Test script
- [x] Documentation

### Phase 2: Partner-Level Sync (v12.1.0)
- [ ] Connect/disconnect API endpoints
- [ ] Pull all events API
- [ ] Push all events API
- [ ] Admin UI (Partner Detail page)
- [ ] Testing and debugging

### Phase 3: Event-Level Sync (v12.2.0)
- [ ] Pull single event API
- [ ] Push single event API
- [ ] Event Editor UI (sync buttons)
- [ ] Testing and debugging

### Phase 4: Conflict Detection (v12.3.0)
- [ ] Timestamp comparison logic
- [ ] Confirmation modal component
- [ ] Conflict resolution workflow
- [ ] Testing and debugging

### Phase 5: Automated Daily Sync (v12.4.0)
- [ ] Cron job API endpoint
- [ ] Vercel cron configuration
- [ ] Logging and error notifications
- [ ] Testing and monitoring

### Phase 6: Polish & Production (v12.5.0)
- [ ] Error handling edge cases
- [ ] Download template button
- [ ] User documentation
- [ ] Production deployment

### Phase 7: Column Mapping Editor (Q1 2026)
- [ ] Visual mapping UI
- [ ] Custom column definitions
- [ ] Validation and testing

### Phase 8: Advanced Sync (Q2 2026)
- [ ] Field-level sync
- [ ] Hashtag sync
- [ ] Custom variables sync
- [ ] Webhook triggers

---

**Version**: 12.0.0 (Phase 1 Complete)  
**Last Updated**: 2025-12-26T17:45:00.000Z  
**Status**: Foundation Complete - Ready for Phase 2 🚀
