# Notification System — Ground-Up Audit

Status: Active
Last Updated: 2026-07-05
Canonical: Yes (subsystem audit)
Owner: Product

## Trigger

Production admin (`messmass.com`) showed the bell badge at **2** while the open
notification panel header read **286 unread**, with a long tail of near-duplicate
"edited project" rows. The Product Owner classified this as a **system-level
problem, not a standalone bug**, and requested a ground-up audit collecting *all*
errors and malfunctions before any fix.

This document is that catalogue. It was produced by three independent code audits
(backend/data, frontend, email/config-and-design-drift) plus first-hand
verification of the most severe findings. No runtime/DB access was available, so
every finding is grounded in source; items needing production-data confirmation
are marked **[needs DB]**.

## Verdict

The notification system is **two loosely-related subsystems sharing a name**
(in-app notifications + an orphaned email module), built on a data model with
**no retention, no correct indexes, a non-atomic dedupe, an unauthenticated write
path, and split identity**, surfaced by **two frontend components that each own a
private unread count and never reconcile**. The "2 vs 286" is not the bug — it is
the visible symptom of a subsystem that has no single source of truth at any
layer. This warrants a foundation rebuild, not a patch.

---

## Critical findings

### C1 — Unbounded growth: no retention, TTL, cap, or cleanup anywhere
`lib/notificationUtils.ts:86-114` (insert); absence across `scripts/`, `lib/`, `vercel.json`.
Every project create/edit/stats-update inserts a permanent document. No TTL index,
no capped collection, no cleanup cron, no auto-archive. The collection is already
~4,128 docs (`scripts/createMissingIndexes.ts:90`) and every doc is "unread" for
every user forever. **This is the direct cause of the 286** and it grows without
bound. Compounded by C-data: `timestamp` is stored as an ISO **string**
(`notificationUtils.ts:52,92`), so a TTL index (which requires a BSON `Date`)
cannot even be added without a data migration.

### C2 — `POST /api/notifications` is unauthenticated
`app/api/notifications/route.ts:95-160` — the POST handler never calls
`getAdminUser()` (GET does at `:19`, PUT does at `mark-read/route.ts:17`). It
trusts `user`/`projectId`/`projectName` from the request body. Any anonymous
client can forge notifications for arbitrary users/projects ("X edited Y") and
flood the collection — a spoofing + DoS/growth amplifier on top of C1.

### C3 — Two unsynchronized unread-count states: the "2 vs 286"
Bell: `components/TopHeader.tsx:26,53-63` owns `unreadCount`, fetched on mount, a
30s interval, and on open. Panel: `components/NotificationPanel.tsx:33,56-74` owns
a **separate** `unreadCount`. The API returns one `unreadCount`
(`route.ts:69-72`), but the two components read it at different times and never
push to each other. The bell is **never** refreshed when notifications are created
or when the panel marks items read/archived (`NotificationPanel.tsx:105,129,151`
mutate only panel state). So the bell holds a stale small value (2) while the
freshly-fetched panel shows the true 286. No single source of truth.

---

## High findings

### H1 — Non-atomic dedupe with no unique index (duplicate races)
`lib/notificationUtils.ts:60-114` does `findOne` then `updateOne`/`insertOne`. Two
concurrent edits of the same project (double-save, autosave+manual, retries) both
see no existing row and both insert — the exact duplicates the 5-minute window was
meant to prevent. No unique index enforces the grouping key.

### H2 — No effective indexes at runtime; queries full-scan
`route.ts:59-72` sorts `{timestamp:-1}` and counts on `readBy`/`archivedBy`;
`mark-read/route.ts:56-58` updates on them. Indexes are only created by a **manual**
script (`package.json` `db:create-indexes`) not wired into deploy. Every GET runs
three unindexed passes (find + two `countDocuments`) over the whole collection.

### H3 — The index script targets wrong/nonexistent fields
`scripts/createMissingIndexes.ts:93-101`: indexes `createdAt` (queries sort by
`timestamp`) and `userId` (**no such field exists** — docs use `user`, `readBy`,
`archivedBy`). Even if run, the hot sort and the dedupe `findOne` still full-scan.
The grouping key `{user,activityType,projectId,timestamp}` has no supporting index.

### H4 — Split identity: actor stored as display name, read-state by id
`notificationUtils.ts:88` stores `user: params.user` where `getCurrentUser()`
returns `user.name || 'Admin User'` (`:137`), and the grouping key matches on that
name (`:61`). But `readBy`/`archivedBy` store `user.id` (`route.ts:47`,
`mark-read/route.ts:47`). Renames break attribution/grouping; two admins both
hitting the `'Admin User'` fallback collide into one grouped notification.

### H5 — Two divergent write paths (dual source of truth)
`lib/notificationUtils.ts:40-121` (6 activity types, grouping, `apiUser`/
`modifiedFields`/`metadata`) vs `app/api/notifications/route.ts:95-160` (3 types,
no grouping, none of the extra fields). Same collection, two schemas and two
validation contracts (`route.ts:123` rejects `api_stats_update`/`webhook_*` that
the util accepts).

### H6 — Email subsystem is orphaned from notifications
`lib/emailNotifications.ts` is never imported by `createNotification`. In-app
notifications never send email. Four of six email functions have **zero callers**
(`sendSyncSuccessEmail:44`, `sendSyncErrorEmail:84`, `sendDailySyncSummaryEmail:127`,
`sendContactFormEmail:190`; coverage `FNDA:0`). A `webhook_failed` alert never
emails anyone; a 3am sync failure sends no error mail.

### H7 — SMTP config bypasses `config.ts` and is undocumented
`lib/emailNotifications.ts:12-21` reads raw `process.env.SMTP_*`/`EMAIL_FROM`;
`lib/config.ts` (the declared SSOT) has no SMTP fields; `.env.example` has no
`SMTP_*` keys. A deploy without these silently breaks the one live email path
(password-reset email, `app/api/admin/local-users/[id]/send-email/route.ts:61`).

### H8 — Panel pagination not implemented; count and list permanently disagree
`NotificationPanel.tsx:59` hardcodes `limit=20`, never sends `offset`, ignores
`pagination.nextOffset`. Header says 286 but at most 20 rows render and there is no
"load more"/scroll — the count and the list can never agree.

### H9 — Errors swallowed and shown as a false "empty" state
`NotificationPanel.tsx:76-80` catches fetch errors with only `console.error`, then
renders "No notifications yet" (`:232-239`). Mark-read/archive failures
(`:107,132,153`) are silent — no toast, no rollback. `createNotification` returns
`false` on failure and every caller ignores it (`projects/route.ts:693,955`). A
500 looks like "all read".

### H10 — Self-retriggering double fetch on every panel open
`NotificationPanel.tsx:81` `fetchNotifications` depends on `previousUnreadCount`,
which it sets (`:73`), changing its own identity and re-firing the open-effect
(`:85-89`). Every open issues ≥2 `GET /api/notifications`.

---

## Medium findings

- **M1** `edit` vs `edit-stats` never group — one logical save yields two
  notifications (`projects/route.ts:956` vs `projects/[id]/route.ts:113`, grouping
  key includes activityType `notificationUtils.ts:62`).
- **M2** `markAll` is an unbounded, mis-scoped `updateMany`
  (`mark-read/route.ts:52-58`): for `action:'read'` it marks **archived** docs read
  too (no `archivedBy` exclusion), diverging from the unread definition
  (`route.ts:69-72`).
- **M3** Debug route returns internal data + `error.stack`
  (`app/api/debug/notifications/route.ts:98-102`); auth is fetched but not clearly
  enforced. **[needs DB]** to confirm prod exposure.
- **M4** Notification click ignores `projectId`/`projectSlug` and hard-navigates to
  `/admin/events` via `window.location.href` (`NotificationPanel.tsx:159-166`) —
  wrong destination + full SPA reload.
- **M5** Design-system non-compliance: the panel is raw `div/h3/p/button` + CSS
  module (`NotificationPanel.tsx:199-288`) while the rest of the header uses
  Mantine; it inherits none of GDS's a11y/theming (violates `docs/coding-standards.md`).
- **M6** Accessibility: rows are non-interactive `<div>`s with no `role`/`tabIndex`/
  key handler (`:244-250`); panel has no dialog role, focus management, or
  Escape-to-close (`:200,41-52`); decorative emoji lack `aria-hidden` (`:251`).
- **M7** Cron `google-sheets-sync` degrades to unauthenticated if `CRON_SECRET`
  unset (`app/api/cron/google-sheets-sync/route.ts:33-34`); secret absent from
  `.env.example`.
- **M8** Zero automated tests for the whole notification/email system (no `tests/`
  file matches `notification`; email fns `FNDA:0`).

## Low findings

- **L1** Pagination inputs unvalidated/uncapped (`route.ts:34-35`) — `?limit=1e6`
  forces a huge scan.
- **L2** `timestamp` stored as ISO string, blocking TTL and forcing lexicographic
  sort (`notificationUtils.ts:52`). (Prerequisite for C1's fix.)
- **L3** `markAsRead` pushes duplicate ids / over-decrements if called on an
  already-read row (`NotificationPanel.tsx:103-105`).
- **L4** `setTimeout` "new" indicator never cleared on unmount; feature effectively
  dead (`NotificationPanel.tsx:68-71`).
- **L5** Hardcoded px/color values instead of `--mm-*` tokens
  (`NotificationPanel.module.css:139,204-205,259,283`).
- **L6** Bell-click vs panel outside-`mousedown` race can flicker/reopen
  (`TopHeader.tsx:67-73` vs `NotificationPanel.tsx:42-52`).
- **L7** Badge has no `99+` cap — "286" overflows the circle (`TopHeader.tsx:127-129`).
- **L8** Silent misattribution to `'Admin User'` on any auth failure
  (`notificationUtils.ts:138`).

---

## Systemic patterns (recur beyond notifications)

1. **Raw `process.env` bypassing `lib/config.ts`** — SMTP and `CRON_SECRET` both
   dodge the declared config SSOT.
2. **Fire-and-forget writes with swallowed errors + ignored return booleans** —
   `createNotification` and all email fns return `false` that no caller checks.
3. **Manual, drift-prone index management** — `scripts/createMissingIndexes.ts`
   references non-existent fields and mismatched sort keys; not deploy-wired.
4. **No retention on high-volume collections** — notifications join
   `webhook_deliveries`, audit logs, `bitly_links` as unbounded collections.
5. **Display-name-as-identity** — using `user.name` (with an `'Admin User'`
   fallback) as an actor key while ids are used for state.

---

## Target architecture (ground-up)

1. **One authenticated, server-side creation path.** Delete the public
   `POST /api/notifications` body-trust path; all notifications flow through a
   single `createNotification()` that derives the actor from the session. Clients
   can never name the actor.
2. **Immutable event + idempotent upsert.** Compute
   `dedupeKey = hash(actorId, action, projectId, floor(time/window))` and do one
   atomic `updateOne({dedupeKey}, {...}, {upsert:true})` on a **unique index** —
   eliminates the check-then-insert race (H1) and unifies grouping.
3. **Stable identity.** Store `actorId` + denormalized `actorName`; resolve display
   names at read time. No name-as-key (H4, L8).
4. **Bounded by design.** Store `occurredAt` as a BSON `Date`; add a TTL index
   (`expireAfterSeconds`) and/or auto-archive-on-read so the collection is
   self-limiting (C1, L2).
5. **Deploy-time indexes with correct fields.** `{occurredAt:-1}` feed index, the
   unique `dedupeKey`, and per-user read-state indexes — created on deploy, not by a
   hand-run script with wrong fields (H2, H3).
6. **Single count source.** One `unread-count` contract consumed by both bell and
   panel (lifted context / shared hook), refreshed after every mutation and on
   arrival; ideally per-user unread counters pushed via SSE so bell and panel can
   never drift (C3, H8, H10).
7. **Observable failures.** Notification/email writes surface errors to logging/monitoring
   instead of returning a swallowed boolean (H9).
8. **GDS-compliant, accessible panel.** Rebuild the panel on Mantine/GDS primitives
   with dialog semantics, keyboard operation, deep-link routing via `router.push`
   (M4, M5, M6).
9. **Decide email's fate.** Either wire `emailNotifications` into the creation path
   for alert-worthy types (`webhook_failed`, etc.) behind documented, `config.ts`-sourced
   SMTP, or remove the dead functions (H6, H7).

---

## Remediation plan (phased)

**Phase 0 — Stop the bleeding (safe, code-only, verifiable now)**
- Authenticate/parameterize creation: remove or auth-gate `POST /api/notifications` (C2); consolidate to the single util path (H5).
- Single count source on the frontend (C3, H8, H10, H9): shared unread-count hook/context, refreshed after mutations; surface error state.

**Phase 1 — Data model (code now, migration [needs DB])**
- New event/document shape with `actorId`, `Date occurredAt`, `dedupeKey`; idempotent upsert on a unique index (H1, H4).
- Deploy-time index module with correct fields + TTL (H2, H3, C1, L2).
- **[needs DB]** one-time migration of the ~4,128 existing docs (add fields, convert dates, dedupe) and backlog cleanup.

**Phase 2 — Retention + observability**
- TTL / auto-archive-on-read; failures to monitoring (C1, M2, H9).

**Phase 3 — Frontend rebuild on GDS + a11y + deep links** (M4–M6, L3–L7).

**Phase 4 — Email decision + config SSOT + tests** (H6, H7, M7, M8).

---

## Verified first-hand (not agent-only)
- `POST /api/notifications` has no `getAdminUser()` (read of `route.ts:95-160`). ✅ C2
- No retention/TTL/cleanup for notifications anywhere (repo-wide grep). ✅ C1
- Bell and panel each own separate `unreadCount` state, both reading `data.unreadCount`
  (`TopHeader.tsx:53-63`, `NotificationPanel.tsx:56-74`). ✅ C3
- `createMissingIndexes.ts:99-100` indexes `userId` (nonexistent) and `createdAt`
  (not the queried `timestamp`). ✅ H3
- Debug route imports and calls `getAdminUser` at `:14`. (Refines M3 — auth present;
  enforcement/stack-leak still to confirm.)
