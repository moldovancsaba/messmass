# Fanmass photo-analysis integration
Status: Active
Last Updated: 2026-10-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: operators and implementers · Related: [Camera app](guides-tutorial-camera-app.md), [Events](guides-tutorial-events.md), [Reports](guides-tutorial-reports.md)

## Responsibility boundary

| System | Owns |
| --- | --- |
| Messmass | Partners, events, report-variable definitions, report aggregation and report presentation. A Messmass event is linked to exactly one Camera event. |
| Camera | Photo capture, consent, contact details, retention and human vetting. It stores the Camera partner, event and photo identifiers. Camera does not create Fanmass jobs or call Fanmass. |
| Fanmass | Discovery of eligible Camera Atlas photos, one-photo-at-a-time local analysis, image-relative detection boxes, durable retries, review ingestion and delivery of one result for that photo. Fanmass does not create events, identify users, or create event reports. |

The photo task carries only what analysis needs: the source image, Camera partner/event/photo IDs, the already-linked Messmass event ID, source revision and analysis generation. Fanmass reads the Messmass event ID from Camera's `events.messmassEventId` field; it does not query Messmass for event context before analyzing a Camera photo. Guest names, email addresses, login identifiers, consent text and raw Camera documents are not sent to Fanmass. Publication, consent, retention, deletion and vetting fields are used only to decide eligibility. No-login submissions awaiting erasure are ineligible. The apps are intended to use one Atlas cluster with separate `camera`, `fanmass_camera_pipeline`, and `messmass` databases. The existing AtlasAdmin account is retained by owner decision, so database privileges are not isolated. Production Messmass has not yet been migrated from its current cluster; see the integration delivery plan before calling the cluster alignment complete.

## Runtime flow

1. Camera stores the submission and vetting decision in Atlas. Camera does not enqueue, upload, or notify Fanmass.
2. Fanmass independently reads Camera Atlas through the existing AtlasAdmin connection. It selects only photos that meet Camera's publication, consent, retention, deletion and vetting rules. The database role is broad; separate database names do not enforce least-privilege access.
3. Fanmass claims one source photo under a global lease. It does not start another photo analysis until the active photo has been persisted or released. Retries are idempotent and fenced by source revision and analysis generation.
4. Fanmass stores the complete photo analysis and image-relative people/face boxes in its own pipeline database, then places that single result in its durable delivery outbox.
5. Fanmass sends the result to `POST /api/integrations/fanmass/events/{messmassEventId}/photos/{cameraPhotoId}` with contract `fanmass.messmass.photo-analysis.v2`. The payload includes the four routing IDs (Messmass event ID and Camera partner/event/photo IDs), source revision, generation, exact completion statuses for all required modules, analysis timestamp, people/face/brand-region boxes, and findings for that one image. It contains no user identity and no image bytes or URL.
6. When a reviewer corrects or confirms the photo in Camera, Camera stores a revision-bound `fanmassAnalysisReview` on that source photo. Fanmass discovers it from Atlas, stores the identity-free review with its result, and places an updated result in the same durable outbox. A human correction does not trigger another model run; Messmass applies a correction to report totals only after the matching result is confirmed.
7. Messmass validates the Messmass event ID against its linked Camera event ID and partner ID. It stores one record in `fanmass_camera_photo_analyses`, keyed by the Messmass event and Camera photo, and acknowledges only after storage and report projections succeed.
8. Messmass mechanically rebuilds the event summary and report variables from the active per-photo rows. It never accepts Fanmass event totals as the source for this workflow. A Camera deletion is delivered as a per-photo tombstone and excluded from the rebuilt aggregate.

## What the analytics mean

The canonical source is the set of completed per-photo records in `fanmass_camera_photo_analyses`. Event-level cards and report variables are sums or distributions over those received records only. They are not unique attendee counts, complete-event totals, projections, coverage percentages or a claim that all event photos have been analyzed. Messmass cannot calculate an event-completion denominator from this contract.

The AI Analytics event view shows the number of received photo results, actual person detections, people/face boxes, brand appearances, club appearances, merchandise, and the completed prohibited-content checks. Photo cards expose each stored result and its boxes so an operator can check the analysis. A category count of zero means no matching detection in the received sample; a missing observation means the analysis did not return that value. Neither means Fanmass completed the event.

Canonical report variables use the `fanmass` prefix and are defined in `lib/fanmassAnalyticsVariables.ts`. They cover:

- received photo-result count, people detections, person boxes and face boxes;
- measured people and smiling count/share;
- gender, age group, emotion and accessory counts/shares;
- merchandise and commercial-brand appearance item types;
- completed moderation checks, flagged-photo count/share, severity and prohibited-content categories;
- distinct brand and club labels and their appearance counts.

Percentages use the returned sample for that attribute. Person counts are detections across photos, not deduplicated people. Boxes remain attached to each photo result; event-level report variables do not replace photo detail.

## Removed legacy analytics

Event/batch links, event-level summaries and stats pushes, dashboard snapshots, projected reach, coverage/completion progress, and the manual “Fanmass Sync” action are retired from the Camera-photo workflow. Legacy write endpoints return `410 Gone`; they must not be restored as a second source of report data. The old `/admin/fanmass` dashboard redirects to the canonical `/admin/analytics/ai` surface.

The one-photo endpoints are authenticated with the Fanmass integration token (`FANMASS_INTEGRATION_TOKEN`, with the documented Messmass fallback). Never put token values in documentation or logs.

### Camera-photo data boundary

For this workflow, Camera is Fanmass's only source of image tasks. The Atlas source projection reads:

| Camera record | Fields | Why Fanmass reads them |
| --- | --- | --- |
| `submissions` | `_id`, `submissionId`, `eventId`, `eventIds`, `partnerId` | Stable photo key and exact Camera routing IDs. |
| `submissions` | `originalImageUrl`, `imageUrl`, `finalImageUrl`, `mimeType` | Fetch the source image and decode it. The URL stays inside Fanmass and is never sent to Messmass. |
| `submissions` | `submissionKind`, `method`, `reviewStatus`, `consentStatus`, `retentionStatus`, `isArchived`, `analyticsDeletion`, `hiddenFromEvents`, `mediaHealth.broken` | Recheck publication, consent, retention, deletion and image-health eligibility before analysis. |
| `events` | `eventId`, `partnerId`, `partnerName`, `name`, `messmassEventId`, `photoVetting.required` | Confirm the event association, publication gate and exact Messmass route. Names are local operational labels only. |

Fanmass does not read partner profiles, event descriptions, reports, contact information or identities from Messmass. Messmass receives the completed per-photo findings and uses the IDs to attach them to the correct event and rebuild reports.

Other Fanmass inputs, such as Google Drive images or event context used to run a Drive batch, are separate workflows. They must not change the Camera photo contract or make Fanmass an event-report owner.

## Operator checks

- Check `/admin/analytics/ai` for received-result totals and per-photo details.
- Open a photo card to inspect the stored normalized analysis and boxes.
- Compare a result to the original image and correct it through the supported human-review workflow; do not write event-level totals by hand.
- If a photo is deleted or becomes ineligible, confirm its tombstone is delivered and the event summary recalculates without it.
- Tombstone delivery remains valid after the Messmass event record is removed. Messmass verifies the original Camera event/partner identity against any stored photo row, clears that exact row, and rebuilds the per-photo summary; if the project no longer exists, it skips only the unavailable project-stat projection. A first-seen deletion for a removed event creates a tombstone so a later stale result cannot recreate the photo.
- If a result is missing, inspect the Fanmass single-photo queue/outbox and exact event/partner/photo identifiers. Do not use a batch sync or event-summary retry.
