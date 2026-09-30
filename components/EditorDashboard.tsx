'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import ColoredCard from './ColoredCard';
import { evaluateFormula } from '@/lib/formulaEngine';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import UnifiedHashtagInput from './UnifiedHashtagInput';
import ImageUploadField from './ImageUploadField';
import ImageUploader from './ImageUploader';
import TextareaField from './TextareaField';
import ReportContentManager from './ReportContentManager';
import BuilderMode from './BuilderMode';
import UnifiedTextInput from './UnifiedTextInput';
import UnifiedNumberInput from './UnifiedNumberInput';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations,
  expandHashtagsWithCategories 
} from '@/lib/hashtagCategoryUtils';
import {
  addSentValues,
  countedDraftFields,
  createSaveQueue,
  createAccessRecovery,
  createTabId,
  discardDraftFields,
  getDraftStorage,
  mergeFieldChanges,
  planDraftRestore,
  readDrafts,
  removeDraft,
  replaceDraft,
  sameFieldValue,
  sendJsonForSave,
  whenAllSaved,
  withoutDraftCounts,
  writeDraft,
  type AccessCheckResult,
  type AccessRecovery,
  type DraftCounts,
  type DraftFields,
  type DraftRestorePlan,
  type HeldBackDraft,
  type OutstandingCounts,
  type SaveAttempt,
  type SaveQueue,
  type SaveQueueSnapshot,
  type SentValues,
  type StoredDraft,
} from '@/lib/editorSaveQueue';
import { ensureDerivedMetrics } from '@/lib/dataValidator';
import {
  MAX_EVENT_STAT_CHANGES,
  isWritableEventStatIncrement,
  isWritableEventStatKey,
  isWritableEventStatValue,
} from '@/lib/eventSaveRules';
import Image from 'next/image';
import styles from '@/app/styles/editor-states.module.css';
import reportStyles from './ReportContentManager.module.css';

// WHAT: Variable config type loaded from /api/variables-config to control Editor UI visibility.
// WHY: Admin decides which variables appear in clicker vs. manual; we respect flags at render-time.
interface VariableWithFlags {
  name: string;
  label: string;
  type: 'count' | 'numeric' | 'currency' | 'percentage' | 'boolean' | 'date' | 'text' | 'textarea' | 'texthyper' | 'textmedia';
  category: string;
  derived?: boolean;
  flags: { visibleInClicker: boolean; editableInManual: boolean };
  isCustom?: boolean;
  clickerOrder?: number;
  manualOrder?: number;
  linkedContentAsset?: string; // Content Library slug for media variables
}

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  partner1?: { _id: string; name: string; emoji: string; logoUrl?: string; clickerSetId?: string };
  partner2?: { _id: string; name: string; emoji: string; logoUrl?: string; clickerSetId?: string };
  googleSheetUuid?: string;
  partnerId?: string;
  stats: {
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    // Derived/extended fields (new)
    remoteFans?: number; // New aggregated fans count (indoor + outdoor)
    socialVisit?: number; // New aggregated social visits (sum of individual socials)
    // Success Manager fields
    approvedImages?: number;
    rejectedImages?: number;
    visitQrCode?: number;
    visitShortUrl?: number;
    visitWeb?: number;
    visitFacebook?: number;
    visitInstagram?: number;
    visitYoutube?: number;
    visitTiktok?: number;
    visitX?: number;
    visitTrustpilot?: number;
    eventAttendees?: number;
    eventTicketPurchases?: number;
    eventResultHome?: number;
    eventResultVisitor?: number;
    eventValuePropositionVisited?: number;
    eventValuePropositionPurchases?: number;
    // WHAT: Allow any additional field (string or number) for dynamic variables
    // WHY: Partner report text (reportText*) and images (reportImage*) store strings
    // HOW: Index signature allows flexible stats structure managed by variables_metadata
    [key: string]: number | string | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

type ProjectStats = Project['stats'];
type CategorizedHashtags = { [categoryName: string]: string[] };

interface EditorDashboardProps {
  project: Project;
  /**
   * Epoch ms when the request that produced `project` was sent. Lets a re-fetch
   * that raced a local change or a save be recognised as possibly stale.
   */
  fetchStartedAt?: number;
  /**
   * Re-establish save access after the server refused a save with 401: the
   * page re-loads the project (the server re-issues or renews its grant) or
   * shows the password prompt. Resolves 'granted' once saving may be retried,
   * 'blocked' when this page cannot save (wrong link), 'retry' when access could
   * not be checked. Without it, the editor simply retries the save with backoff.
   */
  onRequestAccess?: () => Promise<AccessCheckResult>;
  /**
   * The server's answer to "may this caller save this event?" from the load
   * that produced `project`. false: saving will be refused (show why up front).
   * undefined: not reported; assume yes.
   */
  canSave?: boolean;
  /**
   * Load the event again through the page (same path as the tab-focus
   * re-fetch) and return the copy, or null when it could not be loaded. Used
   * after a sheet pull, so the pulled values are on screen before the next save.
   */
  onReload?: () => Promise<ReloadedProject | null>;
}

/** One load of the event, as the page hands it to the editor. */
export interface ReloadedProject {
  project: Project;
  fetchStartedAt: number;
  canSave?: boolean;
}

// WHAT: What the save queue holds for the event editor: only the values
//     changed on this page that the server has not confirmed yet -- each stat
//     a change touched (statsChanges: its new value, or null when the stat was
//     removed), and a hashtag list only when it changed. The queue merges
//     payloads that wait or failed (mergeEditorSavePayloads: union, the newest
//     value of a key wins).
// WHY: The editor used to send its whole stats object (with the event's name
//     and date), and PUT /api/projects replaced the stored one with it. A
//     value someone else stored since this tab last loaded -- fanmass results
//     landing mid-event, a sheet pull, an admin's fix, a second device -- was
//     put back to this tab's old copy by its next click, and the save was
//     still confirmed. A key no change on this page touched is never sent, so
//     it can never be sent back. The server writes only the keys named, and
//     fills in the totals it derives (allImages, remoteFans, totalFans) itself.
// COUNTS: A clicker tap is sent as a count (statsIncrements: +1 or -1 per
//     key), which the server adds to the stored value, not as the value this
//     tab shows. Two devices counting the same stat at two gates both count:
//     sent as values, each save overwrote the other device's taps with this
//     tab's own running total, and a device that came back online put its
//     older total back over everything counted meanwhile. A tap on a stat
//     with no stored number yet (the remote-fans fallback formula, a stat
//     never counted) is sent as a value. Counts not confirmed yet are kept
//     as counts in the draft too, and restored as counts after a reload
//     (see draftCountsOfQueue and COUNTS in lib/editorSaveQueue.ts).
// RESEND: A request restored from a draft that went out once without an
//     answer carries the tabId and clientSeq it went out under, and is sent
//     again under them instead of this tab's own: if it was stored, the
//     server's late-write guard turns the copy away (stale) instead of
//     counting it twice. It is never merged with another payload.
// NOTE: Every field here must be one a page-grant holder may write
//     (EVENT_EDITOR_WRITABLE_FIELDS in lib/apiGuards.ts). The event's name and
//     date are never sent: the editor has no control for either.
export interface EditorSavePayload {
  projectId: string;
  statsChanges: Record<string, unknown>;
  statsIncrements?: Record<string, number>;
  hashtags?: string[];
  categorizedHashtags?: CategorizedHashtags;
  resend?: EditorSequence;
}

/** The late-write guard's name for one request: the editor tab and its place in that tab's saves. */
export interface EditorSequence {
  tabId: string;
  clientSeq: number;
}

// WHAT: The PUT /api/projects body: a payload plus who sent it and in what
//     order -- tabId (this editor instance) and clientSeq (one higher for
//     every new request; a retry of the same payload repeats its number).
// WHY: The late-write guard. A request the page gave up on (the 25 s save
//     deadline) can still reach the database after a newer one from the same
//     editor, or its answer can be lost after it was stored; the server writes
//     it only while no request of this tabId with the same or a later
//     clientSeq has landed, and answers the late copy { success: true, stale:
//     true } (see sendJsonForSave). Retrying under the same number is what
//     keeps a count from being added twice.
export interface EditorSaveRequestBody extends Omit<EditorSavePayload, 'resend'>, EditorSequence {}

/** A local change, before it is addressed to the event. */
type EditorChange = Omit<EditorSavePayload, 'projectId' | 'resend'>;

const isEmptyChange = (change: EditorChange) =>
  Object.keys(change.statsChanges).length === 0 &&
  Object.keys(change.statsIncrements ?? {}).length === 0 &&
  change.hashtags === undefined &&
  change.categorizedHashtags === undefined;

// WHAT: Most stat keys, and most report-text characters, one save request
//     carries. A change past either is split into several saves, and the
//     queue starts a new payload rather than grow one past them.
// WHY: The server refuses a save over MAX_EVENT_STAT_CHANGES keys, and the
//     platform one over its body size limit (413), and a refused payload
//     cannot be sent as it is. Compact Indices on both report slot lists
//     rewrites about a thousand slots, and changes made offline pile up in
//     one payload. Well below both limits.
export const EDITOR_SAVE_MAX_KEYS = Math.min(400, MAX_EVENT_STAT_CHANGES);
export const EDITOR_SAVE_MAX_TEXT = 1_000_000;

const changeKeys = (change: EditorChange) => [
  ...Object.keys(change.statsChanges),
  ...Object.keys(change.statsIncrements ?? {}),
];

function changeTextLength(change: EditorChange): number {
  let length = 0;
  for (const value of Object.values(change.statsChanges)) if (typeof value === 'string') length += value.length;
  for (const tag of change.hashtags ?? []) length += tag.length;
  for (const list of Object.values(change.categorizedHashtags ?? {})) for (const tag of list) length += tag.length;
  return length;
}

// WHAT: May `newer` join `older` in one save request (the queue's canCoalesce)?
export function canMergeEditorSavePayloads(older: EditorSavePayload, newer: EditorSavePayload): boolean {
  // A request sent again under its own tabId and clientSeq must go as it went.
  if (older.resend || newer.resend) return false;
  if (new Set([...changeKeys(older), ...changeKeys(newer)]).size > EDITOR_SAVE_MAX_KEYS) return false;
  return changeTextLength(older) + changeTextLength(newer) <= EDITOR_SAVE_MAX_TEXT;
}

// WHAT: A change with only what PUT /api/projects can store, and the keys left out.
// WHY: One value the server refuses fails the whole save. The editor used to
//     queue whatever a child editor handed it -- Builder mode saved nested
//     [fanmass.x] tokens as flat 'fanmass.x' keys -- and the queue then held
//     every later change behind that refusal. The rules are the server's own
//     (lib/eventSaveRules.ts).
export function writableEditorChange(change: EditorChange): { change: EditorChange; dropped: string[] } {
  const dropped: string[] = [];
  const statsChanges: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(change.statsChanges)) {
    if (isWritableEventStatKey(key) && isWritableEventStatValue(value)) statsChanges[key] = value;
    else dropped.push(key);
  }
  const out: EditorChange = { statsChanges };
  const increments: Record<string, number> = {};
  for (const [key, delta] of Object.entries(change.statsIncrements ?? {})) {
    if (isWritableEventStatKey(key) && isWritableEventStatIncrement(delta)) increments[key] = delta;
    else dropped.push(key);
  }
  if (Object.keys(increments).length > 0) out.statsIncrements = increments;
  if (change.hashtags !== undefined) out.hashtags = change.hashtags;
  if (change.categorizedHashtags !== undefined) out.categorizedHashtags = change.categorizedHashtags;
  return { change: out, dropped };
}

// WHAT: One change as the saves it takes: at most EDITOR_SAVE_MAX_KEYS stat
//     keys and about EDITOR_SAVE_MAX_TEXT report-text characters each (a
//     single longer text goes alone). The hashtag lists go with the first.
export function splitEditorChange(change: EditorChange): EditorChange[] {
  if (changeKeys(change).length <= EDITOR_SAVE_MAX_KEYS && changeTextLength(change) <= EDITOR_SAVE_MAX_TEXT) {
    return [change];
  }
  const parts: EditorChange[] = [];
  let part: EditorChange = { statsChanges: {} };
  let keys = 0;
  let text = 0;
  const startPart = () => {
    if (keys > 0) parts.push(part);
    part = { statsChanges: {} };
    keys = 0;
    text = 0;
  };
  for (const [key, value] of Object.entries(change.statsChanges)) {
    const length = typeof value === 'string' ? value.length : 0;
    if (keys >= EDITOR_SAVE_MAX_KEYS || (keys > 0 && text + length > EDITOR_SAVE_MAX_TEXT)) startPart();
    part.statsChanges[key] = value;
    keys += 1;
    text += length;
  }
  for (const [key, delta] of Object.entries(change.statsIncrements ?? {})) {
    if (keys >= EDITOR_SAVE_MAX_KEYS) startPart();
    part.statsIncrements = { ...(part.statsIncrements ?? {}), [key]: delta };
    keys += 1;
  }
  if (keys > 0) parts.push(part);
  const first = parts[0] ?? { statsChanges: {} };
  if (change.hashtags !== undefined) first.hashtags = change.hashtags;
  if (change.categorizedHashtags !== undefined) first.categorizedHashtags = change.categorizedHashtags;
  if (parts.length === 0) parts.push(first);
  return parts;
}

// WHAT: What the editor stores for an event: the part a draft keeps and a
//     re-fetch may merge. Name, date, partners and style are the server's.
interface EditorContent {
  stats: ProjectStats;
  hashtags: string[];
  categorizedHashtags: CategorizedHashtags;
}

const contentOf = (p: { stats: ProjectStats; hashtags?: string[]; categorizedHashtags?: CategorizedHashtags }): EditorContent => ({
  stats: p.stats || ({} as ProjectStats),
  hashtags: p.hashtags || [],
  categorizedHashtags: p.categorizedHashtags || {},
});

const latestContent = (latest: { project: Project; hashtags: string[]; categorizedHashtags: CategorizedHashtags }) =>
  contentOf({ stats: latest.project.stats, hashtags: latest.hashtags, categorizedHashtags: latest.categorizedHashtags });

// WHAT: Flatten content into independently mergeable fields and back.
// WHY: The draft restore rule (lib/editorSaveQueue.ts, "Unsaved-change
//     drafts") works per field, so two people changing different counters
//     never conflict. Each stat is one field; the hashtag lists are one field
//     each, because they are edited as a whole.
const STAT_FIELD = 'stats:';

function toFields(content: EditorContent): DraftFields {
  const fields: DraftFields = {
    hashtags: content.hashtags || [],
    categorizedHashtags: content.categorizedHashtags || {},
  };
  for (const [key, value] of Object.entries(content.stats || {})) {
    if (value !== undefined) fields[STAT_FIELD + key] = value;
  }
  return fields;
}

// WHAT: The fields as the server stores them once this content is saved: the
//     stats with the totals PUT /api/projects fills in when they are missing
//     (allImages, remoteFans, totalFans -- lib/dataValidator ensureDerivedMetrics).
// WHY: Every comparison between this device and the server (draft restore,
//     re-fetch merge) runs on these. Comparing the raw payload instead made the
//     server's own fill-in look like someone else's change: after a confirmed
//     save the server held remoteFans while the payload (the new base) did not,
//     so the next remote-fans click turned into a false conflict.
function toDraftFields(content: EditorContent): DraftFields {
  return toFields({
    ...content,
    stats: ensureDerivedMetrics((content.stats || {}) as never) as unknown as ProjectStats,
  });
}

function fromFields(fields: DraftFields): EditorContent {
  const stats: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith(STAT_FIELD) && value !== undefined) stats[key.slice(STAT_FIELD.length)] = value;
  }
  const categorized = fields.categorizedHashtags;
  return {
    stats: stats as ProjectStats,
    hashtags: Array.isArray(fields.hashtags) ? (fields.hashtags as string[]) : [],
    categorizedHashtags:
      categorized && typeof categorized === 'object' && !Array.isArray(categorized)
        ? (categorized as CategorizedHashtags)
        : {},
  };
}

// WHAT: The stats one change made: each key whose value differs between
//     `prev` and `next`, with its new value, or null where `next` removed it.
export function statsChangesBetween(
  prev: Record<string, unknown>,
  next: Record<string, unknown>
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])) {
    const value = next?.[key];
    if (sameFieldValue(value, prev?.[key])) continue;
    changes[key] = value === undefined ? null : value;
  }
  return changes;
}

// WHAT: Two unconfirmed payloads as one: every stat either names, the newer
//     value where both do, counts added up, and each hashtag list from the
//     newer payload that has one. A value followed by a count is that value
//     counted on; a count followed by a value is the value. A count that adds
//     up to nothing is left out.
// WHY: The queue coalesces with this (createSaveQueue `coalesce`): a pending
//     change and the next one. Replacing instead would drop the older change
//     -- a click on one counter, then another, would save only the second.
export function mergeEditorSavePayloads(older: EditorSavePayload, newer: EditorSavePayload): EditorSavePayload {
  const statsChanges: Record<string, unknown> = { ...older.statsChanges };
  const increments: Record<string, number> = { ...(older.statsIncrements ?? {}) };
  for (const [key, value] of Object.entries(newer.statsChanges)) {
    statsChanges[key] = value;
    delete increments[key];
  }
  for (const [key, delta] of Object.entries(newer.statsIncrements ?? {})) {
    if (Object.prototype.hasOwnProperty.call(statsChanges, key)) {
      const value = statsChanges[key];
      statsChanges[key] = (typeof value === 'number' ? value : 0) + delta;
    } else {
      increments[key] = (increments[key] ?? 0) + delta;
    }
  }
  const merged: EditorSavePayload = { projectId: newer.projectId, statsChanges };
  for (const key of Object.keys(increments)) if (increments[key] === 0) delete increments[key];
  if (Object.keys(increments).length > 0) merged.statsIncrements = increments;
  const hashtags = newer.hashtags ?? older.hashtags;
  if (hashtags !== undefined) merged.hashtags = hashtags;
  const categorized = newer.categorizedHashtags ?? older.categorizedHashtags;
  if (categorized !== undefined) merged.categorizedHashtags = categorized;
  return merged;
}

// WHAT: The change that turns `base` (the content the server is known to
//     hold) into `content`: each draft field that differs.
// WHY: For content that did not come from one change on this page: drafts
//     restored on load, which may hold many values. Compared as toDraftFields,
//     like every comparison with the server, so a total the server fills in
//     never reads as a change.
function changesFromBase(content: EditorContent, base: DraftFields): EditorChange {
  const fields = toDraftFields(content);
  const change: EditorChange = { statsChanges: {} };
  for (const key of new Set([...Object.keys(base), ...Object.keys(fields)])) {
    if (sameFieldValue(fields[key], base[key])) continue;
    if (key.startsWith(STAT_FIELD)) {
      change.statsChanges[key.slice(STAT_FIELD.length)] = fields[key] === undefined ? null : fields[key];
    } else if (key === 'hashtags') {
      change.hashtags = content.hashtags || [];
    } else if (key === 'categorizedHashtags') {
      change.categorizedHashtags = content.categorizedHashtags || {};
    }
  }
  return change;
}

// WHAT: The draft fields a payload sets as values (its counts left out), with
//     undefined for a removed stat.
// WHY: What the draft records as sent: the restore rule's own-write shortcut
//     is for values only. A counted stat's number is the base plus the count;
//     the server can hold that same number because another device counted,
//     and taking it for this device's write turned the next count into a
//     value that overwrote the other device's taps.
function payloadValueFields(payload: EditorChange): DraftFields {
  const fields: DraftFields = {};
  for (const [stat, value] of Object.entries(payload.statsChanges)) {
    fields[STAT_FIELD + stat] = value === null ? undefined : value;
  }
  if (payload.hashtags !== undefined) fields.hashtags = payload.hashtags;
  if (payload.categorizedHashtags !== undefined) fields.categorizedHashtags = payload.categorizedHashtags;
  return fields;
}

// WHAT: The draft fields a payload names: its values (payloadValueFields),
//     and a counted stat as the base value counted on by the payload's count.
// WHY: What the base moves to once the server confirms the payload -- for
//     exactly these keys. For a count, the server's value is the base value
//     plus the count only while nobody else counted meanwhile; either way the
//     next re-fetch with nothing unsaved takes the server's value.
function payloadFields(payload: EditorChange, base: DraftFields): DraftFields {
  const fields = payloadValueFields(payload);
  for (const [stat, delta] of Object.entries(payload.statsIncrements ?? {})) {
    const before = base[STAT_FIELD + stat];
    fields[STAT_FIELD + stat] = (typeof before === 'number' ? before : 0) + delta;
  }
  return fields;
}

// WHAT: The counts the save queue holds, as the draft keeps them (COUNTS in
//     lib/editorSaveQueue.ts): the counts of a request that went out without
//     an answer, under the tabId and clientSeq it went out under, and every
//     other count added up per stat.
// WHY: The draft used to keep only the number on screen, so a reload sent
//     back base-plus-taps as a value, over whatever other devices counted
//     since. A stat some waiting payload sets is left out: the operator typed
//     its value (counted on by later taps), which the draft keeps in its
//     fields, and taps before it are overwritten by it anyway.
// HOW: `own` is the sequence this tab sent its last request under. The one
//     payload whose outcome is unknown (`sent`) went out under it, unless it
//     is a resend, which names its own.
export function draftCountsOfQueue(
  entries: Array<{ payload: EditorSavePayload; attempt: SaveAttempt; sent: boolean }>,
  own: EditorSequence & { attemptId: number }
): { counts: DraftCounts; outstanding: OutstandingCounts[] } {
  const setStats = new Set<string>();
  for (const { payload } of entries) for (const stat of Object.keys(payload.statsChanges)) setStats.add(stat);
  const counts: DraftCounts = {};
  const outstanding: OutstandingCounts[] = [];
  for (const { payload, attempt, sent } of entries) {
    const picked: DraftCounts = {};
    for (const [stat, delta] of Object.entries(payload.statsIncrements ?? {})) {
      if (!setStats.has(stat) && delta !== 0) picked[STAT_FIELD + stat] = delta;
    }
    if (Object.keys(picked).length === 0) continue;
    const sequence =
      payload.resend ??
      (sent && attempt.id === own.attemptId ? { tabId: own.tabId, clientSeq: own.clientSeq } : null);
    if (sequence) {
      outstanding.push({ tabId: sequence.tabId, clientSeq: sequence.clientSeq, counts: picked });
    } else {
      for (const [key, delta] of Object.entries(picked)) counts[key] = (counts[key] ?? 0) + delta;
    }
  }
  for (const key of Object.keys(counts)) if (counts[key] === 0) delete counts[key];
  return { counts, outstanding };
}

// WHAT: The draft fields of the stats counted by a request whose outcome is
//     unknown: the one out without an answer (or failed and waiting to go
//     again under the same clientSeq), and a restored request sent again
//     under its own sequence (RESEND at EditorSavePayload).
// WHY: Such a request may be stored already, so a copy loaded meanwhile may
//     or may not hold its counts, and nothing in the copy tells which. Added
//     on top of it, a written but unanswered +3 showed 16 for a stat the
//     server held at 13, and once the answer came the base moved on from 13
//     as well (see applyServerCopy).
function maybeStoredCountFields(entries: Array<{ payload: EditorSavePayload; sent: boolean }>): Set<string> {
  const fields = new Set<string>();
  for (const { payload, sent } of entries) {
    if (!sent && !payload.resend) continue;
    for (const [stat, delta] of Object.entries(payload.statsIncrements ?? {})) {
      if (delta !== 0) fields.add(STAT_FIELD + stat);
    }
  }
  return fields;
}

// WHAT: A draft without fields for stats this editor cannot store.
// WHY: A draft written before the editor filtered them (Builder mode stored
//     'stats:fanmass.peopleCount') put the value back on every load, and the
//     save it queued was refused every time. A count the server would refuse
//     is dropped the same way.
function writableDraft(draft: StoredDraft): StoredDraft {
  const keep = (key: string) => !key.startsWith(STAT_FIELD) || isWritableEventStatKey(key.slice(STAT_FIELD.length));
  const pick = <T,>(source: Record<string, T>): Record<string, T> => {
    const out: Record<string, T> = {};
    for (const [key, value] of Object.entries(source)) if (keep(key)) out[key] = value;
    return out;
  };
  const pickCounts = (source: DraftCounts): DraftCounts => {
    const out: DraftCounts = {};
    for (const [key, delta] of Object.entries(source)) {
      if (key.startsWith(STAT_FIELD) && keep(key) && isWritableEventStatIncrement(delta)) out[key] = delta;
    }
    return out;
  };
  const cleaned: StoredDraft = { ...draft, base: pick(draft.base), fields: pick(draft.fields) };
  if (draft.sent) cleaned.sent = pick(draft.sent);
  if (draft.counts) cleaned.counts = pickCounts(draft.counts);
  if (draft.outstanding) cleaned.outstanding = draft.outstanding.map((out) => ({ ...out, counts: pickCounts(out.counts) }));
  return cleaned;
}

// WHAT: Values from this device's drafts that were NOT restored because the
//     server changed the same values since they were made (another tab, an
//     admin, a sheet pull). Every other value of those drafts was restored.
//     Kept in storage until the operator picks a side.
interface DraftConflictItem {
  /** Draft field, e.g. `stats:female`. */
  key: string;
  /** This device's value (the newest draft's, when several hold one). */
  local: unknown;
  /** The server's value at load. */
  server: unknown;
}

interface DraftConflict {
  items: DraftConflictItem[];
  /** The drafts, each narrowed to its held-back fields (see planDraftRestore). */
  held: HeldBackDraft[];
  /** Newest local edit among the drafts (this device's clock). */
  editedAt: number;
}

// WHAT: What the read-only notice says about the drafts a read-only load left
//     on this device: only those that hold something the server lacks.
export interface KeptDrafts {
  /** Newest local edit among those drafts (this device's clock). */
  editedAt: number;
  /** Some of their values are put back as they are once editing is possible. */
  restores: boolean;
  /** Values also changed on the server since: the operator chooses once editing is possible. */
  heldBack: number;
}

// WHY: Measured by the same rule a load with save access applies
//     (planDraftRestore), so the notice never promises back values the server
//     already holds -- e.g. a save whose answer was lost when the tab closed --
//     and does not call a value "restored" that will be held back for a choice.
function summarizeKeptDrafts(plan: DraftRestorePlan): KeptDrafts | null {
  const unsaved = [...plan.adopted, ...plan.conflicted.map((c) => c.draft)];
  if (unsaved.length === 0) return null;
  return {
    editedAt: Math.max(...unsaved.map((d) => d.editedAt)),
    restores: plan.restored.length > 0,
    heldBack: new Set(plan.conflicted.flatMap((c) => c.conflicts)).size,
  };
}

interface EditorBootstrap {
  project: Project;
  hashtags: string[];
  categorizedHashtags: CategorizedHashtags;
  /** Newest editedAt of the drafts that put back a value, or null when none did. */
  restoredDraftAt: number | null;
  /** Drafts merged into the initial state; removed once this tab stores its own. */
  adopted: StoredDraft[];
  /** Drafts with nothing the server lacks; removed on mount. */
  obsolete: StoredDraft[];
  conflict: DraftConflict | null;
  /** Read-only load: this device holds drafts for the event, left untouched until editing is possible. */
  draftsLeft: boolean;
  /** Read-only load: what the notice says about them, or null when none holds anything unsaved. */
  kept: KeptDrafts | null;
  /** Restored counts never sent, per stat: sent as counts (statsIncrements). */
  counts: Record<string, number>;
  /** Restored requests whose answer was lost: sent again under their own tabId and clientSeq. */
  resends: Array<EditorSequence & { increments: Record<string, number> }>;
  /**
   * Each stat shown with restored counts on top: its value without them,
   * which is what is compared with the server to find a value to send.
   */
  countedValues: Record<string, unknown>;
}

// Draft-field counts (`stats:female`) as stat counts (`female`).
function statCounts(counts: DraftCounts): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, delta] of Object.entries(counts)) {
    if (key.startsWith(STAT_FIELD)) out[key.slice(STAT_FIELD.length)] = delta;
  }
  return out;
}

// WHAT: Initial editor state: the server copy, plus every unsaved value from
//     this device's drafts that can be put back without overwriting a later
//     change, and every unsaved count added to the server's value.
// WHY: See the RESTORE RULE and COUNTS in lib/editorSaveQueue.ts. In short,
//     per value: a value a draft changed is restored when the server still
//     has the value the draft started from (or one this device sent); a value
//     changed on both sides waits for the operator, and only that value
//     waits. A count is never a value: it is added to whatever the server
//     holds, other devices' taps included, and never waits.
// READ-ONLY: When the server says this caller cannot save, nothing is restored
//     and the drafts stay as they are: they could not be saved from here, and
//     unsaved numbers shown in a view that cannot change them would read as the
//     event's stored values. The restore is only planned, for the notice
//     (summarizeKeptDrafts); it runs once the editor may save.
function bootstrapFromServer(server: Project, readOnly: boolean): EditorBootstrap {
  const plain: EditorBootstrap = {
    project: server,
    hashtags: server.hashtags || [],
    categorizedHashtags: server.categorizedHashtags || {},
    restoredDraftAt: null,
    adopted: [],
    obsolete: [],
    conflict: null,
    draftsLeft: false,
    kept: null,
    counts: {},
    resends: [],
    countedValues: {},
  };
  const drafts = readDrafts(getDraftStorage(), server._id).map(writableDraft);
  if (drafts.length === 0) return plain;

  const serverFields = toDraftFields(contentOf(server));
  const plan = planDraftRestore(serverFields, drafts);
  if (readOnly) return { ...plain, draftsLeft: true, kept: summarizeKeptDrafts(plan) };
  let conflict: DraftConflict | null = null;
  if (plan.conflicted.length > 0) {
    const byKey = new Map<string, DraftConflictItem>();
    for (const { draft, conflicts } of plan.conflicted) {
      // Oldest draft first, so the newest local value of a field wins.
      for (const key of conflicts) byKey.set(key, { key, local: draft.fields[key], server: serverFields[key] });
    }
    conflict = {
      items: Array.from(byKey.values()),
      held: plan.conflicted,
      editedAt: Math.max(...plan.conflicted.map((c) => c.draft.editedAt)),
    };
  }
  // Nothing to send: no value differs, no count waits.
  if (plan.restoredEditedAt === null) return { ...plain, obsolete: plan.obsolete, conflict };

  const content = fromFields(plan.fields);
  const countedValues: Record<string, unknown> = {};
  for (const key of Object.keys({ ...plan.fields, ...plan.values })) {
    if (key.startsWith(STAT_FIELD) && !sameFieldValue(plan.fields[key], plan.values[key])) {
      countedValues[key.slice(STAT_FIELD.length)] = plan.values[key];
    }
  }
  return {
    project: { ...server, ...content },
    hashtags: content.hashtags,
    categorizedHashtags: content.categorizedHashtags,
    restoredDraftAt: plan.restoredEditedAt,
    adopted: plan.adopted,
    obsolete: plan.obsolete,
    conflict,
    draftsLeft: false,
    kept: null,
    counts: statCounts(plan.counts),
    resends: plan.outstanding.map((out) => ({ tabId: out.tabId, clientSeq: out.clientSeq, increments: statCounts(out.counts) })),
    countedValues,
  };
}

// WHAT: The saves a restored bootstrap needs, in the order they go: each
//     request whose answer was lost, again under its own tabId and clientSeq;
//     then every value that differs from the base (a counted stat at its
//     value without the counts) together with the counts never sent.
// WHY: A count restored as the number on screen was sent as a value and
//     overwrote what other devices counted meanwhile. A value and a count of
//     the same stat (an older draft typed it, a newer one tapped on) go as
//     that value counted on, one save naming it once (mergeEditorSavePayloads).
function restoredSaves(boot: EditorBootstrap, content: EditorContent, base: DraftFields): EditorSavePayload[] {
  const projectId = boot.project._id;
  const saves: EditorSavePayload[] = [];
  for (const resend of boot.resends) {
    const { change } = writableEditorChange({ statsChanges: {}, statsIncrements: resend.increments });
    if (!change.statsIncrements) continue;
    saves.push({
      projectId,
      statsChanges: {},
      statsIncrements: change.statsIncrements,
      resend: { tabId: resend.tabId, clientSeq: resend.clientSeq },
    });
  }
  const stats: Record<string, unknown> = { ...content.stats };
  for (const [stat, value] of Object.entries(boot.countedValues)) {
    if (value === undefined) delete stats[stat];
    else stats[stat] = value;
  }
  const values = changesFromBase({ ...content, stats: stats as ProjectStats }, base);
  const merged = mergeEditorSavePayloads(
    { projectId, ...values },
    { projectId, statsChanges: {}, statsIncrements: boot.counts }
  );
  const { change } = writableEditorChange(merged);
  if (!isEmptyChange(change)) for (const part of splitEditorChange(change)) saves.push({ projectId, ...part });
  return saves;
}

// WHAT: What the conflict notice calls a draft field, and how it shows a value.
const HASHTAG_FIELD_LABELS: Record<string, string> = {
  hashtags: 'Hashtags',
  categorizedHashtags: 'Category hashtags',
};

const statKeyOf = (name: string) => (name.startsWith('stats.') ? name.slice(6) : name);

function formatFieldValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return 'empty';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value.length > 40 ? `"${value.slice(0, 37)}..."` : `"${value}"`;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value.length ? value.join(', ') : 'empty';
  return null; // nested values: named, not shown
}

function conflictFieldLabel(key: string, variables: VariableWithFlags[]): string {
  if (HASHTAG_FIELD_LABELS[key]) return HASHTAG_FIELD_LABELS[key];
  const name = key.startsWith(STAT_FIELD) ? key.slice(STAT_FIELD.length) : key;
  return variables.find((v) => statKeyOf(v.name) === name)?.label || name;
}

// e.g. "Female: this device 412, saved 400"; a nested value is only named.
function describeConflictItem(item: DraftConflictItem, variables: VariableWithFlags[]): string {
  const label = conflictFieldLabel(item.key, variables);
  const local = formatFieldValue(item.local);
  const server = formatFieldValue(item.server);
  return local === null || server === null ? label : `${label}: this device ${local}, saved ${server}`;
}

const IDLE_SAVE_SNAPSHOT: SaveQueueSnapshot = {
  state: 'idle',
  pendingCount: 0,
  lastError: null,
  lastSavedAt: null,
  nextRetryAt: null,
  failedAttempts: 0,
  rejectedCount: 0,
};

function useSaveSnapshot(queue: SaveQueue<EditorSavePayload> | null): SaveQueueSnapshot {
  const subscribe = useCallback(
    (onChange: () => void) => (queue ? queue.subscribe(onChange) : () => {}),
    [queue]
  );
  const getSnapshot = useCallback(() => (queue ? queue.getSnapshot() : IDLE_SAVE_SNAPSHOT), [queue]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const changeCount = (n: number) => `${n} ${n === 1 ? 'change' : 'changes'}`;
const formatEditTime = (ms: number) => new Date(ms).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
const asSentence = (text: string) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);
const isSaveProblem = (s: SaveQueueSnapshot) =>
  s.state === 'retrying' || s.state === 'offline' || s.state === 'needs-access' || s.state === 'rejected';

const PROBLEM_LABELS: Partial<Record<SaveQueueSnapshot['state'], string>> = {
  retrying: 'Not saved - retrying',
  offline: 'Not saved - offline',
  'needs-access': 'Not saved - access needed',
  rejected: 'Not saved - refused by the server',
};

// WHAT: The header status line. Stays on "Not saved" until a save succeeds.
// WHY: The old line showed "Save Error" for 3 s and then "Ready" while nothing
//     had been stored -- the operator could not tell anything was wrong.
// HOW: Its own component subscribed to the queue, so status changes re-render
//     only this line and not the whole editor.
// ACCESSIBILITY: The visible line is not a live region: it changes on every
//     click (Saving/Saved, the change count). A hidden live region announces
//     only when saving starts failing, changes how it fails, or recovers.
// READ-ONLY: Says so instead of "Ready" or "Saved", which read as "go ahead".
export function EditorSaveStatusLine({
  queue,
  readOnly = false,
}: {
  queue: SaveQueue<EditorSavePayload> | null;
  readOnly?: boolean;
}) {
  const s = useSaveSnapshot(queue);
  const problem = PROBLEM_LABELS[s.state];
  const label = (() => {
    switch (s.state) {
      case 'saving':
        return '💾 Saving...';
      case 'saved':
        return readOnly ? '🔒 Read-only' : '✅ Saved';
      case 'retrying':
      case 'offline':
        return `❌ ${problem} (${changeCount(s.pendingCount)})`;
      case 'rejected':
        return `❌ ${problem} (${changeCount(s.rejectedCount)})`;
      case 'needs-access':
        return `🔒 ${problem} (${changeCount(s.pendingCount)})`;
      default:
        return readOnly ? '🔒 Read-only' : '📝 Ready';
    }
  })();

  const [announcement, setAnnouncement] = useState('');
  const hadProblemRef = useRef(false);
  useEffect(() => {
    if (problem) {
      setAnnouncement(problem);
      hadProblemRef.current = true;
    } else if (hadProblemRef.current && s.state === 'saved') {
      setAnnouncement('Saved');
      hadProblemRef.current = false;
    }
  }, [problem, s.state]);

  return (
    <>
      <p className={`admin-status ${problem ? styles.saveStatusProblem : ''}`}>{label}</p>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </>
  );
}

// WHAT: The manual Save button (Manual and Builder modes). It flushes the queue.
// WHY: Stays enabled while saving: pressing it skips the debounce, and the queue
//     never sends two requests at once, so a double press cannot race.
//     Disabled (not hidden) in a read-only editor, next to the notice that says why.
function EditorSaveButton({
  queue,
  disabled,
  onSaveNow,
}: {
  queue: SaveQueue<EditorSavePayload> | null;
  disabled: boolean;
  onSaveNow: () => void;
}) {
  const s = useSaveSnapshot(queue);
  return (
    <button type="button" onClick={onSaveNow} disabled={disabled} className="btn btn-small btn-primary btn-full mt-2">
      {s.state === 'saving' ? '💾 Saving...' : '💾 Save'}
    </button>
  );
}

// The read-only notice's sentence about the drafts a read-only load kept.
function keptDraftsText(kept: KeptDrafts): string {
  const intro = `Unsaved changes from this device (last edit ${formatEditTime(kept.editedAt)}) are kept`;
  if (kept.heldBack === 0) return ` ${intro} and restored once you can edit.`;
  const changed = `${kept.heldBack === 1 ? '1 value was' : `${kept.heldBack} values were`} also changed on the server since`;
  return kept.restores
    ? ` ${intro} and restored once you can edit. ${changed}; you choose which to keep then.`
    : ` ${intro}. ${changed}; you choose which to keep once you can edit.`;
}

// WHAT: The notice at the top of a read-only editor (the server says this
//     caller cannot save): what is wrong, what to do, and what happens to
//     changes this device has not saved.
// WHY: The 2026-09-27 operator never noticed a status that flashed "Save
//     Error"; a read-only editor states it before anything else on the page.
// HOW: First element of the editor and pinned with position: sticky, so it
//     stays in view over the clicker grid. The count comes from the save
//     queue: edits made before access was lost stay queued and in the draft,
//     and are sent once access returns. `kept` is set when the editor loaded
//     read-only and left drafts on this device that hold unsaved values (see
//     summarizeKeptDrafts); values also changed on the server since are named
//     as a choice to come, not as restored. Retry now re-checks access (the
//     queue's needs-access path) when there is something to save. Also
//     replaces the bottom save banner, which would repeat the same message.
export function EditorReadOnlyNotice({
  queue,
  draftStored,
  kept,
  onRetryNow,
}: {
  queue: SaveQueue<EditorSavePayload> | null;
  draftStored: boolean;
  kept: KeptDrafts | null;
  onRetryNow: () => void;
}) {
  const s = useSaveSnapshot(queue);
  const unsaved = s.pendingCount;
  const unsavedIs = `${unsaved} unsaved ${unsaved === 1 ? 'change is' : 'changes are'}`;
  return (
    <div className={`alert alert-warning ${styles.readOnlyNotice}`} role="alert">
      <p className={styles.bannerText}>
        <strong>You can view this event but not save changes.</strong> Open the event edit link or sign in to edit.
        {unsaved > 0 &&
          (draftStored
            ? ` ${unsavedIs} kept on this device and saved once you can edit.`
            : ` ${unsavedIs} only on this page - do not close or reload it.`)}
        {kept !== null && keptDraftsText(kept)}
      </p>
      {unsaved > 0 && (
        <button type="button" className="btn btn-small btn-primary" onClick={onRetryNow}>
          Retry now
        </button>
      )}
    </div>
  );
}

// WHAT: Pinned banner while saves are failing, with a Retry now button.
// WHY: The header scrolls away; an operator working deep in the clicker grid
//     must still see that nothing is being stored and what happens next.
// HOW: Rendered as the last element of the editor and pinned with position:
//     sticky, so it stays in view while scrolling but also takes up its own
//     space at the end -- the last row of cards is never stuck underneath it.
//     Not a live region: its count changes on every click, and the status
//     line's hidden announcement already reports the failure once.
export function EditorSaveProblemBanner({
  queue,
  draftStored,
  accessBlocked,
  onRetryNow,
}: {
  queue: SaveQueue<EditorSavePayload> | null;
  draftStored: boolean;
  /** Access re-check said this page cannot save: automatic retries have stopped. */
  accessBlocked: boolean;
  onRetryNow: () => void;
}) {
  const s = useSaveSnapshot(queue);
  if (!isSaveProblem(s)) return null;
  const blocked = s.state === 'needs-access' && accessBlocked;
  const reason =
    s.state === 'offline'
      ? 'No connection to the server.'
      : blocked
        ? 'This link cannot save changes.'
        : asSentence(s.lastError || (s.state === 'needs-access' ? 'Access to save was refused' : 'The server did not accept the save'));
  const where = draftStored ? 'Kept on this device' : 'Only on this page - do not close or reload it';
  // A refusal is not retried automatically: the same save would be refused
  // again. Other changes keep saving meanwhile, so only the refused ones count.
  const next =
    s.state === 'offline'
      ? 'sending when the connection is back'
      : blocked
        ? 'open the event edit link or sign in, then press Retry now'
        : s.state === 'needs-access'
          ? 'sending once access is confirmed'
          : s.state === 'rejected'
            ? 'not sent again until you press Retry now'
            : 'retrying automatically';
  const notSaved = s.state === 'rejected' ? s.rejectedCount : s.pendingCount;
  return (
    <div className={`alert alert-danger ${styles.saveBanner}`}>
      <p className={styles.bannerText}>
        <strong>Not saved ({changeCount(notSaved)}).</strong> {reason} {where}; {next}.
      </p>
      <button type="button" className="btn btn-small btn-primary" onClick={onRetryNow}>
        Retry now
      </button>
    </div>
  );
}

// WHAT: The clicker card and the manual-entry card, defined at module level.
// WHY: They used to be components declared inside EditorDashboard, so every
//     render created new component types and React replaced every card's DOM.
//     In Manual mode the blur of one field saves and re-renders the editor,
//     which replaced the field the operator had just tabbed or tapped into: it
//     lost focus, the phone keyboard closed, and the next number typed went
//     nowhere. Stable types keep the same input elements across renders.
function EditorStatCard({
  label,
  value,
  readOnly,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  readOnly: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div
      className={`stat-card stat-card-accent ${readOnly ? 'stat-card-readonly' : 'stat-card-clickable'}`}
      onClick={readOnly ? undefined : onIncrement}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        disabled={readOnly || value === 0}
        className="btn btn-small btn-danger stat-decrement"
      >
        -1
      </button>
    </div>
  );
}

function EditorNumberCard({
  label,
  value,
  variableType,
  readOnly,
  onSave,
}: {
  label: string;
  value: number;
  variableType?: VariableWithFlags['type'];
  readOnly: boolean;
  onSave: (value: number) => void;
}) {
  // Percentage, numeric and currency values take decimals (45.5%, 3.14, 99.99).
  const allowDecimal = variableType === 'percentage' || variableType === 'numeric' || variableType === 'currency';
  return (
    <div className="input-card flex-row gap-4">
      <UnifiedNumberInput
        value={value}
        onSave={onSave}
        className="form-input w-120"
        min={0}
        allowDecimal={allowDecimal}
        step={allowDecimal ? 0.01 : 1}
        disabled={readOnly}
      />
      <div className="form-label flex-1">{label}</div>
    </div>
  );
}

// Stored report slots of one kind (reportImageN / reportTextN), by slot number.
function reportSlots(stats: ProjectStats, prefix: 'reportImage' | 'reportText'): Array<{ index: number; value: string }> {
  const pattern = new RegExp(`^${prefix}([1-9]\\d*)$`);
  const slots: Array<{ index: number; value: string }> = [];
  for (const [key, value] of Object.entries(stats || {})) {
    const match = pattern.exec(key);
    if (match && typeof value === 'string' && value.length > 0) slots.push({ index: Number(match[1]), value });
  }
  return slots.sort((a, b) => a.index - b.index);
}

// WHAT: Report Content in a read-only editor: every stored image and text slot,
//     one list after the other, with nothing to press.
// WHY: ReportContentManager shows the texts only behind its Images/Texts tab
//     switch, and the disabled fieldset turns that switch off with the rest of
//     its buttons, so a read-only viewer could never see the texts. It has no
//     read-only mode that keeps the switch but turns off its upload, swap,
//     compact and clear controls, so this view takes its place while the editor
//     cannot save. With no controls, the fieldset hides nothing in it.
// HOW: ReportContentManager's slot layout and styles (its CSS module).
function EditorReportContentView({ stats }: { stats: ProjectStats }) {
  const images = reportSlots(stats, 'reportImage');
  const texts = reportSlots(stats, 'reportText');
  return (
    <div className={reportStyles.container}>
      <div className={reportStyles.section}>
        <div className={reportStyles.sectionHeader}>
          <h3 className={reportStyles.sectionTitle}>Images ({images.length})</h3>
        </div>
        {images.length === 0 ? (
          <p className={reportStyles.note}>No images.</p>
        ) : (
          <div className={reportStyles.grid}>
            {images.map(({ index, value }) => (
              <div key={index} className={reportStyles.card}>
                <div className={reportStyles.cardHeader}>
                  <span className={reportStyles.slotBadge}>reportImage{index}</span>
                </div>
                <Image src={value} alt={`reportImage${index}`} className={reportStyles.thumb} width={320} height={180} unoptimized />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={reportStyles.section}>
        <div className={reportStyles.sectionHeader}>
          <h3 className={reportStyles.sectionTitle}>Texts ({texts.length})</h3>
        </div>
        {texts.length === 0 ? (
          <p className={reportStyles.note}>No texts.</p>
        ) : (
          <div className={reportStyles.grid}>
            {texts.map(({ index, value }) => (
              <div key={index} className={reportStyles.card}>
                <div className={reportStyles.cardHeader}>
                  <span className={reportStyles.slotBadge}>reportText{index}</span>
                </div>
                <p className={styles.slotText}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// WHAT: Report Content in the editor: the view with no controls while it is
//     read-only, and ReportContentManager -- hidden, not unmounted, while
//     read-only once it has been shown (see contentManagerMounted).
function EditorReportContent({
  stats,
  readOnly,
  editorMounted,
  onCommit,
}: {
  stats: ProjectStats;
  readOnly: boolean;
  editorMounted: boolean;
  onCommit: (next: Record<string, unknown>) => void;
}) {
  return (
    <>
      {readOnly && <EditorReportContentView stats={stats} />}
      {editorMounted && (
        <div hidden={readOnly}>
          <ReportContentManager stats={stats as Record<string, unknown>} onCommit={onCommit} />
        </div>
      )}
    </>
  );
}

export default function EditorDashboard({
  project: initialProject,
  fetchStartedAt,
  onRequestAccess,
  canSave,
  onReload,
}: EditorDashboardProps) {
  // WHAT: Read-only when the server says this caller cannot save (canSave:
  //     false): every input is disabled and the notice at the top says why.
  // WHY: The 2026-09-27 operator typed for hours into an editor whose every
  //     save was refused. An editor that cannot save must not take input.
  // HOW: Derived from the newest load on every render, never latched: a
  //     re-fetch that answers canSave: true (or the password prompt being
  //     passed, which re-loads) makes the editor editable again in place.
  //     Input is stopped where it enters -- disabled controls, and the user
  //     actions below that check readOnlyRef. The commit paths themselves
  //     record whatever reaches them, so an upload or a field left after the
  //     switch lands in the draft and the queue instead of being dropped.
  const readOnly = canSave === false;
  // For the user actions that check it (sheet pull and push, the draft
  // conflict choice): current at call time, not at the render they came from.
  const readOnlyRef = useRef<boolean>(readOnly);
  readOnlyRef.current = readOnly;

  // WHAT: Report Content's editor stays mounted (hidden) once it has been
  //     shown, when the editor turns read-only partway through a session.
  // WHY: Its report text boxes are uncontrolled and recorded on blur, and its
  //     bulk-paste box on "Add Lines"; unmounting them for the read-only view
  //     threw away whatever was typed there. The edit page commits the field
  //     being edited before the switch (commitFocusedField in
  //     app/edit/[slug]/page.tsx); anything else typed stays on screen,
  //     hidden, until editing resumes. A load that is read-only from the start
  //     never mounts it. Same rule as the partner editor.
  const [contentManagerMounted, setContentManagerMounted] = useState<boolean>(!readOnly);
  if (!readOnly && !contentManagerMounted) setContentManagerMounted(true);

  // The editor's outermost element: a focused field inside it is committed
  // before the page is closed or hidden (see the leave/hide effect below).
  const rootRef = useRef<HTMLDivElement | null>(null);

  // WHAT: Initial state: the server copy with this device's restorable unsaved
  //     drafts put back (see bootstrapFromServer). Computed once; the effect
  //     below handles later re-fetches.
  const [bootstrap] = useState<EditorBootstrap>(() => bootstrapFromServer(initialProject, readOnly));
  // WHAT: This editor instance's id: its draft key (one per tab, so tabs never
  //     overwrite each other's drafts), and the tabId of its saves, which the
  //     server's late-write guard orders by clientSeq.
  // WHY: New for every editor instance and kept only in memory. An id kept in
  //     sessionStorage would outlive a reload with its counter reset (every
  //     save of the reloaded page would then count as stale), and a
  //     duplicated tab copies sessionStorage: two live editors sharing one id
  //     could each have a save answered "stale" -- counted as done -- because
  //     of the other's.
  const [tabId] = useState<string>(createTabId);
  // clientSeq of the last request sent; one higher on every request, retries included.
  const clientSeqRef = useRef<number>(0);
  // The attempt id of the last request this tab sent under its own tabId, and
  // the clientSeq it went out under (a retry of it repeats both). Kept per
  // queue: the draft names that request's sequence while its answer is missing.
  const lastAttemptRef = useRef<{ id: number; clientSeq: number }>({ id: 0, clientSeq: 0 });
  // WHAT: What a disposed save queue still held, for the queue that replaces
  //     it on the same event (React runs the queue effect twice on mount in
  //     development, and again if its inputs change).
  // WHY: The restored saves go into the first queue, which sends one of them
  //     as it is torn down. Queued again from the bootstrap, a count it sent
  //     would be counted twice; dropped, one it did not send would be lost.
  const carryOverRef = useRef<{ projectId: string; saves: EditorSavePayload[] } | null>(null);
  const [project, setProject] = useState<Project>(bootstrap.project);
  const [hashtags, setHashtags] = useState<string[]>(bootstrap.hashtags);
  const [categorizedHashtags, setCategorizedHashtags] = useState<CategorizedHashtags>(bootstrap.categorizedHashtags);
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(bootstrap.restoredDraftAt);
  const [draftConflict, setDraftConflict] = useState<DraftConflict | null>(bootstrap.conflict);
  // Drafts a read-only load left on this device, restored once saving is possible
  // (the ref), and what the read-only notice says about them (the state).
  const draftsLeftRef = useRef<boolean>(bootstrap.draftsLeft);
  const [keptDrafts, setKeptDrafts] = useState<KeptDrafts | null>(bootstrap.kept);
  const [draftStored, setDraftStored] = useState<boolean>(true);
  // The access re-check answered "this page cannot save": automatic retries stopped.
  const [accessBlocked, setAccessBlocked] = useState<boolean>(false);
  const [saveQueue, setSaveQueue] = useState<SaveQueue<EditorSavePayload> | null>(null);
  const [editMode, setEditMode] = useState<'clicker' | 'manual' | 'builder'>('clicker'); // Edit mode: clicker, manual, or builder

  // WHAT: The newest local data, written synchronously on every change.
  // WHY: React state only catches up on the next render. Handlers and the save
  //     queue read this so a change always builds on the previous one, even when
  //     several arrive before a re-render.
  const latestRef = useRef<{ project: Project; hashtags: string[]; categorizedHashtags: CategorizedHashtags }>({
    project: bootstrap.project,
    hashtags: bootstrap.hashtags,
    categorizedHashtags: bootstrap.categorizedHashtags,
  });
  // True from a local change until the server confirms a save that includes it.
  const hasUnsavedRef = useRef<boolean>(bootstrap.restoredDraftAt !== null);
  // WHEN the base last moved to a confirmed save. A re-fetch that left before
  // that may predate the save, so its copy is not merged (see applyServerCopy).
  const lastBaseMoveAtRef = useRef<number>(0);
  // fetchStartedAt of the newest server copy applied; an older one is ignored.
  const lastAppliedFetchAtRef = useRef<number>(fetchStartedAt ?? 0);
  // Last local change only; stored with the draft and shown when it is restored.
  const lastEditAtRef = useRef<number>(bootstrap.restoredDraftAt ?? 0);
  // WHAT: The content the server is known to hold: the loaded copy (or a
  //     re-fetched one), moved on by each confirmed payload for exactly the
  //     values it named. Stored as the draft's base (the restore rule's
  //     reference point) and used to merge re-fetched copies.
  const [initialBaseFields] = useState<DraftFields>(() => toDraftFields(contentOf(initialProject)));
  const baseFieldsRef = useRef<DraftFields>(initialBaseFields);
  // WHAT: Values sent since the base without a confirmation, stored with the
  //     draft. A reload after a save whose answer was lost then recognises the
  //     server's value as this device's own write, not someone else's change.
  const sentRef = useRef<SentValues>({});
  const serverProjectRef = useRef<Project>(initialProject);
  const queueRef = useRef<SaveQueue<EditorSavePayload> | null>(null);
  const accessRecoveryRef = useRef<AccessRecovery | null>(null);
  const onRequestAccessRef = useRef(onRequestAccess);
  const onReloadRef = useRef(onReload);

  // Variables-config flags fetched from API
  const [varsConfig, setVarsConfig] = useState<VariableWithFlags[]>([]);
  const [varsLoading, setVarsLoading] = useState<boolean>(false);

  // WHAT: Data-driven derived-total config (no hardcoded variable names).
  // WHY: So renaming/merging a base variable via /admin/kyc updates these totals
  //     automatically (the merge rewrites [tokens] in derived_variable_config).
  const [derivedConfig, setDerivedConfig] = useState<{
    totals: Array<{ key: string; label: string; formula: string }>;
    fans: { remoteFansVar: string; stadiumVar: string; remoteFansFallbackFormula: string };
    fallbackGroups: Array<{ label: string; triggerVars: string[]; entries: Array<{ key: string; label: string; formula: string }> }>;
  }>({
    totals: [
      { key: 'totalGender', label: 'Gender total', formula: '[female]+[male]' },
      { key: 'totalUnder40', label: 'Under 40', formula: '[genAlpha]+[genYZ]' },
      { key: 'totalOver40', label: 'Over 40', formula: '[genX]+[boomer]' },
      { key: 'totalAge', label: 'Age total', formula: '[genAlpha]+[genYZ]+[genX]+[boomer]' },
      { key: 'totalMerch', label: 'Merch total', formula: '[merched]+[jersey]+[scarf]+[flags]+[baseballCap]+[other]' },
    ],
    fans: { remoteFansVar: 'remoteFans', stadiumVar: 'stadium', remoteFansFallbackFormula: '[indoor]+[outdoor]' },
    fallbackGroups: [
      {
        label: 'Gender (fanmass AI estimate when the manual clicker was never used)',
        triggerVars: ['male', 'female'],
        entries: [
          { key: 'male', label: 'Male (fanmass estimate)', formula: '([fanmassGenderMalePct]/100)*[fanmassDemographicsAnalyzed]' },
          { key: 'female', label: 'Female (fanmass estimate)', formula: '([fanmassGenderFemalePct]/100)*[fanmassDemographicsAnalyzed]' },
        ],
      },
    ],
  });

  // Google Sheets event-level sync (Phase 3)
  const [sheetSyncConnected, setSheetSyncConnected] = useState<boolean | null>(null);
  const [sheetSyncLoading, setSheetSyncLoading] = useState(false);
  const [sheetSyncMessage, setSheetSyncMessage] = useState('');
  const [sheetSyncOperation, setSheetSyncOperation] = useState<'idle' | 'pull' | 'push'>('idle');

  useEffect(() => {
    onRequestAccessRef.current = onRequestAccess;
  }, [onRequestAccess]);

  useEffect(() => {
    onReloadRef.current = onReload;
  }, [onReload]);

  // WHAT: Store this tab's draft: the newest local content and its base, and
  //     the counts the save queue holds (draftCountsOfQueue).
  // NOTE: The counts are read from the queue, so a change is queued before
  //     this runs for it.
  // RETURNS: false when this device could not store it (the banner then says
  //     the changes exist only on this page).
  const persistDraft = useCallback((): boolean => {
    const latest = latestRef.current;
    const draft: StoredDraft = {
      v: 1,
      scope: latest.project._id,
      tabId,
      editedAt: lastEditAtRef.current || Date.now(),
      base: baseFieldsRef.current,
      // Same normalisation as the base, so a total the server fills in on save
      // (remoteFans, allImages, totalFans) never reads as a local change.
      fields: toDraftFields(latestContent(latest)),
    };
    if (Object.keys(sentRef.current).length > 0) draft.sent = sentRef.current;
    const queue = queueRef.current;
    if (queue) {
      const last = lastAttemptRef.current;
      const { counts, outstanding } = draftCountsOfQueue(queue.unconfirmedPayloads(), {
        tabId,
        attemptId: last.id,
        clientSeq: last.clientSeq,
      });
      if (Object.keys(counts).length > 0) draft.counts = counts;
      if (outstanding.length > 0) draft.outstanding = outstanding;
    }
    const stored = writeDraft(getDraftStorage(), draft);
    setDraftStored(stored);
    return stored;
  }, [tabId]);

  // WHAT: Adopt a re-fetched copy of the event (tab refocus, access re-check,
  //     after a sheet pull) without overwriting unsaved local edits.
  // WHY: The editor used to reset its state from every new copy. A re-fetch
  //     that landed while edits were unsaved (or that read the database before
  //     an in-flight save was written) replaced the operator's numbers with the
  //     older server copy, and the next click saved that older copy.
  // HOW: Name, date, partners and style always come from the server. Then:
  //     - A copy older than one already applied is ignored: two loads can
  //       overlap and answer in either order.
  //     - The request left before this tab's last confirmed save: the copy may
  //       predate that save, so the local content is kept as it is.
  //     - Unsaved local changes: merge value by value against the base. Values
  //       only the server changed (an admin, another tab, a sheet pull) are
  //       taken; values changed here stay; a value changed on both sides keeps
  //       the local one, because this operator is recording it right now. A
  //       value still in the save queue always stays -- also one set back to
  //       what the base holds (0 -> 1 -> 0) -- so the screen shows what the
  //       queue is about to store. Nothing is queued for the values taken:
  //       the queue holds only what changed here, so it cannot undo them.
  //       A count waiting to be sent is shown on top of the server's value.
  //       A stat counted by a request that may be stored already
  //       (maybeStoredCountFields) keeps its local number and its base until
  //       that request is answered: the copy may hold the count already, and
  //       the answer moves the base on by it.
  //     - Nothing unsaved: take the server copy.
  //     A successful load also renewed (or issued) this page's save access, so a
  //     queue paused on a 401 resumes -- unless the server said this caller
  //     cannot save.
  const applyServerCopy = useCallback(
    (copy: Project, startedAt: number | undefined, copyCanSave: boolean | undefined) => {
      if (copy === serverProjectRef.current) return; // already applied
      if (startedAt !== undefined) {
        if (startedAt < lastAppliedFetchAtRef.current) return;
        lastAppliedFetchAtRef.current = startedAt;
      }
      serverProjectRef.current = copy;

      const queue = queueRef.current;
      const unsaved = hasUnsavedRef.current || (queue?.getSnapshot().pendingCount ?? 0) > 0;
      const maybeStale = startedAt !== undefined && lastBaseMoveAtRef.current >= startedAt;
      const serverFields = toDraftFields(contentOf(copy));

      let content: EditorContent;
      let tookServerChanges = false;
      if (maybeStale) {
        content = latestContent(latestRef.current);
      } else if (unsaved) {
        const local = latestContent(latestRef.current);
        const localFields = toDraftFields(local);
        const { merged } = mergeFieldChanges(serverFields, baseFieldsRef.current, localFields, 'take-local');
        const queued = queue?.unconfirmed();
        // Also a stat whose counts add up to nothing in `queued` (a +1 out,
        // then a -1 waiting): the copy may hold the +1.
        const maybeStored = maybeStoredCountFields(queue?.unconfirmedPayloads() ?? []);
        const keepLocal = new Set([
          ...Object.keys(queued ? payloadFields(queued, baseFieldsRef.current) : {}),
          ...maybeStored,
        ]);
        for (const key of keepLocal) {
          if (localFields[key] === undefined) delete merged[key];
          else merged[key] = localFields[key];
        }
        // A count not sent yet is added to the server's value, not shown
        // instead of it: the server's value holds other devices' taps too.
        // Not on a stat a request out without an answer counts: the copy may
        // hold that request's count already, so the local number (set above)
        // stays until it is answered.
        for (const [stat, delta] of Object.entries(queued?.statsIncrements ?? {})) {
          if (maybeStored.has(STAT_FIELD + stat)) continue;
          const serverValue = serverFields[STAT_FIELD + stat];
          merged[STAT_FIELD + stat] = (typeof serverValue === 'number' ? serverValue : 0) + delta;
        }
        // Those stats keep their base too. The answer moves the base on by the
        // request's count (onSaved); moved on from a copy that already held
        // it, the base counted it twice.
        const base: DraftFields = { ...serverFields };
        for (const key of maybeStored) {
          const before = baseFieldsRef.current[key];
          if (before === undefined) delete base[key];
          else base[key] = before;
        }
        baseFieldsRef.current = base;
        tookServerChanges = !sameFieldValue(merged, localFields);
        content = tookServerChanges ? fromFields(merged) : local;
      } else {
        baseFieldsRef.current = serverFields;
        content = contentOf(copy);
      }

      const next = {
        project: { ...copy, ...content },
        hashtags: content.hashtags,
        categorizedHashtags: content.categorizedHashtags,
      };
      latestRef.current = next;
      setProject(next.project);
      setHashtags(next.hashtags);
      setCategorizedHashtags(next.categorizedHashtags);

      // Keep the stored draft's base in step with what the server holds now.
      if (unsaved && !maybeStale) persistDraft();

      if (copyCanSave !== false) {
        setAccessBlocked(false);
        if (queue?.getSnapshot().state === 'needs-access') queue.resume();
      } else if (draftsLeftRef.current) {
        // Still read-only: measure the drafts it left against this copy, which
        // may hold their values by now (another tab's save landed since) or
        // have changed some of them on the server.
        setKeptDrafts(
          summarizeKeptDrafts(planDraftRestore(serverFields, readDrafts(getDraftStorage(), copy._id).map(writableDraft)))
        );
      }
    },
    [persistDraft]
  );

  useEffect(() => {
    applyServerCopy(initialProject, fetchStartedAt, canSave);
  }, [initialProject, fetchStartedAt, canSave, applyServerCopy]);

  // WHAT: Take over the drafts a bootstrap restored (on mount, and when a
  //     read-only editor gains save access): remove the drafts with nothing
  //     the server lacks, store the restored changes in this tab's own draft,
  //     then remove the drafts it adopted and narrow the conflicted ones to
  //     their held-back values, and queue the save.
  // WHY: This tab's own draft must hold the restored changes before the old
  //     keys go -- unless this device could not store it. Drafts with
  //     held-back values keep only those, so "Keep saved values" can drop
  //     exactly them.
  // HOW: What is queued (restoredSaves) is every value that differs from the
  //     base (changesFromBase) -- the restored ones, and any change recorded
  //     before this queue existed -- and the restored counts, as counts. A
  //     held-back value shows the server's, so it is not sent. Queued before
  //     this tab's draft is stored, which reads the counts from the queue.
  //     `queued` is false when the queue already holds them (carried over
  //     from the queue it replaces).
  //     If this tab's draft cannot be stored, the old drafts keep their values
  //     (sending a value twice is harmless) but lose their counts: this page
  //     sends them now, and a later load would count them a second time.
  const settleBootstrapDrafts = useCallback(
    (boot: EditorBootstrap, queue: SaveQueue<EditorSavePayload>, queued = false) => {
      const storage = getDraftStorage();
      const scope = boot.project._id;
      for (const draft of boot.obsolete) removeDraft(storage, scope, draft.tabId, draft.editedAt);
      if (hasUnsavedRef.current && !queued) {
        const saves = restoredSaves(boot, latestContent(latestRef.current), baseFieldsRef.current);
        // Nothing differs from what the server holds and no count waits:
        // nothing is unsaved (a draft left behind is found obsolete by the next load).
        if (saves.length === 0) hasUnsavedRef.current = false;
        for (const save of saves) queue.enqueue(save);
      }
      const ownDraftHoldsRestored = hasUnsavedRef.current ? persistDraft() : true;
      const heldBack = boot.conflict?.held ?? [];
      if (ownDraftHoldsRestored) {
        for (const draft of boot.adopted) removeDraft(storage, scope, draft.tabId, draft.editedAt);
        for (const { draft, held } of heldBack) replaceDraft(storage, held, draft.editedAt);
      } else {
        for (const draft of [...boot.adopted, ...heldBack.map((h) => h.draft)]) {
          if (countedDraftFields(draft).size === 0) continue;
          if (!replaceDraft(storage, withoutDraftCounts(draft), draft.editedAt)) {
            removeDraft(storage, scope, draft.tabId, draft.editedAt);
          }
        }
      }
    },
    [persistDraft]
  );

  // WHAT: One save queue per project, plus the 401 recovery that feeds it.
  // WHY: Every save goes through the queue: one request in flight, rapid
  //     changes coalesced, failures retried until the server confirms them.
  //     A 401 pauses it and asks the page to re-establish access (re-load the
  //     project, or show the password prompt), then resumes.
  const projectId = project._id;
  useEffect(() => {
    const storage = getDraftStorage();
    const recovery = createAccessRecovery({
      requestAccess: async () => {
        const request = onRequestAccessRef.current;
        return request ? request() : 'granted';
      },
      onGranted: () => {
        setAccessBlocked(false);
        queueRef.current?.resume();
      },
      onBlocked: () => setAccessBlocked(true),
    });
    // The attempt id of the last request sent and the clientSeq it went out
    // under: a retry of the same payload goes out under the same number.
    // Per queue: attempt ids start again with every queue.
    lastAttemptRef.current = { id: 0, clientSeq: 0 };
    // WHAT: Restored requests (RESEND at EditorSavePayload) the server
    //     answered stale, and whether to load the event again once nothing
    //     is waiting.
    // WHY: Stale means the request was stored before -- possibly before this
    //     page loaded the event, whose values then already held its counts,
    //     which the page also shows on top (planDraftRestore). Only a load
    //     after that tells. Waiting until nothing is unconfirmed lets that
    //     load be taken as it is (applyServerCopy).
    const staleResends = new WeakSet<EditorSavePayload>();
    let reloadWhenSaved = false;
    const reloadAfterStaleResend = () => {
      const run = () => {
        if (queueRef.current !== queue) return; // replaced or unmounted
        // A load is merged only when it left after the last confirmed save.
        if (Date.now() <= lastBaseMoveAtRef.current) {
          setTimeout(run, 1);
          return;
        }
        const reload = onReloadRef.current;
        if (!reload) return;
        reload().then(
          (copy) => {
            if (copy && queueRef.current === queue) applyServerCopy(copy.project, copy.fetchStartedAt, copy.canSave);
          },
          () => {}
        );
      };
      setTimeout(run, 0);
    };
    const queue = createSaveQueue<EditorSavePayload>({
      // Payloads name only what changed: merge, never replace (see EditorSavePayload).
      coalesce: mergeEditorSavePayloads,
      canCoalesce: canMergeEditorSavePayloads,
      // A failed save is retried unchanged, before anything newer, and under
      // its own clientSeq: if the first copy was stored after all (its answer
      // was lost, or it outlived the 25 s deadline), the server turns the
      // retry away as stale instead of adding its counts a second time.
      retryFailedAlone: true,
      send: (payload, attempt) => {
        // A restored request goes under the sequence it first went out under.
        let sequence: EditorSequence;
        if (payload.resend) {
          sequence = payload.resend;
        } else {
          if (attempt.id !== lastAttemptRef.current.id) {
            clientSeqRef.current += 1;
            lastAttemptRef.current = { id: attempt.id, clientSeq: clientSeqRef.current };
          }
          sequence = { tabId, clientSeq: lastAttemptRef.current.clientSeq };
        }
        // Written down before the request leaves: if its answer never arrives
        // (reload, discarded tab, dropped connection) while the save itself
        // went through, the next load recognises a value as this device's, and
        // sends the counts again under this sequence (draftCountsOfQueue).
        sentRef.current = addSentValues(sentRef.current, baseFieldsRef.current, payloadValueFields(payload));
        persistDraft();
        const { resend, ...fields } = payload;
        const body: EditorSaveRequestBody = { ...fields, ...sequence };
        const request = sendJsonForSave('/api/projects', body);
        if (!resend) return request;
        return request.then((answer) => {
          if ((answer as { stale?: unknown } | null)?.stale === true) staleResends.add(payload);
          return answer;
        });
      },
      // Also after a { stale: true } answer: this very request (same clientSeq)
      // was stored before, by an earlier copy whose answer never arrived. A
      // newer payload is only sent once this one is confirmed.
      onSaved: (payload, { pendingCount }) => {
        lastBaseMoveAtRef.current = Date.now();
        recovery.reset();
        setAccessBlocked(false);
        // The server now holds the values this payload named -- and only
        // those are known: the base moves for exactly them. A value the base
        // took from a re-fetch while the request was out stays as it is;
        // setting it back to the payload's time would make the next save send
        // it back over whatever the server holds by then.
        const base: DraftFields = { ...baseFieldsRef.current };
        const sent: SentValues = { ...sentRef.current };
        for (const [key, value] of Object.entries(payloadFields(payload, baseFieldsRef.current))) {
          if (value === undefined) delete base[key];
          else base[key] = value;
          delete sent[key];
        }
        baseFieldsRef.current = base;
        sentRef.current = sent;
        if (staleResends.has(payload)) reloadWhenSaved = true;
        if (pendingCount === 0) {
          // Every change made here is confirmed: the draft is safe to drop.
          hasUnsavedRef.current = false;
          removeDraft(storage, projectId, tabId);
          if (reloadWhenSaved) {
            reloadWhenSaved = false;
            reloadAfterStaleResend();
          }
        } else {
          // Newer changes are still waiting: store them against the new base,
          // so a reload does not mistake this tab's own save for someone else's.
          persistDraft();
        }
      },
      onNeedsAccess: () => recovery.request(),
    });
    accessRecoveryRef.current = recovery;
    queueRef.current = queue;
    setSaveQueue(queue);

    // Restored drafts (or edits made before this queue existed) still need
    // saving -- unless the queue this one replaces held them: then they are
    // taken over from it, as they were left there.
    const carried = carryOverRef.current;
    carryOverRef.current = null;
    if (carried && carried.projectId === projectId) {
      for (const save of carried.saves) queue.enqueue(save);
      settleBootstrapDrafts(bootstrap, queue, true);
    } else {
      settleBootstrapDrafts(bootstrap, queue);
    }

    return () => {
      // Send what is waiting before letting go; the draft stays until confirmed.
      queue.flush();
      // What is still unconfirmed, for a queue that replaces this one. The
      // request out without an answer goes again under its own sequence.
      const last = lastAttemptRef.current;
      carryOverRef.current = {
        projectId,
        saves: queue.unconfirmedPayloads().map(({ payload, attempt, sent }) =>
          !payload.resend && sent && attempt.id === last.id
            ? { ...payload, resend: { tabId, clientSeq: last.clientSeq } }
            : payload
        ),
      };
      queue.dispose();
      recovery.dispose();
      if (queueRef.current === queue) queueRef.current = null;
      if (accessRecoveryRef.current === recovery) accessRecoveryRef.current = null;
    };
  }, [projectId, tabId, bootstrap, persistDraft, settleBootstrapDrafts, applyServerCopy]);

  // WHAT: Restore the drafts a read-only load kept, as soon as the editor may
  //     save (a re-fetch answered canSave: true, or the password prompt was
  //     passed), without a reload.
  // WHY: The read-only notice says they come back once editing is possible.
  //     Waiting for the next load would leave them out of the edits made from
  //     now on, and the next load would then hold them back as conflicts.
  // HOW: draftsLeftRef is set only while the editor has been read-only since it
  //     loaded, so it has nothing of its own: the drafts are restored against
  //     the server copy it shows, by the same rule as a fresh load, and taken
  //     over like on mount -- which also removes the obsolete ones the notice
  //     left out. A change recorded in the moment since the switch (nothing
  //     else can record one) leaves them for the next load instead of being
  //     merged over.
  useEffect(() => {
    if (readOnly || !draftsLeftRef.current) return;
    const queue = queueRef.current;
    if (!queue) return;
    draftsLeftRef.current = false;
    setKeptDrafts(null);
    if (hasUnsavedRef.current || queue.getSnapshot().pendingCount > 0) return;

    const server = serverProjectRef.current;
    const next = bootstrapFromServer(server, false);
    baseFieldsRef.current = toDraftFields(contentOf(server));
    latestRef.current = { project: next.project, hashtags: next.hashtags, categorizedHashtags: next.categorizedHashtags };
    hasUnsavedRef.current = next.restoredDraftAt !== null;
    if (next.restoredDraftAt !== null) lastEditAtRef.current = next.restoredDraftAt;
    setProject(next.project);
    setHashtags(next.hashtags);
    setCategorizedHashtags(next.categorizedHashtags);
    setRestoredDraftAt(next.restoredDraftAt);
    setDraftConflict(next.conflict);
    settleBootstrapDrafts(next, queue);
  }, [readOnly, settleBootstrapDrafts]);

  // WHAT: Never lose queued edits to closing, hiding or a dropped connection.
  // WHY: A mobile browser may discard a backgrounded tab without warning, so
  //     waiting edits are sent the moment the page is hidden; closing or
  //     reloading with anything unsaved asks for confirmation first.
  // HOW: The field being typed in is committed first. Manual numbers, texts
  //     and report texts are recorded when they lose focus, and closing,
  //     reloading or hiding the tab does not blur them: the value was never
  //     in the draft or the queue, the leave warning did not fire for it, and
  //     it was gone. Blurring it here records it like any other change (draft,
  //     then queue) before anything is checked or sent.
  useEffect(() => {
    const commitFocusedField = () => {
      const root = rootRef.current;
      const focused = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
      if (root && focused && focused !== root && root.contains(focused) && typeof focused.blur === 'function') {
        focused.blur();
      }
    };
    const hasUnsaved = () => hasUnsavedRef.current || (queueRef.current?.getSnapshot().pendingCount ?? 0) > 0;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      commitFocusedField();
      if (!hasUnsaved()) return;
      queueRef.current?.flush();
      event.preventDefault();
      event.returnValue = '';
    };
    // Fires where beforeunload may not (a mobile tab closed from the switcher,
    // a page put into the back/forward cache): no warning is possible, but
    // the draft and one last send are.
    const onPageHide = () => {
      commitFocusedField();
      queueRef.current?.flush();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      commitFocusedField();
      queueRef.current?.flush();
    };
    const onOnline = () => queueRef.current?.flush();
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Load the data-driven derived-total config (keeps built-in defaults on failure).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/derived-variable-config', { cache: 'no-store' });
        const data = await res.json();
        if (mounted && data?.success && data.config?.totals && data.config?.fans) {
          setDerivedConfig(prev => ({
            totals: data.config.totals,
            fans: data.config.fans,
            fallbackGroups: data.config.fallbackGroups ?? prev.fallbackGroups,
          }));
        }
      } catch {
        // keep the built-in defaults — never break the editor on a config read
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load variables-config (flags and custom variables)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setVarsLoading(true);
        const res = await fetch('/api/variables-config', { cache: 'no-store' });
        const data = await res.json();
        if (mounted && data?.success && Array.isArray(data.variables)) {
          console.log('✅ Loaded variables:', data.variables.length, 'variables');
          console.log('Sample variable names:', data.variables.slice(0, 5).map((v: any) => v.name));
          setVarsConfig(data.variables);
        } else {
          console.warn('⚠️ Failed to load variables:', data);
        }
      } catch (e) {
        console.error('❌ Failed to load variables-config', e);
      } finally {
        setVarsLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  // Fetch Google Sheet connection status when event is sheet-linked
  useEffect(() => {
    const pid = project.partnerId || (project as any).partnerId;
    if (!pid || !project.googleSheetUuid) {
      setSheetSyncConnected(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/partners/${pid}/google-sheet/status`, { cache: 'no-store' });
        const data = await res.json();
        if (mounted && data?.connected === true) setSheetSyncConnected(true);
        else if (mounted) setSheetSyncConnected(false);
      } catch {
        if (mounted) setSheetSyncConnected(false);
      }
    })();
    return () => { mounted = false };
  }, [project.partnerId, project.googleSheetUuid, project]);

  // WHAT: Load the event again through the page after a sheet pull, retrying a
  //     couple of times. null when it could not be loaded.
  const reloadAfterPull = async (): Promise<ReloadedProject | null> => {
    const reload = onReloadRef.current;
    if (!reload) return null;
    for (const wait of [0, 1000, 3000]) {
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      try {
        const copy = await reload();
        if (copy) return copy;
      } catch {
        // try again
      }
    }
    return null;
  };

  // WHAT: Pull the event's values from the partner's sheet, then show them.
  // WHY: The pull writes the stored event directly. A change from this page
  //     that lands after it -- one still waiting or being retried -- puts the
  //     pre-pull value of every key it names back over the pulled one, and a
  //     change made on the pre-pull numbers on screen (a +1 on the old count)
  //     is off by what the pull changed.
  // HOW: Save what is waiting first; hold the queue during the pull; load the
  //     result through the page and merge it like a tab-focus re-fetch (a change
  //     made meanwhile is kept); only then let saves go out again.
  const handleSheetPull = async () => {
    const pid = project.partnerId || (project as any).partnerId;
    if (!pid || !project._id || readOnlyRef.current) return;
    setSheetSyncOperation('pull');
    setSheetSyncMessage('');
    const queue = queueRef.current;
    let release: (() => void) | null = null;
    try {
      if (queue && !(await whenAllSaved(queue))) {
        setSheetSyncMessage('Not pulled: changes on this page are not saved yet. Pull again once they are saved.');
        return;
      }
      release = queue ? queue.hold() : null;
      // null: the request failed on the way, so the pull may or may not have run.
      let error: string | null = null;
      let pulled: boolean | null = null;
      try {
        const res = await fetch(`/api/partners/${pid}/google-sheet/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: project._id }),
        });
        const data = await res.json();
        pulled = Boolean(data.success);
        if (!pulled) error = data.error || 'Pull failed';
      } catch (e) {
        error = e instanceof Error ? e.message : 'Pull failed';
      }
      if (pulled === false) {
        setSheetSyncMessage(error || 'Pull failed');
        return;
      }
      const copy = await reloadAfterPull();
      if (copy) applyServerCopy(copy.project, copy.fetchStartedAt, copy.canSave);
      if (error) setSheetSyncMessage(error);
      else if (copy) setSheetSyncMessage('Pulled from sheet.');
      else setSheetSyncMessage('Pulled from sheet, but the new values could not be loaded. Reload the page before making changes.');
    } catch (e) {
      setSheetSyncMessage(e instanceof Error ? e.message : 'Pull failed');
    } finally {
      release?.();
      setSheetSyncOperation('idle');
    }
  };

  const handleSheetPush = async () => {
    const pid = project.partnerId || (project as any).partnerId;
    if (!pid || !project._id || readOnlyRef.current) return;
    setSheetSyncOperation('push');
    setSheetSyncMessage('');
    try {
      // The push reads the stored event, so this page's changes (a field just
      // left, a save being retried) must be stored first.
      const queue = queueRef.current;
      if (queue && !(await whenAllSaved(queue))) {
        setSheetSyncMessage('Not pushed: changes on this page are not saved yet. Push again once they are saved.');
        return;
      }
      const res = await fetch(`/api/partners/${pid}/google-sheet/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: project._id }),
      });
      const data = await res.json();
      if (data.success) {
        setSheetSyncMessage('Pushed to sheet.');
      } else {
        setSheetSyncMessage(data.error || 'Push failed');
      }
    } catch (e) {
      setSheetSyncMessage(e instanceof Error ? e.message : 'Push failed');
    } finally {
      setSheetSyncOperation('idle');
    }
  };

  // WHAT: Record a local change: keep it on this device, then queue the save
  //     of exactly what it changed (the queue merges it with what is waiting).
  // WHY: The draft is written before the request, so a refused or lost save can
  //     no longer lose the data; it is removed only once the server confirms it.
  // HOW: Queued first, then the draft is stored: the draft reads its counts
  //     from the queue. Queuing does not send at once -- and when it does (a
  //     closed payload was waiting), the send stores the draft first itself.
  // RETURNS: whether this device stored the draft.
  // Only what the server can store is queued (writableEditorChange), split
  // into saves of a size it accepts (splitEditorChange).
  const recordLocalChange = useCallback(
    (change: EditorChange): boolean => {
      const { change: writable, dropped } = writableEditorChange(change);
      if (dropped.length > 0) console.warn('Not saved: the server cannot store these values:', dropped);
      if (isEmptyChange(writable)) return true;
      hasUnsavedRef.current = true;
      lastEditAtRef.current = Date.now();
      for (const part of splitEditorChange(writable)) {
        queueRef.current?.enqueue({ projectId: latestRef.current.project._id, ...part });
      }
      return persistDraft();
    },
    [persistDraft]
  );

  // WHAT: Replace stats and hashtags at once (the draft conflict choice), and
  //     queue what differs from the content on screen.
  const commitContent = useCallback(
    (content: EditorContent): boolean => {
      const current = latestRef.current;
      const change: EditorChange = { statsChanges: statsChangesBetween(current.project.stats, content.stats) };
      if (!sameFieldValue(content.hashtags, current.hashtags)) change.hashtags = content.hashtags;
      if (!sameFieldValue(content.categorizedHashtags, current.categorizedHashtags)) {
        change.categorizedHashtags = content.categorizedHashtags;
      }
      if (isEmptyChange(change)) return true;
      latestRef.current = {
        project: { ...current.project, ...content },
        hashtags: content.hashtags,
        categorizedHashtags: content.categorizedHashtags,
      };
      setProject((prev) => ({ ...prev, ...content }));
      setHashtags(content.hashtags);
      setCategorizedHashtags(content.categorizedHashtags);
      return recordLocalChange(change);
    },
    [recordLocalChange]
  );

  // WHAT: The operator's answer to the draft conflict notice.
  // WHY: Only the held-back values are in question: the server changed each of
  //     them since this device did, and only the operator knows which side is
  //     right. Every other value of those drafts was restored on load and is
  //     not touched here. "Use this device's values" puts the listed values on
  //     screen and saves them (over an edit made in this tab since loading,
  //     too); "Keep saved values" discards exactly the listed values.
  const resolveDraftConflict = (useDeviceValues: boolean) => {
    const conflict = draftConflict;
    if (!conflict || readOnlyRef.current) return;
    setDraftConflict(null);
    let stored = true;
    if (useDeviceValues) {
      // Only the listed values change; applied to the content as it is, so a
      // total the server fills in is not turned into a value of this page's.
      const content = latestContent(latestRef.current);
      const stats: Record<string, unknown> = { ...content.stats };
      for (const item of conflict.items) {
        if (item.key.startsWith(STAT_FIELD)) {
          const stat = item.key.slice(STAT_FIELD.length);
          if (item.local === undefined) delete stats[stat];
          else stats[stat] = item.local;
        } else if (item.key === 'hashtags') {
          content.hashtags = Array.isArray(item.local) ? (item.local as string[]) : [];
        } else if (item.key === 'categorizedHashtags') {
          content.categorizedHashtags = fromFields({ categorizedHashtags: item.local }).categorizedHashtags;
        }
      }
      stored = commitContent({ ...content, stats: stats as ProjectStats });
    }
    // Keep the old drafts if their values could not be stored in this tab's own.
    if (stored) {
      const storage = getDraftStorage();
      for (const { draft, conflicts } of conflict.held) discardDraftFields(storage, draft, conflicts);
    }
  };

  // WHAT: Apply one change to the stats and queue it for saving.
  // WHY: Handlers used to spread the render-time `project.stats`, so two inputs
  //     handled before a re-render (fast clicks, a blur followed by a click) both
  //     built on the same stale copy and the second silently undid the first.
  // HOW: `update` receives the newest stats (latestRef, written synchronously),
  //     and the state is set with a functional update from that result. The
  //     updater itself stays pure: the draft and the queue are fed here, once,
  //     with the keys the update changed and nothing else.
  //     A value the server cannot store (a key with a dot or a `$`, a
  //     non-finite number, an object) is neither applied nor queued: the
  //     field keeps what it had, so what is shown is what is stored.
  const commitStats = useCallback(
    (update: (prev: ProjectStats) => ProjectStats) => {
      const current = latestRef.current;
      let nextStats = update(current.project.stats);
      if (nextStats === current.project.stats) return;
      const { change, dropped } = writableEditorChange({
        statsChanges: statsChangesBetween(current.project.stats, nextStats),
      });
      if (dropped.length > 0) {
        console.warn('Not saved: the server cannot store these values:', dropped);
        const kept = { ...(nextStats as Record<string, unknown>) };
        const prev = current.project.stats as Record<string, unknown>;
        for (const key of dropped) {
          if (Object.prototype.hasOwnProperty.call(prev, key)) kept[key] = prev[key];
          else delete kept[key];
        }
        nextStats = kept as ProjectStats;
      }
      const statsChanges = change.statsChanges;
      if (Object.keys(statsChanges).length === 0) return;
      latestRef.current = { ...current, project: { ...current.project, stats: nextStats } };
      setProject((prev) => ({ ...prev, stats: nextStats }));
      recordLocalChange({ statsChanges });
    },
    [recordLocalChange]
  );

  // WHAT: One clicker tap (+1 or -1) on a counter, never below zero.
  // WHY: Sent as a count (see COUNTS at EditorSavePayload), so a tap on
  //     another device is not overwritten by this tab's running total. Counted
  //     on from the newest stats (latestRef), so fast taps all count.
  //     `currentOf` gives the value shown where it is not simply the stored
  //     number (remote fans falls back to a formula); a tap where the stored
  //     value is not that number is saved as the value shown.
  const commitCount = useCallback(
    (key: string, delta: 1 | -1, currentOf?: (stats: ProjectStats) => number) => {
      if (!isWritableEventStatKey(key)) return;
      const current = latestRef.current;
      const prev = current.project.stats;
      const stored = (prev as Record<string, unknown>)[key];
      const from = currentOf ? currentOf(prev) : typeof stored === 'number' ? stored : 0;
      const to = Math.max(0, from + delta);
      if (to === from) return;
      const nextStats = { ...prev, [key]: to } as ProjectStats;
      latestRef.current = { ...current, project: { ...current.project, stats: nextStats } };
      setProject((p) => ({ ...p, stats: nextStats }));
      const counted = typeof stored === 'number' && Number.isFinite(stored) && stored === from;
      recordLocalChange(counted ? { statsChanges: {}, statsIncrements: { [key]: to - from } } : { statsChanges: { [key]: to } });
    },
    [recordLocalChange]
  );

  // WHAT: Commit stats built by a child editor (Builder, Report Content).
  // WHY: Those children spread the `stats` prop of the render they came from --
  //     after an image upload, possibly seconds old. Replacing the whole object
  //     would undo any change made meanwhile, so only the keys the child actually
  //     changed (or removed) relative to that snapshot are applied.
  const commitChildStats = useCallback(
    (base: ProjectStats, next: Record<string, unknown>) => {
      commitStats((prev) => {
        const changed: Record<string, unknown> = {};
        for (const key of Object.keys(next)) {
          if (next[key] !== base[key]) changed[key] = next[key];
        }
        const removed = Object.keys(base).filter((key) => !(key in next));
        if (Object.keys(changed).length === 0 && removed.length === 0) return prev;
        const merged = { ...prev, ...changed } as Record<string, unknown>;
        for (const key of removed) delete merged[key];
        return merged as ProjectStats;
      });
    },
    [commitStats]
  );

  // WHAT: Save now: skip the debounce, retry a failed save at once, or re-check
  //     access when the server refused it. Behind the Save and Retry now buttons.
  const saveNow = useCallback(() => {
    const queue = queueRef.current;
    if (!queue) return;
    const snapshot = queue.getSnapshot();
    if (snapshot.state === 'needs-access') {
      accessRecoveryRef.current?.requestNow();
      return;
    }
    // A save the server refused for good is sent once more, first.
    if (snapshot.rejectedCount > 0) {
      queue.retryRejected();
      return;
    }
    // Nothing waiting: every change is stored. An explicit Save still makes a
    // round trip -- one that names no value, so it cannot overwrite anything --
    // so the status confirms the server takes this page's saves right now.
    if (snapshot.pendingCount === 0) queue.enqueue({ projectId: latestRef.current.project._id, statsChanges: {} });
    queue.flush();
  }, []);

  // WHAT: Increment/Decrement functions for click-to-increment cards
  // WHY: Only works with numeric stats, not text/image fields
  // HOW: Ensure currentValue is number before arithmetic operations
  const incrementStat = (key: keyof typeof project.stats) => {
    commitCount(String(key), 1);
  };

  const decrementStat = (key: keyof typeof project.stats) => {
    commitCount(String(key), -1);
  };

  // WHAT: Dynamic accessors for variables - handle both 'female' and 'stats.female' formats
  // WHY: Variables in database use stats. prefix for Single Reference System
  // HOW: Strip 'stats.' prefix when accessing project.stats object
  const normalizeKey = (key: string): string => {
    // WHAT: Remove 'stats.' prefix if present
    // WHY: MongoDB stores as { stats: { female: 120 } }, not { stats: { stats.female: 120 } }
    return key.startsWith('stats.') ? key.slice(6) : key;
  };
  
  const getStat = (key: string): number => {
    const normalized = normalizeKey(key);
    const raw = (project.stats as any)[normalized];
    return typeof raw === 'number' ? raw : 0;
  };
  
  const setStat = (key: string, value: number) => {
    const normalized = normalizeKey(key);
    commitStats((prev) => ({ ...prev, [normalized]: Math.max(0, value) }));
  };

  // WHAT: Save text field (for reportText* variables)
  // WHY: Partner report text notes need to be persisted as strings
  // HOW: Store text directly in project.stats without type coercion
  const saveTextField = (key: string, value: string) => {
    const normalized = normalizeKey(key);
    commitStats((prev) => ({ ...prev, [normalized]: value }));
  };

  // WHAT: Save image URL (for reportImage* variables)
  // WHY: Uploaded images return ImgBB URLs that need to be stored
  // HOW: Store URL string in project.stats
  const saveImageUrl = (key: string, url: string) => {
    const normalized = normalizeKey(key);
    commitStats((prev) => ({ ...prev, [normalized]: url }));
  };
  
  // WHAT: Get text or image URL from stats
  // WHY: Text and image fields store strings, not numbers
  // HOW: Return empty string if undefined
  const getTextField = (key: string): string => {
    const normalized = normalizeKey(key);
    const raw = (project.stats as any)[normalized];
    return typeof raw === 'string' ? raw : '';
  };
  
  // Built from the newest stats, not the render-time getStat(), so fast taps count.
  const incrementDynamic = (key: string) => {
    commitCount(normalizeKey(key), 1);
  };
  const decrementDynamic = (key: string) => {
    commitCount(normalizeKey(key), -1);
  };

  // Hashtag management functions: a list is saved only when it changed.
  const handleGeneralHashtagsChange = (newHashtags: string[]) => {
    const current = latestRef.current;
    if (sameFieldValue(newHashtags, current.hashtags)) return;
    latestRef.current = { ...current, hashtags: newHashtags, project: { ...current.project, hashtags: newHashtags } };
    setHashtags(newHashtags);
    setProject(prev => ({ ...prev, hashtags: newHashtags }));
    recordLocalChange({ statsChanges: {}, hashtags: newHashtags });
  };

  const handleCategorizedHashtagsChange = (newCategorizedHashtags: CategorizedHashtags) => {
    const current = latestRef.current;
    if (sameFieldValue(newCategorizedHashtags, current.categorizedHashtags)) return;
    latestRef.current = {
      ...current,
      categorizedHashtags: newCategorizedHashtags,
      project: { ...current.project, categorizedHashtags: newCategorizedHashtags },
    };
    setCategorizedHashtags(newCategorizedHashtags);
    setProject(prev => ({ ...prev, categorizedHashtags: newCategorizedHashtags }));
    recordLocalChange({ statsChanges: {}, categorizedHashtags: newCategorizedHashtags });
  };

  // Calculate totals
  // Groups
  const [groups, setGroups] = useState<{ groupOrder: number; chartId?: string; titleOverride?: string; variables?: string[]; specialType?: 'report-content'; visibleInClicker?: boolean; visibleInManual?: boolean }[]>([])
  const [clickerSetFallback, setClickerSetFallback] = useState(false)
  const [charts, setCharts] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        const partnerClickerSetId = project.partner1?.clickerSetId || project.partner2?.clickerSetId;
        const url = partnerClickerSetId ? `/api/variables-groups?clickerSetId=${partnerClickerSetId}` : '/api/variables-groups';
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.groups)) {
          console.log('✅ Loaded groups:', data.groups.length, 'groups');
          if (data.groups.length > 0) {
            console.log('Sample group variables:', data.groups[0].variables?.slice(0, 5));
          }
          if (partnerClickerSetId && data.groups.length === 0) {
            // Fallback to default set
            const resDefault = await fetch('/api/variables-groups', { cache: 'no-store' });
            const defaultData = await resDefault.json();
            if (defaultData?.success && Array.isArray(defaultData.groups)) {
              setGroups(defaultData.groups);
              setClickerSetFallback(true);
            }
          } else {
            setGroups(data.groups);
            setClickerSetFallback(false);
          }
        } else {
          console.warn('⚠️ No groups found or failed to load');
          setClickerSetFallback(false);
        }
      } catch (e) {
        console.error('❌ Failed to load groups:', e);
      }
      try {
        const res2 = await fetch('/api/chart-config', { cache: 'no-store' })
        const data2 = await res2.json()
        if (data2?.success && Array.isArray(data2.configurations)) setCharts(data2.configurations)
      } catch {}
    })()
  }, [project.partner1?.clickerSetId, project.partner2?.clickerSetId])
  // WHAT: Derived totals computed from the data-driven config (no hardcoded
  //     variable names). WHY: a rename/merge in /admin/kyc updates these formulas.
  const rawEvalNum = (formula: string, stats: Record<string, unknown>): number => {
    const r = evaluateFormula(formula, stats as never);
    return typeof r === 'number' ? r : 0;
  };
  // WHAT: Stats view for total formulas, with AI-estimate fallbacks substituted in when a
  //     fallbackGroup's trigger fields are all exactly 0 (manual clicker never used for this
  //     event). The raw clicker button/stat card for e.g. male/female still reads/writes
  //     project.stats directly (the operator should see what was actually clicked) — only the
  //     TOTALS computed here use the estimate, so nothing overwrites real recorded data.
  const buildTotalsView = (stats: ProjectStats): Record<string, unknown> => {
    const view: Record<string, unknown> = { ...(stats as Record<string, unknown>) };
    for (const group of derivedConfig.fallbackGroups || []) {
      const triggered = group.triggerVars.every(v => ((stats as Record<string, number>)[v] ?? 0) === 0);
      if (!triggered) continue;
      for (const entry of group.entries) {
        view[entry.key] = rawEvalNum(entry.formula, stats as Record<string, unknown>);
      }
    }
    return view;
  };
  const statsForTotals = buildTotalsView(project.stats);
  const evalNum = (formula: string): number => rawEvalNum(formula, statsForTotals);
  const totalByKey: Record<string, number> = {};
  for (const t of derivedConfig.totals) totalByKey[t.key] = evalNum(t.formula);
  const fansCfg = derivedConfig.fans;
  // WHAT: Remote fans as stored, or derived from the fallback formula.
  // WHY: Also used inside commits, so +1/-1 build on the newest stats.
  const remoteFansOf = (stats: ProjectStats): number => {
    const stored = (stats as Record<string, number>)[fansCfg.remoteFansVar];
    return stored ?? rawEvalNum(fansCfg.remoteFansFallbackFormula, buildTotalsView(stats));
  };
  const remoteFansCalc = remoteFansOf(project.stats);
  const totalFans = remoteFansCalc + ((project.stats as Record<string, number>)[fansCfg.stadiumVar] || 0);
  const totalGender = totalByKey.totalGender ?? 0;
  const totalUnder40 = totalByKey.totalUnder40 ?? 0;
  const totalOver40 = totalByKey.totalOver40 ?? 0;
  const totalAge = totalByKey.totalAge ?? totalUnder40 + totalOver40;
  const totalMerch = totalByKey.totalMerch ?? 0;

  // Manual input field update (on blur/leave)
  const updateManualField = (field: keyof typeof project.stats, value: number) => {
    commitStats((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  // The cards themselves are module-level (EditorStatCard, EditorNumberCard):
  // declared in here, every render replaced every input and dropped its focus.

  // Helper: should show variable in clicker/manual by name
  const canShowInClicker = (name: string) => !!varsConfig.find(v => v.name === name)?.flags?.visibleInClicker
  const canShowInManual = (name: string) => !!varsConfig.find(v => v.name === name)?.flags?.editableInManual

  // Get all hashtag representations for display
  const allHashtagRepresentations = getAllHashtagRepresentations({ hashtags, categorizedHashtags });
  const totalHashtagCount = allHashtagRepresentations.length;

  const chartById = (id?: string) => charts.find((c: any) => c.chartId === id)
  const computeKpiValue = (cfg: any): number | 'NA' => {
    if (!cfg || cfg.type !== 'kpi' || !cfg.elements?.[0]) return 'NA'
    const formula = cfg.elements[0].formula as string
    return evaluateFormula(formula, project.stats as any)
  }

  // If groups exist, render from groups (both modes)
  const hasGroups = groups && groups.length > 0

  return (
    <div className="admin-container" ref={rootRef}>
      {/* First on the page, above the header and every input, and pinned while
          scrolling: an editor that cannot save says so before anything else. */}
      {readOnly && (
        <EditorReadOnlyNotice
          queue={saveQueue}
          draftStored={draftStored}
          kept={keptDrafts}
          onRetryNow={saveNow}
        />
      )}

      {/* Header with same styling as stats page */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{project.eventName}</h1>
            <p className="admin-subtitle">Record Stats - {new Date(project.eventDate).toLocaleDateString()}</p>
            
            {/* Beautiful hashtag display - showing all hashtags including categorized ones */}
            {allHashtagRepresentations.length > 0 && (
              <div className="centered-pill-row mt-2">
                {allHashtagRepresentations.map((hashtagDisplay, index) => (
                  <ColoredHashtagBubble 
                    key={index}
                    hashtag={hashtagDisplay}
                    showCategoryPrefix={true}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="admin-user-info">
            <div className="admin-badge p-3">
              <p className="admin-role">📅 {new Date(project.eventDate).toLocaleDateString()}</p>
              <p className="admin-level">🎯 Editor Mode</p>
              <EditorSaveStatusLine queue={saveQueue} readOnly={readOnly} />
              {/* Mode Toggle Button - cycles through 3 modes */}
              <button
                onClick={() => {
                  if (editMode === 'clicker') setEditMode('manual');
                  else if (editMode === 'manual') setEditMode('builder');
                  else setEditMode('clicker');
                }}
                className={`btn btn-small ${
                  editMode === 'clicker' ? 'btn-primary' :
                  editMode === 'manual' ? 'btn-success' :
                  'btn-warning'
                } btn-full mt-2`}
              >
                {editMode === 'clicker' && '🖱️ Clicker'}
                {editMode === 'manual' && '✏️ Manual'}
                {editMode === 'builder' && '🏗️ Builder'}
              </button>
              {sheetSyncConnected === true && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleSheetPull}
                    disabled={sheetSyncOperation !== 'idle' || readOnly}
                    className="btn btn-small btn-secondary btn-full"
                  >
                    {sheetSyncOperation === 'pull' ? '…' : '⬇️'} Pull from Sheet
                  </button>
                  <button
                    type="button"
                    onClick={handleSheetPush}
                    disabled={sheetSyncOperation !== 'idle' || readOnly}
                    className="btn btn-small btn-secondary btn-full mt-1"
                  >
                    {sheetSyncOperation === 'push' ? '…' : '⬆️'} Push to Sheet
                  </button>
                  {sheetSyncMessage && <p className="text-sm mt-1 editor-dashboard-message">{sheetSyncMessage}</p>}
                </div>
              )}

              {/* Save Button - visible for Manual & Builder modes */}
              {(editMode === 'manual' || editMode === 'builder') && (
                <EditorSaveButton queue={saveQueue} disabled={readOnly} onSaveNow={saveNow} />
              )}
            </div>
          </div>
        </div>
      </div>

      {restoredDraftAt !== null && (
        <div className={`alert alert-info mt-3 ${styles.noticeRow}`} role="status">
          <p className={styles.bannerText}>
            Restored unsaved changes from this device (last edit {formatEditTime(restoredDraftAt)}).{' '}
            {readOnly ? 'Kept on this device.' : 'They are being saved now.'}
          </p>
          <button type="button" className="btn btn-small btn-secondary" onClick={() => setRestoredDraftAt(null)}>
            Dismiss
          </button>
        </div>
      )}

      {draftConflict && !readOnly && (
        <div className={`alert alert-warning mt-3 ${styles.noticeRow}`} role="alert">
          <p className={styles.bannerText}>
            <strong>
              {draftConflict.items.length === 1
                ? '1 unsaved value from this device was not restored'
                : `${draftConflict.items.length} unsaved values from this device were not restored`}
            </strong>{' '}
            (last edit {formatEditTime(draftConflict.editedAt)}): changed on the server since.{' '}
            {draftConflict.items.map((item) => describeConflictItem(item, varsConfig)).join('; ')}. The saved{' '}
            {draftConflict.items.length === 1 ? 'value is' : 'values are'} shown. Keep saved values discards{' '}
            {draftConflict.items.length === 1 ? 'this value' : `these ${draftConflict.items.length} values`}.
          </p>
          <div className={styles.noticeActions}>
            <button type="button" className="btn btn-small btn-secondary" onClick={() => resolveDraftConflict(false)}>
              Keep saved values
            </button>
            <button type="button" className="btn btn-small btn-primary" onClick={() => resolveDraftConflict(true)}>
              Use this device&apos;s values
            </button>
          </div>
        </div>
      )}

      {clickerSetFallback && (
        <div className="alert alert-warning mt-3">
          Using default clicker layout because the partner’s assigned clicker set is missing. Please update the partner’s clicker set in Admin.
        </div>
      )}

      {/* A disabled fieldset disables every input, button and upload inside it,
          including those of child editors, and with them any switch that only
          changes what they show. Report Content is shown by
          EditorReportContentView, which has no controls (its editor stays
          mounted but hidden after a switch mid-session). Builder's text and
          table Preview toggles stay off: the raw text is still shown in the
          disabled fields, and the child builders have no read-only mode that
          would keep only the toggles on. */}
      <fieldset className={styles.editorFieldset} disabled={readOnly}>
      <div className="content-grid">
        {/* WHAT: Switch rendering based on edit mode */}
        {/* WHY: Builder mode shows report template layout, Clicker/Manual show variable groups */}
        {editMode === 'builder' ? (
          <BuilderMode 
            projectId={project._id as string} 
            stats={project.stats as any}
            onSave={(newStats) => commitChildStats(project.stats, newStats)}
          />
        ) : (
          // Clicker & Manual modes: Groups-driven rendering
          <>
        {groups
          .filter(g => {
            // WHAT: Filter groups by visibility flags based on current edit mode
            // WHY: Admin controls which groups appear in clicker vs manual mode
            // HOW: Check visibleInClicker for clicker mode, visibleInManual for manual mode
            // Default to true if flags are undefined (backward compatibility)
            const visible = editMode === 'clicker' ? (g.visibleInClicker !== false) : (g.visibleInManual !== false);
            if (editMode === 'manual') {
              console.log(`Group ${g.groupOrder}: visibleInManual=${g.visibleInManual}, visible=${visible}`);
            }
            return visible;
          })
          .sort((a,b)=>a.groupOrder-b.groupOrder)
          .map((g, idx) => {
          // Special group: Report Content block
          if (g.specialType === 'report-content') {
            if (!((editMode === 'clicker' && g.visibleInClicker !== false) || (editMode === 'manual' && g.visibleInManual !== false))) return null
            const title = g.titleOverride || '📦 Report Content'
            return (
              <ColoredCard key={`rc-${idx}`}>
                <h2 className="section-title">{title}</h2>
                <EditorReportContent
                  stats={project.stats}
                  readOnly={readOnly}
                  editorMounted={contentManagerMounted}
                  onCommit={(newStats) => commitChildStats(project.stats, newStats)}
                />
              </ColoredCard>
            )
          }
          const chart = chartById(g.chartId)
          const kpi = computeKpiValue(chart)
          const title = g.chartId && chart ? chart.title : (g.titleOverride || undefined)
          
          // WHAT: Flexible variable lookup - handle both 'female' and 'stats.female' formats
          // WHY: Groups may have old names (female) but varsConfig has new names (stats.female)
          // HOW: Try exact match first, then try with stats. prefix, then try without prefix
          const items = (g.variables || [])
            .map(name => {
              // Try exact match
              let found = varsConfig.find(v => v.name === name);
              if (found) return found;
              
              // Try adding stats. prefix
              found = varsConfig.find(v => v.name === `stats.${name}`);
              if (found) return found;
              
              // Try removing stats. prefix
              const withoutStats = name.startsWith('stats.') ? name.slice(6) : null;
              if (withoutStats) {
                found = varsConfig.find(v => v.name === withoutStats);
                if (found) return found;
              }
              
              return null;
            })
            .filter((v): v is VariableWithFlags => !!v && !v.derived && !!v.flags)
          const filtered = editMode === 'clicker'
            ? items.filter(v => v.flags?.visibleInClicker)
            : items.filter(v => v.flags?.editableInManual)
          // WHAT: Hide group block if no variables are visible in current mode
          // WHY: Prevents empty "Success Manager" or other titled blocks from appearing
          if (filtered.length === 0) return null
          return (
            <ColoredCard key={idx}>
              {title && (
                <h2 className="section-title">
                  {title} {kpi !== 'NA' ? <span className="value-pill value-pill-spaced">{kpi}</span> : null}
                </h2>
              )}
              <div className="stats-cards-row">
                {filtered.map(v => {
                  // WHAT: Normalize variable key (strip stats. prefix)
                  // WHY: Variables are stored as stats.female but MongoDB structure is { stats: { female: 120 } }
                  const normalizedName = normalizeKey(v.name);
                  const isRemoteFans = normalizedName === fansCfg.remoteFansVar || v.name === fansCfg.remoteFansVar;
                  
                  // WHAT: Render based on variable type (new type system)
                  // WHY: Each type has specific UI requirements
                  
                  // WHAT: textarea - Multi-line text content
                  if (v.type === 'textarea') {
                    return (
                      <TextareaField
                        key={v.name}
                        label={v.label}
                        value={getTextField(v.name)}
                        onSave={(text) => saveTextField(v.name, text)}
                        rows={4}
                        disabled={readOnly}
                      />
                    );
                  }
                  
                  // WHAT: textmedia - Image upload to ImgBB
                  if (v.type === 'textmedia') {
                    return (
                      <ImageUploader
                        key={v.name}
                        label={v.label}
                        value={getTextField(v.name)}
                        onChange={(url) => saveImageUrl(v.name, url || '')}
                        maxSizeMB={10}
                        disabled={readOnly}
                      />
                    );
                  }
                  
                  // WHAT: texthyper - URL, email, phone (single line with validation hint)
                  if (v.type === 'texthyper') {
                    return (
                      <UnifiedTextInput
                        key={v.name}
                        label={v.label}
                        value={getTextField(v.name)}
                        onSave={(text) => saveTextField(v.name, text)}
                        placeholder="URL, email, phone, or social handle"
                        disabled={readOnly}
                      />
                    );
                  }
                  
                  // WHAT: text - Single line text (title, name, short notes)
                  if (v.type === 'text') {
                    return (
                      <UnifiedTextInput
                        key={v.name}
                        label={v.label}
                        value={getTextField(v.name)}
                        onSave={(text) => saveTextField(v.name, text)}
                        disabled={readOnly}
                      />
                    );
                  }
                  
                  return editMode === 'clicker' ? (
                    isRemoteFans ? (
                      <EditorStatCard key={v.name}
                        label={v.label}
                        value={remoteFansCalc}
                        readOnly={readOnly}
                        onIncrement={() => commitCount(fansCfg.remoteFansVar, 1, remoteFansOf)}
                        onDecrement={() => commitCount(fansCfg.remoteFansVar, -1, remoteFansOf)}
                      />
                    ) : (
                      <EditorStatCard
                        key={v.name}
                        label={v.label}
                        value={getStat(v.name)}
                        readOnly={readOnly}
                        onIncrement={() => incrementStat(normalizedName)}
                        onDecrement={() => decrementStat(normalizedName)}
                      />
                    )
                  ) : (
                    isRemoteFans ? (
                      <EditorNumberCard
                        key={v.name}
                        label={v.label}
                        value={remoteFansCalc}
                        variableType={v.type}
                        readOnly={readOnly}
                        onSave={(newValue) => updateManualField(fansCfg.remoteFansVar, newValue)}
                      />
                    ) : (
                      <EditorNumberCard
                        key={v.name}
                        label={v.label}
                        value={getStat(v.name)}
                        variableType={v.type}
                        readOnly={readOnly}
                        onSave={(newValue) => updateManualField(normalizedName, newValue)}
                      />
                    )
                  );
                })}
              </div>
            </ColoredCard>
          )
        })}
        {groups.length === 0 && (
          <ColoredCard>
            <h2 className="section-title">No groups configured</h2>
            <p className="text-muted">Go to Admin → KYC Variables to configure variable groups.</p>
            {varsConfig.length > 0 && (
              <p className="text-success-spaced">✅ {varsConfig.length} variables loaded from database</p>
            )}
            {varsConfig.length === 0 && varsLoading && (
              <p className="text-warning-spaced">⏳ Loading variables...</p>
            )}
          </ColoredCard>
        )}
        
        {/* REMOVED LEGACY SECTIONS */}
        {/* Legacy sections (Images, Fans, Gender, Age, Merch, Success Manager, Hashtags) removed */}
        {/* All variables are now rendered through the groups-driven system configured at /admin/variables */}
        
        {/* Custom Variables Section (supports newly added variables) */}
        {(() => {
          const customVars = varsConfig.filter(v => v.isCustom && (v.type === 'count' || v.type === 'numeric') && !!v.flags)
          if (customVars.length === 0) return null
          const showAny = editMode === 'clicker'
            ? customVars.some(v => v.flags?.visibleInClicker)
            : customVars.some(v => v.flags?.editableInManual)
          if (!showAny) return null
          return (
            <ColoredCard>
              <h2 className="section-title">🧩 Custom Variables</h2>
              <div className="stats-cards-row">
                {editMode === 'clicker' ? (
                  <>
                    {customVars.filter(v => v.flags?.visibleInClicker).map(v => (
                      <EditorStatCard
                        key={v.name}
                        label={v.label}
                        value={getStat(v.name)}
                        readOnly={readOnly}
                        onIncrement={() => incrementDynamic(v.name)}
                        onDecrement={() => decrementDynamic(v.name)}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {customVars.filter(v => v.flags?.editableInManual).map(v => (
                      <EditorNumberCard
                        key={v.name}
                        label={v.label}
                        value={getStat(v.name)}
                        variableType={v.type}
                        readOnly={readOnly}
                        onSave={(newValue) => setStat(v.name, newValue)}
                      />
                    ))}
                  </>
                )}
              </div>
            </ColoredCard>
          )
        })()}
        
        {/* Hashtag Management Section - REMOVED per user request */}
        {/* Hashtags are now managed elsewhere in the system */}
        {/* Bitly Links Management Section - MOVED to Edit Project modal in admin/projects */}

        {/* Report Content fallback: if no special group configured, keep old behavior */}
        {(() => {
          const hasSpecial = groups.some(g => g.specialType === 'report-content')
          if (hasSpecial) return null
          if (!(editMode === 'clicker' || editMode === 'manual')) return null
          return (
            <ColoredCard>
              <h2 className="section-title">📦 Report Content</h2>
              <EditorReportContent
                stats={project.stats}
                readOnly={readOnly}
                editorMounted={contentManagerMounted}
                onCommit={(newStats) => commitChildStats(project.stats, newStats)}
              />
            </ColoredCard>
          )
        })()}
        </>
        )}
      </div>
      </fieldset>

      {/* Last in the page and pinned while scrolling (position: sticky), so it
          never covers the last row of cards. A read-only editor reports its
          unsaved changes in the notice at the top instead. */}
      {!readOnly && (
        <EditorSaveProblemBanner
          queue={saveQueue}
          draftStored={draftStored}
          accessBlocked={accessBlocked}
          onRetryNow={saveNow}
        />
      )}
    </div>
  );
}
