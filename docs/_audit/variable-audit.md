# messmass variable audit + normalization plan

Read-only audit of the event-statistics variable model, 2026-08-20.
Source of truth = the `messmass` MongoDB (376 events). Reusable scanner:
`scripts/audit-variables.mjs`. NO data was modified.

## Headline numbers
- **376 events**, **244 distinct stat variables** in the data.
- **226** entries in the `variables_metadata` registry.
- **126** variables are referenced by at least one chart / report template /
  variant. **118 are stored but referenced nowhere** (dead weight).
- **68** variables exist in only 1-2 events (event-specific noise in a shared namespace).
- **20** variables are in the data but NOT registered; **2** are registered with no data.

## Finding 1 — report/data NAME MISMATCH (why "general analytics" fails)
Report templates reference one name while events store another for the SAME metric.
Data captured under the stored name never reaches the report.
| Reports reference | Events actually store | Events w/ data under the stored name |
|---|---|---|
| `ventFacebook` (64) | `visitFacebook` | 115 |
| `ventInstagram` (43) | `visitInstagram` | 115 |
| `ventQr` (48) | `visitQrCode` / `bitlyClicksFromQRCode` | 1 / 99 |
| `bitlyTotalClicks` (used) | also `totalBitlyClicks` | 95 (identical values) |
| `bitlyUniqueClicks` (used) | also `uniqueBitlyClicks` | 95 (identical values) |
`vent*` is a truncation/typo family duplicating the `visit*` social-visit family.
This is the core blocker to cross-event analytics.

## Finding 2 — exact-synonym duplicates (safe to merge)
Co-occurrence checked per event (conflict = both present with different values):
- `totalBitlyClicks` → `bitlyTotalClicks`: 95 both, **0 conflicts**, 0 legacy-only ⇒ **drop legacy, clean**.
- `uniqueBitlyClicks` → `bitlyUniqueClicks`: 95 both, **0 conflicts** ⇒ **drop legacy, clean**.
- `ventQr` → (QR family): 48 legacy-only, 0 overlap ⇒ **rename, clean**.
- `ventUrl` → `directUrl`: 23 legacy-only, 2 both, 0 conflicts ⇒ **rename, near-clean**.

## Finding 3 — conflicted merges (need a rule, not automatic)
- `Caps` (7) vs `baseballCap` (367): all 7 overlap and **all 7 conflict** (different
  values). Likely a separate count, not a synonym — decide sum vs keep-separate.
- `ventFacebook`↔`visitFacebook`: 45 vent-only, 96 visit-only, 19 both (17 conflict);
  `ventInstagram`↔`visitInstagram`: 37 / 109 / 6 (1 conflict). Same concept, split
  across events by name, with some events double-tracking ⇒ pick a canonical and a
  conflict rule (prefer visit, or sum).

## Finding 4 — three competing schemes for "top countries by clicks"
- positional pairs `bitlyCountry1..5` + `bitlyCountry1Clicks..5Clicks` (10 vars)
- ISO per-country `bitlyClicksByCountryDE/GB/US/...` (30+ vars, mostly 1-2 events, incl. a `bitlyClicksByCountrynull`)
- spelled-out `topCountryone..four` (1 event)
- plus `bitlyTopCountry`, `bitlyCountryCount`, `countriesReached`
⇒ collapse to ONE structured shape: `bitlyCountries: [{ code, clicks }]`.

## Finding 5 — dead weight (stored, referenced in no report)
118 vars. Biggest groups:
- **fanmass\*** (31 vars, e.g. `fanmassGenderFemalePct`, `fanmassAgeAdultsPct`,
  `fanmassEmotionHappyPct`): AI-analysis outputs captured but charted nowhere.
- **reportImage11..25** (15) and overflow **reportText\*** slots: unused layout placeholders.
- **bitlyClicksByCountry\*** one-offs, **fanSelfie\*** slot vars, `allImages`, `indoor`,
  `outdoor`, `eventResult*`.

## Finding 6 — partner-specific vars in the shared namespace
`szerencsejatek*` (18 vars, Szerencsejáték Zrt campaign) in 213 events, and the
`TIPPMIX` clicker set. Meaningful for one partner only; they inflate the shared
variable set and can't be compared across partners ⇒ move to a partner-scoped or
namespaced group.

## Proposed canonical model (for general analytics)
1. **Demographics** (keep): `male`, `female`, `other`; `genAlpha`, `genYZ`, `genX`, `boomer`.
2. **Merch** (keep, resolve Caps): `jersey`, `scarf`, `flags`, `baseballCap`, `merched`, `specialMerch`.
3. **Images** (keep): `remoteImages`, `hostessImages`, `selfies`, `approvedImages`, `rejectedImages`; drop `allImages` if truly a derived total.
4. **Location** (keep): `indoor`/`outdoor`, `stadium`; `remoteFans`, `totalFans`, `eventAttendees`.
5. **Social visits** (merge vent→visit): `visitFacebook`, `visitInstagram`, `visitTiktok`, `visitYoutube`, `visitX`, `visitTrustpilot`, `visitWeb`, `directUrl`, `visitQrCode`.
6. **Bitly** (merge word-order dupes, structure countries): `bitlyTotalClicks`, `bitlyUniqueClicks`, `bitlyCountryCount`, `bitlyClicksFrom*` (source family), `bitlyCountries[]`.
7. **fanmass AI** (namespace + chart the ones you want): keep as a `fanmass*` group, expose the few you actually report on.
8. **Report content** (not analytics): `reportText*`, `reportImage*` — exclude from the analytics variable set entirely (they are layout slots, not metrics).

Target: ~244 → roughly **70-90 analytics variables** + a separate content-slot group.

## Migration mechanism (the "copy actual → planned" you asked for)
A reversible, dry-run-first migration script (`scripts/migrate-variables.mjs`) that,
per rename/merge rule, for every event:
1. reads the legacy value(s),
2. writes to the canonical name using the rule (`copy` if canonical empty; `sum`,
   `prefer-canonical`, or `flag-conflict` when both exist),
3. records the before-value in an audit log,
4. removes the legacy key ONLY after the write is verified.
Guardrails: `--dry-run` default; a per-event backup of touched fields to a
`variable_migration_backup` collection; conflict rows written to a review file
instead of guessed; run in batches; re-runnable/idempotent.

## Recommendation
- Ship the CLEAN merges first (findings 2, and the country-structure of 4): zero
  data loss, immediate dedup.
- Fix finding 1 (vent→visit) with the operator's chosen conflict rule — this is the
  one that actually unlocks cross-event social analytics.
- Decide Caps and the fanmass charting separately.
- Do NOT auto-run: this writes to 376 production events. Approve the rules per pair,
  then the migration runs dry-run → review → apply, with the backup collection.
