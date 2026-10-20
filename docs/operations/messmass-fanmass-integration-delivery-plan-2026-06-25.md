# Archived: Messmass–Fanmass MVP delivery plan

This June 2026 plan describes the first event/batch integration design. It is
retained for historical traceability only; its event-context, mapping, event
summary, stats-push, callback, projected-reach, and Fanmass-sync instructions
are obsolete and must not be used for the Camera photo-analysis workflow.

## Current authoritative contract

- [Fanmass operator and workflow guide](../guides/guides-tutorial-fanmass.md)
- [Analytics API and current photo-result surface](../api/api-analytics.md)
- [Complete API reference](../api/api-reference-complete.md)
- [Messmass architecture](../architecture.md)

Current Camera photo flow: Camera owns the event, photo, consent, retention,
identity, and vetting records. Fanmass independently discovers eligible
Camera photos from Atlas, analyzes one photo at a time, retains that photo's
findings and boxes, and sends one identity-free result or tombstone with the
exact Camera partner/event/photo IDs and linked Messmass event ID. Messmass
validates those IDs, stores the per-photo result, and mechanically builds the
event report. Fanmass does not query Messmass event context or produce event
aggregates for this flow.

The separate Google Drive ingestion workflow is documented in Fanmass's
runbook and is not part of this Camera photo contract.
