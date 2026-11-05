# Privacy: Messmass Photo Erasure Runbook & Architecture

Reference: [Issue #505](https://github.com/moldovancsaba/messmass/issues/505)  
Milestone: GDPR Right to Erasure - Production Delivery  
Standard: Sovereign Squad General Design System (GDS#81)

---

## 1. Executive Summary

Messmass accepts authenticated, idempotent erasure requests for exact `(event, photo)` pairs. When an erasure is requested:
1. A durable tombstone is recorded before scrubbing.
2. All canonical photo-level analytics, boxes, summaries, and review items are removed (`$unset`).
3. Affected event and report aggregates are mechanically recomputed from the remaining canonical photo rows.
4. Active Next.js ISR caches for reports and layouts are invalidated.
5. Delayed or retried Fanmass ingestion attempts are rejected and cannot resurrect erased photo data.
6. SSO/Camera callers receive an opaque, verifiable deletion receipt.

---

## 2. Architecture & Service Boundaries

```
[ SSO / Case Coordinator ]
           │
           │ DELETE /api/integrations/privacy/erase-camera-photo
           │ (X-SSO-Privacy-Secret: MESSMASS_PRIVACY_ERASURE_SECRET)
           ▼
[ Messmass Privacy Route ]
           │
           ├─► 1. Resolve Messmass Event from exact Camera Partner & Event link
           ├─► 2. Upsert durable tombstone in fanmass_camera_photo_analyses
           │      (status: 'deleted', tombstone: true, privacyErasure: { requestId, receivedAt })
           │      (Unset: summary, boxes, analysis, humanReview, sourceRevision, analysisGeneration)
           ├─► 3. Rebuild Event Summary (ai_analysis_summaries & project.stats)
           ├─► 4. Invalidate ISR caches (revalidatePath: /report, /partner-report, /report/[slug])
           └─► 5. Return receipt: { status: 'deleted', received_at: ISO8601 }
```

In parallel, Fanmass's automated privacy worker delivers photo deletions to:
`DELETE /api/integrations/fanmass/events/{eventId}/photos/{photoId}` (authenticated via `requireFanmassIntegrationAuth`).

---

## 3. Data Model & Collections

### 3.1 Canonical Photo Analysis Collection: `fanmass_camera_photo_analyses`
- **Key (`_id`)**: Deterministic SHA-256 digest of `${eventId}\n${cameraPhotoId}`.
- **Indexes**:
  - `{ eventId: 1, cameraPhotoId: 1 }` (unique)
  - `{ eventId: 1, tombstone: 1, status: 1 }` (report query index)
- **Tombstone Schema**:
  ```json
  {
    "_id": "d04a6...",
    "eventId": "65b...",
    "cameraPartnerId": "camera-partner-1",
    "cameraEventId": "camera-event-1",
    "cameraPhotoId": "65b...",
    "contractVersion": "fanmass.messmass.photo-analysis.v2",
    "status": "deleted",
    "tombstone": true,
    "privacyErasure": {
      "requestId": "f51e6124-13a3-46ec-b3f8-c9bac50f6bd5",
      "receivedAt": "2026-11-05T08:00:00.000Z"
    },
    "receivedAt": "2026-11-05T08:00:00.000Z"
  }
  ```
- **Scrubbed Fields (`$unset`)**:
  `analyzedAt`, `analysisStage`, `analysisModules`, `analysisModuleStatuses`, `summary`, `boxes`, `analysis`, `humanReview`, `sourceRevision`, `analysisGeneration`.

### 3.2 Denormalized Projections: `ai_analysis_summaries` & `projects.stats`
- Rebuilt exclusively by scanning non-tombstoned canonical photos:
  `db.collection('fanmass_camera_photo_analyses').find({ eventId, tombstone: { $ne: true }, status: 'completed' })`
- If no canonical photos remain, event totals drop to zero.

---

## 4. Anti-Resurrection & Delayed-Write Rejection

When a photo analysis push (`POST /api/integrations/fanmass/events/{eventId}/photos/{photoId}`) arrives after an erasure tombstone:
1. The update filter enforces `tombstone: { $ne: true }`.
2. Because the document exists with `tombstone: true`, the update does not match. An upsert collision triggers MongoDB duplicate key error 11000.
3. The server inspects the existing document: `isPhotoAnalysisWriteStale` evaluates `existing.tombstone === true` and flags the write as permanently stale.
4. The handler short-circuits with `{ status: 'ignored_stale' }` without updating MongoDB or recalculating aggregates.
5. The erased findings and boxes remain completely absent and unrecoverable.

---

## 5. Cache & Export Invalidation

- **ISR Route Caches**:
  Upon summary rebuild, `revalidatePath` purges:
  - `/report` (layout)
  - `/partner-report` (layout)
  - `/report/{slug}` (specific event page)
- **Export Artifacts**:
  Messmass generates reports dynamically on-the-fly:
  - PDF Export (`/api/export/pdf`): Driven by headless Chromium querying the live `#report-content` DOM; no cached PDFs reside on disk or S3.
  - CSV Export: Built dynamically in the client via `useReportExport` from live `charts` state.
  - V3 Metrics Export (`/api/v3/reporting/export/[entityId]`): Built directly from database metrics on request.
  Because no stale static export files exist on disk, invalidating the projection immediately reflects across all exports.

---

## 6. Backup Disposition & Restore Replay

- **Backup Window**: MongoDB Atlas automated continuous/snapshot backups retain encrypted database copies according to organizational retention (standard 30-day window).
- **Restore Replay Runbook**:
  - In accordance with GDPR and the Fleet Restore Replay Runbook (`camera/docs/privacy/RESTORE_REPLAY_RUNBOOK.md`), restoring a Messmass or Atlas snapshot does NOT automatically re-expose erased photos.
  - Before restoring traffic to any restored database, operators replay the durable privacy tombstones from SSO's case ledger or the Camera replay feed (`scripts/privacy-restore-replay.ts`).
  - Restoring an Atlas backup without replaying tombstones is strictly prohibited.
  - Backups naturally roll off and expire at 30 days.

---

## 7. Verification & Operational Repair

### 7.1 Inspect Photo Tombstone (Atlas / mongosh)
```javascript
db.fanmass_camera_photo_analyses.findOne(
  { eventId: "<messmassEventId>", cameraPhotoId: "<cameraPhotoId>" },
  { status: 1, tombstone: 1, privacyErasure: 1, summary: 1, boxes: 1, analysis: 1 }
);
```
Expected output:
```json
{
  "status": "deleted",
  "tombstone": true,
  "privacyErasure": {
    "requestId": "f51e6124-13a3-46ec-b3f8-c9bac50f6bd5",
    "receivedAt": "2026-11-05T08:00:00.000Z"
  }
}
```
(`summary`, `boxes`, `analysis` must not be present).

### 7.2 Manual Projection Rebuild (if needed)
```javascript
// From messmass CLI or script:
const { rebuildFanmassPhotoEventSummary } = require('./lib/fanmassPhotoAnalyses');
await rebuildFanmassPhotoEventSummary('<messmassEventId>');
```

---

## 8. Rollback Plan

- If a regression occurs in intake/dispatch, disable ingress via feature flag or maintenance mode.
- **NEVER** delete tombstones (`tombstone: true`) or re-insert scrubbed data as a rollback action.
- Durable tombstones and privacy receipts must be preserved under all circumstances.
