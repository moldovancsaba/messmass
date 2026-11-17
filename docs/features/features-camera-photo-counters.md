# Camera Photo Counters - Variables and Mapping
Status: Active
Last Updated: 2026-11-18T00:00:00.000Z
Canonical: Yes
Owner: Product

**What this is**: the event-level operational counters the Camera service measures for an event (photo lifecycle, vetting latency, consent acceptance, tracked source attribution, review-queue age buckets, rejection reasons, and capture-page Journey metrics) and how they arrive in Messmass under their own `camera_` namespace (`lib/cameraPhotoStats.ts`).

**Distinct from per-photo Fanmass analytics**: `camera_*` counters are **event aggregates only** — no guest identity, photo binary, bounding box, AI detection, or manual person/gender/age/emotion/merchandise annotation is sent through this feed. Per-photo people, demographic, emotion, merchandise, and OCR-proven brand/club detections belong to the separate Fanmass per-photo contract (`POST /api/integrations/fanmass/events/{messmassEventId}/photos/{cameraPhotoId}`, `lib/fanmassPhotoAnalyses.ts`) and are reviewed on `/admin/analytics/ai` and `/admin/fanmass-evidence` (see also [camera#801](https://github.com/moldovancsaba/camera/issues/801)).

**Activation & runtime state**: Messmass's receiver (`POST /api/integrations/camera/events/{messmassEventId}/photo-stats`) is active. In Camera (`lib/analytics/counters.ts`), outbound sending is controlled by the global `messmassCountersEnabled` setting (off unless explicitly enabled). Enabling the setting does not backfill historical events immediately; a subsequent live trigger (new submission, review decision other than approval-email retry, or saved Journey batch) triggers a push. Production configuration state must be verified in the live environment rather than inferred from source.

---

## How they arrive

- **Whole event totals, written as replacements.** Camera sends the current running total for the event in `totals` (with labels in `labels`). Repeated snapshots overwrite the same `stats.camera_*` keys rather than incrementing them. Outbound delivery is best-effort with an atomic attempt throttle and process-local coalescing (`pushedAt` records the attempt/claim timestamp, not a guaranteed delivery receipt).
- **Only the `camera_` namespace.** Every key must match `^camera_[a-z0-9_]{1,80}$`. Any key outside `camera_` rejects the entire request (`400`), so `female`, `scarf`, `approvedImages`, and `fanmass*` variables can never be overwritten by this endpoint.
- **Totals only from current Camera builder.** The receiver schema accepts `totals` (integers `0..1,000,000,000`) and optional `averages` (up to 4 decimals), at most 300 keys per push. Camera's `buildCounters` (`lib/analytics/counters.ts`) emits **totals only** so multi-event reports can sum them safely.
- **Omission rule (never zero for unmeasured families).** A counter family that has no underlying record is omitted, never sent as `0`:
  - An event with no recorded Journey (`isRecorded(journey) === false`) sends no `camera_journey_*`, `camera_upload_*`, or `camera_users_*` counters.
  - An event with no decided photo (`timeToFirstDecision.count === 0`) omits `camera_images_decided` and `camera_vetting_seconds_total`.
  - An event with no rejected photo (`photos.rejected === 0`) omits `camera_rejected_*` and `camera_images_rejected_no_reason`.
- **Storage and variable catalog.** Written to `projects.stats.<name>` with an audit snapshot in `projects.cameraPhotoStats` (`totals`, `averages`, `updatedAt`). First-seen keys are registered once in `variables_metadata` (`category: 'Camera'`, `visibleInClicker: false`, `editableInManual: false`, `isSystem: false`).

---

## Fixed and dynamic counters emitted by Camera (`lib/analytics/counters.ts`)

| Family | Counter keys | When emitted / notes |
|---|---|---|
| Photo lifecycle & consent | `camera_images_taken`, `camera_images_approved`, `camera_images_rejected`, `camera_images_shown_on_slideshow`, `camera_consents_accepted` | Always emitted on every counter push. |
| Vetting latency | `camera_images_decided`, `camera_vetting_seconds_total` | Emitted once at least one photo has a first vetting decision (`camera_vetting_seconds_total / camera_images_decided` gives mean vetting time). |
| Tracked sources | `camera_source_visits`, `camera_source_photo_submissions`, plus dynamic per-placement `camera_source_<slug>_visits` and `camera_source_<slug>_photos` | Emitted when a `SourcesReport` is present (`<slug>` normalized to `[a-z0-9_]`, up to 32 chars). |
| Review queue age buckets | `camera_review_queue_<bucket>` | One dynamic total per waiting-age bucket in `report.photos.waitingAgeBuckets`. |
| Rejection reasons | `camera_rejected_<reason_key>`, `camera_images_rejected_no_reason` | Emitted only when `report.photos.rejected > 0`. Includes active `reject_reason` vocabulary keys and any historical key with count `> 0`. |
| Journey core | `camera_journey_opens`, `camera_journeys_completed`, `camera_journeys_finished`, `camera_permission_denied`, `camera_retakes`, `camera_consents_abandoned`, `camera_shares`, `camera_downloads` | Emitted only when `isRecorded(journey)` is true. |
| Journey duration & CTA | `camera_journey_completed_duration_ms_total`, `camera_journey_completed_duration_samples`, `camera_journey_cta_page_visits`, `camera_journey_cta_clicks`, `camera_journey_cta_external`, `camera_journey_cta_continue`, `camera_journey_cta_returns` | Emitted when `isRecorded(journey)` is true. |
| Journey steps, transitions & SSO | `camera_journey_step_reach_<step>`, `camera_journey_transition_<from>_to_<to>`, `camera_journey_auth_<outcome>` | Dynamic totals per recorded step, transition, and SSO callback outcome when `isRecorded(journey)` is true. |
| Device/method uploads | `camera_upload_<group>_started`, `camera_upload_<group>_succeeded`, `camera_upload_<group>_failed`, `camera_upload_<group>_duration_<bucket>` | Dynamic totals per upload device/method group and duration bucket when `isRecorded(journey)` is true. |
| Aggregate event users | `camera_users_identifiable`, `camera_users_returning`, `camera_users_new` | Aggregate repeat-user counts emitted when `isRecorded(journey)` is true. Never contains a person or identifier. |

---

## Using `camera_*` counters vs Fanmass per-photo variables in reports

- **Operational funnel & vetting (`camera_*`)**: Use `camera_images_taken`, `camera_images_approved`, `camera_images_rejected`, `camera_consents_accepted`, `camera_journey_opens`, and `camera_journeys_completed` for capture funnel, consent rate, approval rate, and vetting speed charts (`/admin/charts` and `lib/hashtagReport/calculated.ts`).
- **Visual intelligence & audience demographics (`fanmass*`)**: Use `fanmassPeopleDetections`, `fanmassGender*`, `fanmassAge*`, `fanmassEmotion*`, `fanmassSmilingCount`, `fanmassMerchandise*`, `fanmassBrandAppearances`, and `fanmassClubAppearances` (`lib/fanmassAnalyticsVariables.ts`) for image-derived audience and sponsor metrics.
- **Variable merge protection**: `/admin/kyc` variable merge (`lib/variableMerge.ts`) skips and refuses the `camera_` namespace so operational counters cannot be merged into manual clicker or Fanmass variables.
