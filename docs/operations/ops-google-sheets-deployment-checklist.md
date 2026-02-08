# Google Sheets Partner Sync – Deployment & E2E Validation Checklist
Status: Active  
Last Updated: 2026-02-08  
Canonical: Yes  
Owner: Operations / Integrations

**Purpose:** Staging and production validation for OPS-INT-01 (Google Sheets Partner Sync Phase 2 hardening).  
**Reference:** [GOOGLE_SHEETS_INTEGRATION.md](../features/features-google-sheets-integration.md) (canonical feature guide).

---

## Pre-requisites

- [ ] `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL` set in environment
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` set (PEM with `\n` newlines preserved)
- [ ] At least one test Google Sheet created and shared with service account email (Editor access)
- [ ] `TEST_SHEET_ID` in `.env.local` for automated script (optional but recommended)

---

## Automated validation

Run before staging/production signoff:

```bash
npm run test:google-sheets
```

- [ ] Script completes without errors
- [ ] Authentication successful
- [ ] Sheet connection successful (if `TEST_SHEET_ID` set)
- [ ] Read/write and UUID search pass (if sheet is writable)

---

## Schema / Backward-Compatibility Checks

- [ ] Partner creation works without `googleSheetConfig`
- [ ] Partner update adds `googleSheetConfig` successfully
- [ ] Project creation works without Google Sheet fields
- [ ] Synced project includes all required fields
- [ ] UUID uniqueness enforced (duplicate detection behavior confirmed)
- [ ] Existing projects load correctly (no breaking changes)
- [ ] API endpoints return both old and new projects
- [ ] Queries with `googleSheetUuid` work (consider sparse index if needed)

**Optional script (OPS-INT-01):** Run schema check to verify DB state and counts:

```bash
npm run check:google-sheets-schema
```

**UUID / duplicate behavior:** Column A in the sheet stores the MessMass event UUID. Pull uses UUID to match rows to events (update vs create). Duplicate UUIDs in the sheet: last row wins when matching; avoid duplicates. Uniqueness is not enforced in the sheet; application logic matches by UUID.

Reference (archived schema note): `docs/archive/_archive/migrations/GOOGLE_SHEETS_SCHEMA_UPDATE.md`.

---

## Staging checklist (E2E manual)

Execute on staging environment with a real partner and test sheet.

### Partner-level (Admin)

| Step | Action | Expected |
|------|--------|----------|
| 0 | (Phase 2.5) Click "🆕 Create & Connect New Google Sheet" | Sheet is created, headers written, partner connected; URL is stored on partner |
| 1 | Go to `/admin/partners/[id]` | Partner detail loads |
| 2 | Click "⚙️ Google Sheets Settings" | Connect modal opens |
| 3 | Enter Sheet ID, tab name (e.g. "Events"), sync mode | Form accepts input |
| 4 | Click "Connect Sheet" | Success; status shows Connected + last sync |
| 5 | Click "⬇️ Pull All Events" | Pull runs; message shows created/updated counts |
| 6 | Click "⬆️ Push All Events" | Push runs; sheet rows updated |
| 7 | Click "Disconnect" (or disconnect in modal) | Sheet disconnected; status updates |
| 8 | Re-connect and verify status card refreshes | No stale state after connect/disconnect/pull/push |

### Event-level (Event Editor)

| Step | Action | Expected |
|------|--------|----------|
| 9 | Go to `/edit/[slug]` for an event linked to the partner sheet | Sync buttons visible if event has sheet link |
| 10 | "⬇️ Pull from Sheet" | Single-event pull; conflict modal if applicable |
| 11 | "⬆️ Push to Sheet" | Single-event push; confirmation if sheet newer |

### Edge cases

| Step | Action | Expected |
|------|--------|----------|
| 12 | Pull with empty sheet | No errors; 0 created, 0 updated |
| 13 | Pull with new rows (no UUID in col A) | Events created; UUIDs written to sheet |
| 14 | Conflict: MessMass newer, then Pull | Conflict modal; continue overwrites sheet data |
| 15 | Conflict: Sheet newer, then Push | Conflict modal; continue overwrites MessMass data |

### Cron (if configured on staging)

| Step | Action | Expected |
|------|--------|----------|
| 16 | Trigger `/api/cron/google-sheets-sync` (with cron secret) | 200; partners with auto sync run; errors logged |

---

## Production checklist

- [ ] All staging checklist items passed
- [ ] Production env vars set (service account, private key)
- [ ] Partners using sheets have shared their sheets with production service account email
- [ ] Cron (e.g. Vercel cron `0 3 * * *`) configured and verified once
- [ ] Signoff: _________________ Date: __________

---

## Rollback

If critical issues appear after deployment:

1. Disable auto sync for affected partners (set `syncMode: 'manual'` or disconnect sheet).
2. Fix or revert code; redeploy.
3. Re-run automated script and key manual steps before re-enabling.

---

## References

- Feature guide: [GOOGLE_SHEETS_INTEGRATION.md](../features/features-google-sheets-integration.md)
- API routes: `/api/partners/[id]/google-sheet/*`, `/api/cron/google-sheets-sync`
- Test script: `scripts/test-google-sheets.ts`
