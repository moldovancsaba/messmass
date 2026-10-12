# Camera Photo Counters - Variables and Mapping
Status: Active
Last Updated: 2026-10-12T00:00:00.000Z
Canonical: Yes
Owner: Product

**What this is**: the counters the camera service measures for an event (photos, the people a reviewer marked in them, the journey of the capture page) and how they arrive in messmass: under their own `camera_` names, next to the variables messmass already holds. Use this page to build report templates and charts from them.

**Status of the feed**: messmass can receive them (`POST /api/integrations/camera/events/{messmassEventId}/photo-stats`, `lib/cameraPhotoStats.ts`). Camera's sending is switched off until the owner decides, so no event holds a `camera_` value yet.

---

## How they arrive

- **Whole totals, written as they are.** Camera sends the running total of each counter for the whole event. `stats.camera_gender_female` is, at the end, how many women were counted across all annotated photos of the event. A repeated or late push changes nothing and a lost one is repaired by the next. There is no baseline and no addition to a value typed in: the names belong to camera alone.
- **Only the `camera_` namespace.** Every name must match `^camera_[a-z0-9_]{1,80}$`. One name that does not match refuses the whole request and nothing is written, so `female`, `scarf`, `approvedImages`, the `fanmass*` family or any other variable can never be touched by this route. No key is ever removed.
- **Totals and averages.** A total is a whole number from 0 to 1,000,000,000. An average (`camera_avg_vetting_seconds`, `camera_avg_people_per_image`) is a number with at most four decimals, stored as it is. A name is in one of the two, never both. At most 300 names per push.
- **Where they are stored.** `projects.stats.<name>` (one `$set` per push, never the whole `stats` object) and an audit copy of what was received in `projects.cameraPhotoStats` (`totals`, `averages`, `updatedAt`).
- **The variable catalog.** The first time a name is received it is added to `variables_metadata` (admin: `/admin/kyc`): category **Camera**, label from camera or "Camera: gender female", type `count` (totals) or `numeric` (averages), not derived, **not offered in the clicker and not editable in manual mode** (the flags are off, like `fanmassStatus`), not a system variable. The entry is created once and never overwritten, so an administrator can relabel it, move it to another category or change its flags and a later push leaves it as it is. The response says `catalog: 'registered'` or `'failed'`; a catalog failure never undoes the stats write, and the next push registers again. The catalog list refreshes within five minutes (the cache of `/api/variables-config`).
- **In reports.** A catalog entry does not put anything into an existing report by itself. Add a chart or KPI that uses the token, for example `[camera_gender_female]`, or `[camera_gender_female]/[camera_people_total]*100` for a share (tokens may contain underscores). A counter that has not been received reads as 0.

## Mapping to the existing variables

The camera counters measure the same things from different data (the people reviewers marked in the photos of the event), so they are separate variables, not replacements. Choose in each report which one to show; do not add a camera counter to the variable it resembles.

| Existing variable | Camera counter | Note |
|---|---|---|
| `female`, `male` | `camera_gender_female`, `camera_gender_male`, `camera_gender_unsure` | Counts of people marked in annotated photos. `camera_gender_unsure` (people marked as unsure) has no existing counterpart. |
| `genAlpha`, `genYZ`, `genX`, `boomer` | `camera_age_kid`, `camera_age_young`, `camera_age_adult`, `camera_age_old` | **Not the same buckets.** Camera uses age bands: child about 0-12, young about 13-24, adult about 25-59, senior 60+. They are not generation buckets: do not add them to the four generation variables and do not read one as the other. |
| `jersey`, `scarf`, `flags`, `baseballCap` | `camera_merch_jersey`, `camera_merch_scarf`, `camera_merch_flag`, `camera_merch_cap` | Items marked on people in photos. |
| `merched` | `camera_people_with_merch` | People with at least one item. |
| `approvedImages`, `rejectedImages` | `camera_images_approved`, `camera_images_rejected` | Photos approved and declined now, counted by camera. |
| fanmass AI percentages (`fanmassGenderFemalePct`, `fanmassGenderMalePct`, `fanmassAgeAdultsPct`, `fanmassEmotionHappyPct`, ...) | `camera_gender_*`, `camera_age_*`, `camera_emotion_*` | Camera sends **counts, not percentages**. Derive a percentage in the report: `[camera_emotion_happy]/[camera_people_total]*100`. |

## The names camera sends

| Group | Names |
|---|---|
| Photos | `camera_images_taken`, `camera_images_approved`, `camera_images_rejected`, `camera_images_shown_on_slideshow`, `camera_images_annotated`, `camera_images_with_people`, `camera_images_no_people`, `camera_images_one_person`, `camera_images_group` |
| Vetting (average) | `camera_avg_vetting_seconds` |
| Consent and journey | `camera_consents_accepted`, `camera_consents_abandoned`, `camera_journey_opens`, `camera_journeys_completed`, `camera_permission_denied`, `camera_retakes`, `camera_shares`, `camera_downloads` |
| People | `camera_people_total`, `camera_people_with_merch`, `camera_avg_people_per_image` (average) |
| Gender | `camera_gender_female`, `camera_gender_male`, `camera_gender_unsure` |
| Age band | `camera_age_kid`, `camera_age_young`, `camera_age_adult`, `camera_age_old` |
| Emotion | `camera_emotion_happy`, `camera_emotion_neutral`, `camera_emotion_sad`, `camera_emotion_angry`, `camera_emotion_unamused` (and `camera_emotion_excited`, `camera_emotion_surprised` when camera switches them on) |
| Merchandise | `camera_merch_jersey`, `camera_merch_scarf`, `camera_merch_cap`, `camera_merch_flag` (and `camera_merch_face_paint`, `camera_merch_banner` when switched on); an event may add its own option, `camera_merch_<option>` |
| Declined, by reason | `camera_rejected_offensive_gesture`, `camera_rejected_nudity`, `camera_rejected_alcohol`, `camera_rejected_forbidden`, `camera_rejected_violence`, `camera_rejected_hate`, `camera_rejected_drugs`, `camera_rejected_competitor_brand`, `camera_rejected_political`, `camera_rejected_poor_quality`, `camera_rejected_spam_test`, `camera_rejected_other`, `camera_images_rejected_no_reason` |

A counter that camera cannot count (for example the journey counters of an event with no journey recording) is not sent at all, so it keeps its last value or stays unset; it is never sent as a zero.

## Things to know when building reports

- **Averages are not additive.** Reports that add events together (a partner report, an organisation report, a filter report by hashtag combination) sum every numeric stat, so `camera_avg_vetting_seconds` and `camera_avg_people_per_image` show a sum there, not an average. For a mean across events use a ratio of totals, for example `[camera_people_total]/[camera_images_annotated]`; the average vetting time has no ratio of totals, so use it on single-event reports only.
- **Some pages do not add the camera counters at all.** The hashtag report (`/api/hashtags/[hashtag]`) and the hashtag filter report (`/api/hashtags/filter`) add a fixed list of variables, and the camera counters are not in it: those pages read them as 0. The partner report, the organisation report and the filter report by slug (`/api/hashtags/filter-by-slug/[slug]`) add every numeric stat, so counts add up correctly there.
- **They are visible wherever the event's stats are.** `/api/projects/stats/{slug}` returns the whole `stats` object to anyone who can open the event report (the report link, behind its password when it has one), and the event CSV exports list every stat, so `camera_` counters (aggregate counts, never a person) appear in both. The audit copy `cameraPhotoStats` is not returned there.
- **Events linked to a Google Sheet.** The sheet sync (`/api/cron/google-sheets-sync`, partner Pull, event Pull) replaces the whole `stats` object of such an event with what the sheet holds, so a `camera_` value on it is lost at the next sync until camera's next push writes it again.
- **The merge console never offers them.** `/admin/kyc` merge candidates and the merge itself skip and refuse the `camera_` namespace (`lib/variableMerge.ts`), so a camera counter is not folded into `female`, `scarf` or another variable.
