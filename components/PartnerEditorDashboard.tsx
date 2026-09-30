'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Image from 'next/image';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import ImageUploader from './ImageUploader';
import ReportContentManager from './ReportContentManager';
import UnifiedTextInput from './UnifiedTextInput';
import UnifiedCheckboxField from './UnifiedCheckboxField';
import { getAllHashtagRepresentations } from '@/lib/hashtagCategoryUtils';
import {
  addSentValues,
  createAccessRecovery,
  createSaveQueue,
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
  writeDraft,
  type AccessCheckResult,
  type AccessRecovery,
  type DraftFields,
  type DraftRestorePlan,
  type HeldBackDraft,
  type SaveQueue,
  type SaveQueueSnapshot,
  type SentValues,
  type StoredDraft,
} from '@/lib/editorSaveQueue';
import styles from '@/app/styles/editor-states.module.css';
import reportStyles from './ReportContentManager.module.css';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  showEmoji?: boolean;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleId?: string;
  reportTemplateId?: string;
  clickerSetId?: string;
  showEventsList?: boolean; // WHAT: Controls visibility of events list on partner report page
  showEventsListTitle?: boolean; // WHAT: Controls visibility of events list title on partner report page
  showEventsListDetails?: boolean; // WHAT: Controls whether event cards show detailed info or just titles
  showOnlyTeam1Events?: boolean; // WHAT: Restrict partner report data to local-home / team-1 appearances
  createdAt: string;
  updatedAt: string;
  // WHAT: Partner-level stats for content editing only
  // WHY: Mathematical data comes from events, only text/image content is editable
  stats: {
    [key: string]: string | undefined;
  };
}

type PartnerStats = Partner['stats'];

interface PartnerEditorDashboardProps {
  partner: Partner;
  variantSlug?: string | null;
  /**
   * Epoch ms when the request that produced `partner` was sent. Lets a re-fetch
   * that raced a local change or a save be recognised as possibly stale.
   */
  fetchStartedAt?: number;
  /**
   * The server's answer to "may this caller save this partner?" from the load
   * that produced `partner` (GET /api/partners/edit/[slug]). false: the editor
   * is read-only and says why. undefined: not reported; assume yes.
   */
  canSave?: boolean;
  /**
   * Re-establish save access after the server refused a save with 401: the
   * page re-loads the partner (which renews a password grant) or shows the
   * password prompt. Resolves 'granted' once saving may be retried, 'blocked'
   * when this caller cannot save, 'retry' when access could not be checked.
   * Without it, the editor simply retries the save with backoff.
   */
  onRequestAccess?: () => Promise<AccessCheckResult>;
}

// WHAT: A custom report variant (?variant=<slug>) saves to its own route; the
//     default report saves the partner itself.
const isCustomVariant = (variantSlug?: string | null): variantSlug is string =>
  Boolean(variantSlug && variantSlug !== 'default');

// WHAT: Where this editor keeps unsaved changes on this device: one scope per
//     partner, and one per custom variant of it (they are stored separately).
// WHY: The draft key is `<prefix><scope>:<tabId>` (lib/editorSaveQueue.ts). The
//     `partner-` prefix keeps these apart from event drafts (scoped by the
//     event's ObjectId), and the default scope ends at the id, so its key
//     prefix never matches a variant's keys.
export function partnerDraftScope(partnerId: string, variantSlug?: string | null): string {
  return isCustomVariant(variantSlug) ? `partner-${partnerId}-variant-${variantSlug}` : `partner-${partnerId}`;
}

// WHAT: What the partner editor changes: report content, logo and the
//     events-list switches. The part a draft keeps and a re-fetch may merge.
//     Name, emoji, hashtags, style and template are the server's.
const CONTENT_FLAGS = ['showEventsList', 'showEventsListTitle', 'showEventsListDetails', 'showOnlyTeam1Events'] as const;
type ContentFlag = (typeof CONTENT_FLAGS)[number];

type PartnerContent = { stats: PartnerStats; logoUrl?: string } & { [K in ContentFlag]?: boolean };

const contentOf = (p: Partner): PartnerContent => ({
  stats: p.stats || {},
  logoUrl: p.logoUrl || undefined,
  showEventsList: p.showEventsList,
  showEventsListTitle: p.showEventsListTitle,
  showEventsListDetails: p.showEventsListDetails,
  showOnlyTeam1Events: p.showOnlyTeam1Events,
});

// Every content key is set explicitly, so an absent value (a removed logo)
// replaces the server's value instead of letting it through the spread.
const withContent = (p: Partner, content: PartnerContent): Partner => ({
  ...p,
  stats: content.stats,
  logoUrl: content.logoUrl,
  showEventsList: content.showEventsList,
  showEventsListTitle: content.showEventsListTitle,
  showEventsListDetails: content.showEventsListDetails,
  showOnlyTeam1Events: content.showOnlyTeam1Events,
});

// WHAT: Flatten content into independently mergeable fields and back.
// WHY: The draft restore rule (lib/editorSaveQueue.ts, "Unsaved-change
//     drafts") works per field, so a report text changed here and a switch
//     changed by an admin never conflict. Each report slot is one field.
//     An empty logo URL counts as no logo: the server stores it either way.
const STAT_FIELD = 'stats:';

function toFields(content: PartnerContent): DraftFields {
  const fields: DraftFields = {};
  if (content.logoUrl) fields.logoUrl = content.logoUrl;
  for (const flag of CONTENT_FLAGS) {
    if (typeof content[flag] === 'boolean') fields[flag] = content[flag];
  }
  for (const [key, value] of Object.entries(content.stats || {})) {
    if (value !== undefined) fields[STAT_FIELD + key] = value;
  }
  return fields;
}

function fromFields(fields: DraftFields): PartnerContent {
  const stats: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith(STAT_FIELD) && value !== undefined) stats[key.slice(STAT_FIELD.length)] = value;
  }
  const flag = (key: ContentFlag) => (typeof fields[key] === 'boolean' ? (fields[key] as boolean) : undefined);
  return {
    stats: stats as PartnerStats,
    logoUrl: typeof fields.logoUrl === 'string' && fields.logoUrl ? fields.logoUrl : undefined,
    showEventsList: flag('showEventsList'),
    showEventsListTitle: flag('showEventsListTitle'),
    showEventsListDetails: flag('showEventsListDetails'),
    showOnlyTeam1Events: flag('showOnlyTeam1Events'),
  };
}

const fieldsOf = (p: Partner) => toFields(contentOf(p));

// WHAT: The save request for one snapshot of what the partner editor stores:
//     each report slot, the logo and each events-list switch that differs from
//     `base` -- the content the server is known to hold (the loaded copy, then
//     each confirmed save) -- plus, when given, the tab and number of this
//     request for the late-write guard. `fields` are the draft fields it names,
//     which the base moves to once the server confirms it.
// WHY: Both routes stay: PUT /api/partners/edit/<id>?variant=<slug> for a
//     custom variant (metadata only), PUT /api/partners for the default
//     report. Both write report content field-level (statsChanges, and
//     statsRemoved for a slot that is gone) as `stats.<key>` paths, so a slot
//     another device or an admin saved since this editor loaded is not put
//     back to this tab's copy -- sending the whole content did that, and the
//     other device kept showing its change as saved. Both skip an absent
//     field, so a logo or switch this editor did not change is left out: the
//     queue retries a refused save for minutes and a restored draft is saved
//     hours later, and an echoed value would put back one changed since
//     (camera sync sets partner logos; an admin sets the switches). On a
//     variant, the load shows the partner's logo while the variant has none of
//     its own; echoing it pinned it into the variant, which then stopped
//     following the partner. The name, emoji, hashtags, style and template are
//     never sent, for the same reasons.
// HOW: The payload is still a full snapshot, and the difference is taken when
//     it is sent, so the queue may still drop an older payload for a newer
//     one: a change in a save that failed still differs from `base` in the
//     next payload, and goes out with it.
// NOTE: A removed logo is sent as '' on both routes (an absent field is
//     skipped, so a removal used to stay stored and came back on the next
//     load). PUT /api/partners stores ''. On a variant, '' means "no logo of
//     its own": the variant route has to store it as a removal, and the
//     variant then shows the partner's logo. tabId and clientSeq go at the top
//     of the body on both routes (next to `metadata` on the variant route).
export function partnerSaveRequest(
  partner: Partner,
  variantSlug: string | null | undefined,
  base: DraftFields,
  sequence?: { tabId: string; clientSeq: number }
): { url: string; body: Record<string, unknown>; fields: DraftFields } {
  const fields = fieldsOf(partner);
  const named: DraftFields = {};
  const statsChanges: Record<string, unknown> = {};
  const statsRemoved: string[] = [];
  for (const key of new Set([...Object.keys(base), ...Object.keys(fields)])) {
    if (!key.startsWith(STAT_FIELD) || sameFieldValue(fields[key], base[key])) continue;
    const stat = key.slice(STAT_FIELD.length);
    if (fields[key] === undefined) statsRemoved.push(stat);
    else statsChanges[stat] = fields[key];
    named[key] = fields[key];
  }
  const content: Record<string, unknown> = { statsChanges };
  if (statsRemoved.length > 0) content.statsRemoved = statsRemoved;
  if (!sameFieldValue(fields.logoUrl, base.logoUrl)) {
    content.logoUrl = fields.logoUrl ?? '';
    named.logoUrl = fields.logoUrl;
  }
  for (const flag of CONTENT_FLAGS) {
    // A switch with no value locally cannot be sent as "unset"; it is left out.
    if (typeof fields[flag] === 'boolean' && !sameFieldValue(fields[flag], base[flag])) {
      content[flag] = fields[flag];
      named[flag] = fields[flag];
    }
  }
  const guard = sequence ? { tabId: sequence.tabId, clientSeq: sequence.clientSeq } : {};
  if (isCustomVariant(variantSlug)) {
    return {
      url: `/api/partners/edit/${encodeURIComponent(partner._id)}?variant=${encodeURIComponent(variantSlug)}`,
      body: { metadata: content, ...guard },
      fields: named,
    };
  }
  return { url: '/api/partners', body: { partnerId: partner._id, ...content, ...guard }, fields: named };
}

// WHAT: Values from this device's drafts that were NOT restored because the
//     server changed the same values since they were made (another tab, an
//     admin). Every other value of those drafts was restored. Kept in storage
//     until the operator picks a side.
interface DraftConflictItem {
  /** Draft field, e.g. `stats:reportText2` or `logoUrl`. */
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
export interface KeptPartnerDrafts {
  /** Newest local edit among those drafts (this device's clock). */
  editedAt: number;
  /** Some of their values are put back as they are once editing is possible. */
  restores: boolean;
  /** Values also changed on the server since: the operator chooses once editing is possible. */
  heldBack: number;
}

// WHY: Measured by the same rule a load with save access applies
//     (planDraftRestore), so the notice never promises back values the server
//     already holds, and does not call a value "restored" that will be held
//     back for a choice.
function summarizeKeptDrafts(plan: DraftRestorePlan): KeptPartnerDrafts | null {
  const unsaved = [...plan.adopted, ...plan.conflicted.map((c) => c.draft)];
  if (unsaved.length === 0) return null;
  return {
    editedAt: Math.max(...unsaved.map((d) => d.editedAt)),
    restores: plan.restored.length > 0,
    heldBack: new Set(plan.conflicted.flatMap((c) => c.conflicts)).size,
  };
}

interface PartnerBootstrap {
  partner: Partner;
  /** Newest editedAt of the drafts that put back a value, or null when none did. */
  restoredDraftAt: number | null;
  /** Drafts merged into the initial state; removed once this tab stores its own. */
  adopted: StoredDraft[];
  /** Drafts with nothing the server lacks; removed on mount. */
  obsolete: StoredDraft[];
  conflict: DraftConflict | null;
  /** Read-only load: this device holds drafts, left untouched until editing is possible. */
  draftsLeft: boolean;
  /** Read-only load: what the notice says about them, or null when none holds anything unsaved. */
  kept: KeptPartnerDrafts | null;
}

// WHAT: Initial editor state: the server copy, plus every unsaved value from
//     this device's drafts that can be put back without overwriting a later
//     change -- the same rule as the event editor (see the RESTORE RULE in
//     lib/editorSaveQueue.ts). A value a draft changed is restored when the
//     server still has the value the draft started from (or one this device
//     sent); a value changed on both sides waits for the operator.
// READ-ONLY: When the server says this caller cannot save, nothing is restored
//     and the drafts stay as they are: unsaved values shown in a view that
//     cannot save them would read as the partner's stored values. The restore
//     is only planned, for the notice; it runs once the editor may save.
function bootstrapFromServer(server: Partner, scope: string, readOnly: boolean): PartnerBootstrap {
  const plain: PartnerBootstrap = {
    partner: server,
    restoredDraftAt: null,
    adopted: [],
    obsolete: [],
    conflict: null,
    draftsLeft: false,
    kept: null,
  };
  const drafts = readDrafts(getDraftStorage(), scope);
  if (drafts.length === 0) return plain;

  const serverFields = fieldsOf(server);
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
  if (plan.restored.length === 0) return { ...plain, obsolete: plan.obsolete, conflict };

  return {
    partner: withContent(server, fromFields(plan.fields)),
    restoredDraftAt: plan.restoredEditedAt,
    adopted: plan.adopted,
    obsolete: plan.obsolete,
    conflict,
    draftsLeft: false,
    kept: null,
  };
}

// WHAT: What the conflict notice calls a draft field, and how it shows a value.
const FIELD_LABELS: Record<string, string> = {
  logoUrl: 'Logo URL',
  showEventsList: 'Show events list',
  showEventsListTitle: 'Show events list title',
  showEventsListDetails: 'Show event card details',
  showOnlyTeam1Events: 'Only local/home events',
};

function formatFieldValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return 'empty';
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.length > 40 ? `"${value.slice(0, 37)}..."` : `"${value}"`;
  return null; // nested values: named, not shown
}

// e.g. `reportText2: this device "New caption", saved "Old caption"`.
function describeConflictItem(item: DraftConflictItem): string {
  const label = FIELD_LABELS[item.key] ?? (item.key.startsWith(STAT_FIELD) ? item.key.slice(STAT_FIELD.length) : item.key);
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

function useSaveSnapshot(queue: SaveQueue<Partner> | null): SaveQueueSnapshot {
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
//     had been stored -- the same silent loss as the event editor on 2026-09-27.
// HOW: Its own component subscribed to the queue, so status changes re-render
//     only this line. The visible line is not a live region (it changes on
//     every edit); a hidden one announces only when saving starts failing,
//     changes how it fails, or recovers.
// READ-ONLY: Says so instead of "Ready" or "Saved", which read as "go ahead".
export function PartnerSaveStatusLine({
  queue,
  readOnly = false,
}: {
  queue: SaveQueue<Partner> | null;
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

// The read-only notice's sentence about the drafts a read-only load kept.
function keptDraftsText(kept: KeptPartnerDrafts): string {
  const intro = `Unsaved changes from this device (last edit ${formatEditTime(kept.editedAt)}) are kept`;
  if (kept.heldBack === 0) return ` ${intro} and restored once you can edit.`;
  const changed = `${kept.heldBack === 1 ? '1 value was' : `${kept.heldBack} values were`} also changed on the server since`;
  return kept.restores
    ? ` ${intro} and restored once you can edit. ${changed}; you choose which to keep then.`
    : ` ${intro}. ${changed}; you choose which to keep once you can edit.`;
}

// WHAT: The notice at the top of a read-only partner editor (GET said
//     canSave: false): what is wrong, what to do, and what happens to changes
//     this device has not saved.
// WHY: An unprotected partner editor gets no save grant (its slug is the
//     public report slug), so without an admin session or the partner-edit
//     password every save would be refused. The editor says so before
//     anything else instead of taking input it cannot store.
// HOW: Same pattern and classes as the event editor's notice: first element,
//     pinned with position: sticky, role="alert". The count comes from the
//     save queue -- edits made before access was lost stay queued and in the
//     draft, and are sent once access returns. Retry now re-checks access.
export function PartnerReadOnlyNotice({
  queue,
  draftStored,
  kept,
  onRetryNow,
}: {
  queue: SaveQueue<Partner> | null;
  draftStored: boolean;
  kept: KeptPartnerDrafts | null;
  onRetryNow: () => void;
}) {
  const s = useSaveSnapshot(queue);
  const unsaved = s.pendingCount;
  const unsavedIs = `${unsaved} unsaved ${unsaved === 1 ? 'change is' : 'changes are'}`;
  return (
    <div className={`alert alert-warning ${styles.readOnlyNotice}`} role="alert">
      <p className={styles.bannerText}>
        <strong>You can view this partner but not save changes.</strong> Sign in to edit.
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
// WHY: The header scrolls away; an editor working further down must still see
//     that nothing is being stored and what happens next.
// HOW: Last element of the editor, pinned with position: sticky (the event
//     editor's .saveBanner), so it never covers the last card.
export function PartnerSaveProblemBanner({
  queue,
  draftStored,
  accessBlocked,
  onRetryNow,
}: {
  queue: SaveQueue<Partner> | null;
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
        ? 'This page cannot save changes.'
        : asSentence(s.lastError || (s.state === 'needs-access' ? 'Access to save was refused' : 'The server did not accept the save'));
  const where = draftStored ? 'Kept on this device' : 'Only on this page - do not close or reload it';
  // A refusal is not retried automatically: the same save would be refused again.
  const next =
    s.state === 'offline'
      ? 'sending when the connection is back'
      : blocked
        ? 'sign in, then press Retry now'
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

// Stored report slots of one kind (reportImageN / reportTextN), by slot number.
function reportSlots(stats: PartnerStats, prefix: 'reportImage' | 'reportText'): Array<{ index: number; value: string }> {
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
//     switch, and the disabled fieldset turns that switch off with its other
//     buttons, so a read-only viewer could never see the texts. Same view as
//     the event editor's (EditorReportContentView), with ReportContentManager's
//     slot layout and styles.
function PartnerReportContentView({ stats }: { stats: PartnerStats }) {
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

export default function PartnerEditorDashboard({
  partner: initialPartner,
  variantSlug,
  fetchStartedAt,
  canSave,
  onRequestAccess,
}: PartnerEditorDashboardProps) {
  // WHAT: Read-only when the server says this caller cannot save (canSave:
  //     false): every control is disabled, values stay visible, and the notice
  //     at the top says why.
  // WHY: Owner decision D2. An unprotected partner editor gets no save grant
  //     (its slug is the public report slug), so only an admin session or the
  //     partner-edit password can save. An editor that cannot save must not
  //     take input.
  // HOW: Derived from the newest load on every render, never latched: a
  //     re-fetch that answers canSave: true (or the password prompt being
  //     passed, which re-loads) makes the editor editable again in place. The
  //     commit paths still record whatever reaches them (an upload that
  //     finishes after the switch), so nothing is dropped.
  const readOnly = canSave === false;
  const readOnlyRef = useRef<boolean>(readOnly);
  readOnlyRef.current = readOnly;

  // WHAT: Report Content's editor stays mounted (hidden) once it has been
  //     shown, when the editor turns read-only partway through a session.
  // WHY: Its report text boxes are recorded on blur and its bulk-paste box on
  //     "Add Lines"; unmounting them threw away whatever was typed there. The
  //     page commits the field being edited before the switch
  //     (PartnerEditClient); anything else typed stays on screen, hidden,
  //     until editing resumes. A load that is read-only from the start never
  //     mounts it.
  const [contentManagerMounted, setContentManagerMounted] = useState<boolean>(!readOnly);
  if (!readOnly && !contentManagerMounted) setContentManagerMounted(true);

  // The editor's outermost element: a focused field inside it is committed
  // before the page is closed or hidden (see the leave/hide effect below).
  const rootRef = useRef<HTMLDivElement | null>(null);

  const scope = partnerDraftScope(initialPartner._id, variantSlug);

  // WHAT: Initial state: the server copy with this device's restorable unsaved
  //     drafts put back (see bootstrapFromServer). Computed once; the effect
  //     below handles later re-fetches.
  const [bootstrap] = useState<PartnerBootstrap>(() => bootstrapFromServer(initialPartner, scope, readOnly));
  // WHAT: This editor instance's id: its draft key (one per tab, so tabs never
  //     overwrite each other) and the tabId of its saves, which the server's
  //     late-write guard orders by clientSeq. Kept only in memory, for the
  //     reasons given in the event editor.
  const [tabId] = useState<string>(createTabId);
  // clientSeq of the last new request sent; a retry of the same payload repeats it.
  const clientSeqRef = useRef<number>(0);
  const [partner, setPartner] = useState<Partner>(bootstrap.partner);
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(bootstrap.restoredDraftAt);
  const [draftConflict, setDraftConflict] = useState<DraftConflict | null>(bootstrap.conflict);
  // Drafts a read-only load left on this device, restored once saving is possible
  // (the ref), and what the read-only notice says about them (the state).
  const draftsLeftRef = useRef<boolean>(bootstrap.draftsLeft);
  const [keptDrafts, setKeptDrafts] = useState<KeptPartnerDrafts | null>(bootstrap.kept);
  const [draftStored, setDraftStored] = useState<boolean>(true);
  // The access re-check answered "this page cannot save": automatic retries stopped.
  const [accessBlocked, setAccessBlocked] = useState<boolean>(false);
  const [saveQueue, setSaveQueue] = useState<SaveQueue<Partner> | null>(null);

  // WHAT: The newest local data, written synchronously on every change.
  // WHY: React state only catches up on the next render. Handlers and the save
  //     queue read this, so a change always builds on the previous one.
  const latestRef = useRef<Partner>(bootstrap.partner);
  // True from a local change until the server confirms a save that includes it.
  const hasUnsavedRef = useRef<boolean>(bootstrap.restoredDraftAt !== null);
  // WHEN the base last moved to a confirmed save. A re-fetch that left before
  // that may predate the save, so its copy is not merged (see applyServerCopy).
  const lastBaseMoveAtRef = useRef<number>(0);
  // fetchStartedAt of the newest server copy applied; an older one is ignored.
  const lastAppliedFetchAtRef = useRef<number>(fetchStartedAt ?? 0);
  // Last local change only; stored with the draft and shown when it is restored.
  const lastEditAtRef = useRef<number>(bootstrap.restoredDraftAt ?? 0);
  // WHAT: The content the server is known to hold: the loaded copy, then each
  //     payload it confirms. Stored as the draft's base and used to merge
  //     re-fetched copies.
  const [initialBaseFields] = useState<DraftFields>(() => fieldsOf(initialPartner));
  const baseFieldsRef = useRef<DraftFields>(initialBaseFields);
  // WHAT: Values sent since the base without a confirmation, stored with the
  //     draft, so a reload after a save whose answer was lost recognises the
  //     server's value as this device's own write.
  const sentRef = useRef<SentValues>({});
  const serverPartnerRef = useRef<Partner>(initialPartner);
  const queueRef = useRef<SaveQueue<Partner> | null>(null);
  const accessRecoveryRef = useRef<AccessRecovery | null>(null);
  const onRequestAccessRef = useRef(onRequestAccess);

  useEffect(() => {
    onRequestAccessRef.current = onRequestAccess;
  }, [onRequestAccess]);

  const buildPayload = useCallback((): Partner => latestRef.current, []);

  // WHAT: Store this tab's draft: the newest local content and its base.
  // RETURNS: false when this device could not store it (the banner then says
  //     the changes exist only on this page).
  const persistDraft = useCallback((): boolean => {
    const draft: StoredDraft = {
      v: 1,
      scope,
      tabId,
      editedAt: lastEditAtRef.current || Date.now(),
      base: baseFieldsRef.current,
      fields: fieldsOf(latestRef.current),
    };
    if (Object.keys(sentRef.current).length > 0) draft.sent = sentRef.current;
    const stored = writeDraft(getDraftStorage(), draft);
    setDraftStored(stored);
    return stored;
  }, [scope, tabId]);

  // WHAT: Adopt a re-fetched copy of the partner (tab refocus, access re-check)
  //     without overwriting unsaved local edits.
  // WHY: The editor used to reset its state from every new copy, so a re-fetch
  //     that landed while edits were unsaved replaced them with the older
  //     server copy, and the next save stored that older copy.
  // HOW: Name, emoji, hashtags, style and template always come from the
  //     server. Then, as in the event editor:
  //     - A copy older than one already applied is ignored.
  //     - The request left before this tab's last confirmed save: the copy may
  //       predate that save, so the local content is kept as it is.
  //     - Unsaved local changes: merge value by value against the base. Values
  //       only the server changed are taken; values changed here stay; a value
  //       changed on both sides keeps the local one.
  //     - Nothing unsaved: take the server copy.
  //     A load that says this caller may save also renewed a password grant,
  //     so a queue paused on a 401 resumes.
  const applyServerCopy = useCallback(
    (copy: Partner, startedAt: number | undefined, copyCanSave: boolean | undefined) => {
      if (copy === serverPartnerRef.current) return; // already applied
      if (startedAt !== undefined) {
        if (startedAt < lastAppliedFetchAtRef.current) return;
        lastAppliedFetchAtRef.current = startedAt;
      }
      serverPartnerRef.current = copy;

      const queue = queueRef.current;
      const unsaved = hasUnsavedRef.current || (queue?.getSnapshot().pendingCount ?? 0) > 0;
      const maybeStale = startedAt !== undefined && lastBaseMoveAtRef.current >= startedAt;
      const serverFields = fieldsOf(copy);

      let content: PartnerContent;
      let tookServerChanges = false;
      if (maybeStale) {
        content = contentOf(latestRef.current);
      } else if (unsaved) {
        const local = contentOf(latestRef.current);
        const localFields = toFields(local);
        const { merged } = mergeFieldChanges(serverFields, baseFieldsRef.current, localFields, 'take-local');
        baseFieldsRef.current = serverFields;
        tookServerChanges = !sameFieldValue(merged, localFields);
        content = tookServerChanges ? fromFields(merged) : local;
      } else {
        baseFieldsRef.current = serverFields;
        content = contentOf(copy);
      }

      const next = withContent(copy, content);
      latestRef.current = next;
      setPartner(next);

      if (unsaved && !maybeStale) {
        // Keep the stored draft's base in step with what the server holds now.
        persistDraft();
        // The waiting snapshot lacks the server's changes; sending it would undo them.
        if (tookServerChanges) queue?.enqueue(buildPayload());
      }

      if (copyCanSave !== false) {
        setAccessBlocked(false);
        if (queue?.getSnapshot().state === 'needs-access') queue.resume();
      } else if (draftsLeftRef.current) {
        // Still read-only: measure the drafts it left against this copy.
        setKeptDrafts(summarizeKeptDrafts(planDraftRestore(serverFields, readDrafts(getDraftStorage(), scope))));
      }
    },
    [persistDraft, buildPayload, scope]
  );

  useEffect(() => {
    applyServerCopy(initialPartner, fetchStartedAt, canSave);
  }, [initialPartner, fetchStartedAt, canSave, applyServerCopy]);

  // WHAT: Take over the drafts a bootstrap restored (on mount, and when a
  //     read-only editor gains save access): remove the drafts with nothing
  //     the server lacks, store the restored changes in this tab's own draft,
  //     then remove the drafts it adopted, narrow the conflicted ones to their
  //     held-back values, and queue the save.
  // WHY: This tab's own draft must hold the restored changes before the old
  //     keys go -- unless this device could not store it.
  const settleBootstrapDrafts = useCallback(
    (boot: PartnerBootstrap, queue: SaveQueue<Partner>) => {
      const storage = getDraftStorage();
      for (const draft of boot.obsolete) removeDraft(storage, scope, draft.tabId, draft.editedAt);
      const ownDraftHoldsRestored = hasUnsavedRef.current ? persistDraft() : true;
      if (ownDraftHoldsRestored) {
        for (const draft of boot.adopted) removeDraft(storage, scope, draft.tabId, draft.editedAt);
        for (const { draft, held } of boot.conflict?.held ?? []) replaceDraft(storage, held, draft.editedAt);
      }
      if (hasUnsavedRef.current) queue.enqueue(buildPayload());
    },
    [persistDraft, buildPayload, scope]
  );

  // WHAT: One save queue per partner (or variant), plus the 401 recovery that
  //     feeds it.
  // WHY: Every save goes through the queue: one request in flight, rapid
  //     changes coalesced, failures kept and retried until the server confirms
  //     them. A 401 (EDIT_ACCESS_REQUIRED, or the page password on the variant
  //     route) pauses it and asks the page to re-load the partner -- which
  //     renews a password grant or shows the password prompt -- then resumes.
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
    // What each payload's last request named, for the base to move to once
    // it is confirmed; and the attempt id and clientSeq of the last request,
    // so a retry of the same payload goes out under the same number.
    const namedBySent = new WeakMap<Partner, DraftFields>();
    let lastAttempt = { id: 0, clientSeq: 0 };
    const queue = createSaveQueue<Partner>({
      send: (payload, attempt) => {
        // Written down before the request leaves: if its answer never arrives
        // while the save itself went through, the next load recognises the
        // value as this device's.
        sentRef.current = addSentValues(sentRef.current, baseFieldsRef.current, fieldsOf(payload));
        persistDraft();
        if (attempt.id !== lastAttempt.id) {
          clientSeqRef.current += 1;
          lastAttempt = { id: attempt.id, clientSeq: clientSeqRef.current };
        }
        const request = partnerSaveRequest(payload, variantSlug, baseFieldsRef.current, {
          tabId,
          clientSeq: lastAttempt.clientSeq,
        });
        namedBySent.set(payload, request.fields);
        return sendJsonForSave(request.url, request.body);
      },
      // Also after a { stale: true } answer: a request from this tab with the
      // same or a later clientSeq was stored first, and it named everything
      // this one did that the server did not already hold.
      onSaved: (payload, { pendingCount }) => {
        lastBaseMoveAtRef.current = Date.now();
        recovery.reset();
        setAccessBlocked(false);
        // The server now holds what this payload's request named -- and only
        // that is known: the base moves for exactly those fields. A value the
        // base took from a re-fetch while the request was out stays as it is.
        const base: DraftFields = { ...baseFieldsRef.current };
        for (const [key, value] of Object.entries(namedBySent.get(payload) ?? fieldsOf(payload))) {
          if (value === undefined) delete base[key];
          else base[key] = value;
        }
        baseFieldsRef.current = base;
        sentRef.current = {};
        if (pendingCount === 0) {
          // The confirmed payload is the newest local data: the draft is safe to drop.
          hasUnsavedRef.current = false;
          removeDraft(storage, scope, tabId);
        } else {
          // Newer changes are still waiting: store them against the new base.
          persistDraft();
        }
      },
      onNeedsAccess: () => recovery.request(),
    });
    accessRecoveryRef.current = recovery;
    queueRef.current = queue;
    setSaveQueue(queue);

    // Restored drafts still need saving.
    settleBootstrapDrafts(bootstrap, queue);

    return () => {
      // Send what is waiting before letting go; the draft stays until confirmed.
      queue.flush();
      queue.dispose();
      recovery.dispose();
      if (queueRef.current === queue) queueRef.current = null;
      if (accessRecoveryRef.current === recovery) accessRecoveryRef.current = null;
    };
  }, [scope, tabId, variantSlug, bootstrap, persistDraft, settleBootstrapDrafts]);

  // WHAT: Restore the drafts a read-only load kept, as soon as the editor may
  //     save (a re-fetch answered canSave: true, or the password prompt was
  //     passed), without a reload.
  // HOW: As in the event editor: draftsLeftRef is set only while the editor has
  //     been read-only since it loaded, so it has nothing of its own; the
  //     drafts are restored against the server copy it shows, by the same rule
  //     as a fresh load, and taken over like on mount.
  useEffect(() => {
    if (readOnly || !draftsLeftRef.current) return;
    const queue = queueRef.current;
    if (!queue) return;
    draftsLeftRef.current = false;
    setKeptDrafts(null);
    if (hasUnsavedRef.current || queue.getSnapshot().pendingCount > 0) return;

    const server = serverPartnerRef.current;
    const next = bootstrapFromServer(server, scope, false);
    baseFieldsRef.current = fieldsOf(server);
    latestRef.current = next.partner;
    hasUnsavedRef.current = next.restoredDraftAt !== null;
    if (next.restoredDraftAt !== null) lastEditAtRef.current = next.restoredDraftAt;
    setPartner(next.partner);
    setRestoredDraftAt(next.restoredDraftAt);
    setDraftConflict(next.conflict);
    settleBootstrapDrafts(next, queue);
  }, [readOnly, scope, settleBootstrapDrafts]);

  // WHAT: Never lose queued edits to closing, hiding or a dropped connection.
  // WHY: A mobile browser may discard a backgrounded tab without warning, so
  //     waiting edits are sent the moment the page is hidden; closing or
  //     reloading with anything unsaved asks for confirmation first.
  // HOW: The field being typed in is committed first. Report texts and the
  //     logo URL are recorded when they lose focus, and closing, reloading or
  //     hiding the tab does not blur them: the value was never in the draft or
  //     the queue, the leave warning did not fire for it, and it was gone.
  //     Blurring it here records it like any other change (draft, then queue)
  //     before anything is checked or sent. Same as the event editor.
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

  // WHAT: Record a local change: keep it on this device, then queue the save.
  // WHY: The draft is written before the request, so a refused or lost save can
  //     no longer lose the data; it is removed only once the server confirms it.
  // RETURNS: whether this device stored the draft.
  const recordLocalChange = useCallback((): boolean => {
    hasUnsavedRef.current = true;
    lastEditAtRef.current = Date.now();
    const stored = persistDraft();
    queueRef.current?.enqueue(buildPayload());
    return stored;
  }, [buildPayload, persistDraft]);

  // WHAT: Apply one change to the partner and queue it for saving.
  // WHY: Handlers used to spread the render-time `partner`, so two changes
  //     handled before a re-render built on the same stale copy and the second
  //     undid the first. `update` receives the newest copy (latestRef). A
  //     change that alters nothing the editor stores (a field left unchanged)
  //     queues nothing.
  const commitPartner = useCallback(
    (update: (prev: Partner) => Partner): boolean => {
      const current = latestRef.current;
      const next = update(current);
      if (next === current || sameFieldValue(fieldsOf(next), fieldsOf(current))) return true;
      latestRef.current = next;
      setPartner(next);
      return recordLocalChange();
    },
    [recordLocalChange]
  );

  // WHAT: Commit stats built by ReportContentManager.
  // WHY: It spreads the `stats` prop of the render it came from -- after an
  //     image upload, possibly seconds old. Replacing the whole object would
  //     undo any change made meanwhile, so only the keys it actually changed
  //     (or removed) relative to that snapshot are applied.
  const commitReportStats = useCallback(
    (base: PartnerStats, next: Record<string, unknown>) => {
      commitPartner((prev) => {
        const changed: Record<string, unknown> = {};
        for (const key of Object.keys(next)) {
          if (next[key] !== base[key]) changed[key] = next[key];
        }
        const removed = Object.keys(base).filter((key) => !(key in next));
        if (Object.keys(changed).length === 0 && removed.length === 0) return prev;
        const merged = { ...prev.stats, ...changed } as Record<string, unknown>;
        for (const key of removed) delete merged[key];
        return { ...prev, stats: merged as PartnerStats };
      });
    },
    [commitPartner]
  );

  // WHAT: The operator's answer to the draft conflict notice.
  // WHY: Only the held-back values are in question: the server changed each of
  //     them since this device did. "Use this device's values" puts the listed
  //     values on screen and saves them; "Keep saved values" discards exactly
  //     the listed values.
  const resolveDraftConflict = (useDeviceValues: boolean) => {
    const conflict = draftConflict;
    if (!conflict || readOnlyRef.current) return;
    setDraftConflict(null);
    let stored = true;
    if (useDeviceValues) {
      stored = commitPartner((prev) => {
        const fields: DraftFields = { ...fieldsOf(prev) };
        for (const item of conflict.items) {
          if (item.local === undefined) delete fields[item.key];
          else fields[item.key] = item.local;
        }
        return withContent(prev, fromFields(fields));
      });
    }
    // Keep the old drafts if their values could not be stored in this tab's own.
    if (stored) {
      const storage = getDraftStorage();
      for (const { draft, conflicts } of conflict.held) discardDraftFields(storage, draft, conflicts);
    }
  };

  // WHAT: Save now: retry a failed save at once, or re-check access when the
  //     server refused it. Behind the Retry now buttons.
  const saveNow = useCallback(() => {
    const queue = queueRef.current;
    if (!queue) return;
    if (queue.getSnapshot().state === 'needs-access') {
      accessRecoveryRef.current?.requestNow();
      return;
    }
    // A save the server refused for good is sent once more, first.
    if (queue.getSnapshot().rejectedCount > 0) {
      queue.retryRejected();
      return;
    }
    queue.flush();
  }, []);

  const setFlag = (flag: ContentFlag, checked: boolean) => {
    commitPartner((prev) => ({ ...prev, [flag]: checked }));
  };

  const handleLogoUrlSave = (logoUrl: string) => {
    const normalizedLogoUrl = logoUrl.trim();
    commitPartner((prev) => ({ ...prev, logoUrl: normalizedLogoUrl || undefined }));
  };

  const handleLogoUpload = (logoUrl: string | null) => {
    commitPartner((prev) => ({ ...prev, logoUrl: logoUrl || undefined }));
  };

  // Get all hashtag representations for display
  const allHashtagRepresentations = getAllHashtagRepresentations({
    hashtags: partner.hashtags || [],
    categorizedHashtags: partner.categorizedHashtags || {}
  });

  const showEventsList = partner.showEventsList ?? true;

  return (
    <div className="admin-container" ref={rootRef}>
      {/* First on the page, above the header and every input, and pinned while
          scrolling: an editor that cannot save says so before anything else. */}
      {readOnly && (
        <PartnerReadOnlyNotice queue={saveQueue} draftStored={draftStored} kept={keptDrafts} onRetryNow={saveNow} />
      )}

      {/* Header with same styling as event editor */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">
              {partner.showEmoji !== false ? partner.emoji : ''} {partner.name}
            </h1>
            <p className="admin-subtitle">
              {isCustomVariant(variantSlug)
                ? `Partner Report Variant Editor - ${variantSlug}`
                : 'Partner Content Editor - Report Text & Images'}
            </p>

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
            <div className="admin-badge editor-statusBadge">
              <p className="admin-role">🏢 Partner Editor</p>
              <p className="admin-level">📦 Content Only</p>
              <PartnerSaveStatusLine queue={saveQueue} readOnly={readOnly} />

              {/* Info about what can be edited */}
              <div className="editor-statusHint">
                <p>✅ Text & Image Content</p>
                <p>❌ Numbers from Events</p>
              </div>
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
            {draftConflict.items.map(describeConflictItem).join('; ')}. The saved{' '}
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

      {/* A disabled fieldset disables every input, button and upload inside it.
          Each control also gets disabled={readOnly}, and Report Content is
          shown by PartnerReportContentView, which has no controls (its editor
          stays mounted but hidden after a switch mid-session). */}
      <fieldset className={styles.editorFieldset} disabled={readOnly}>
      <div className="content-grid">
        {/* WHAT: Partner-level Report Content Management */}
        {/* WHY: Allow editing of reportText* and reportImage* fields for partner customization */}
        {/* HOW: Use same ReportContentManager as events but with partner stats */}
        <ColoredCard>
          <h2 className="section-title">📦 Partner Report Content</h2>
          <div className="editor-info-panel">
            <h4 className="editor-info-panelTitle">ℹ️ Partner Content Editing</h4>
            <ul className="editor-info-panelList">
              <li>• <strong>Text & Images:</strong> Edit partner-specific content (reportText*, reportImage*)</li>
              <li>• <strong>Mathematical Data:</strong> Comes from aggregated included event data (not editable here)</li>
              <li>• <strong>Charts:</strong> Will show partner content + aggregated event numbers</li>
              <li>• <strong>Usage:</strong> Upload partner logos, add partner descriptions, custom messaging</li>
            </ul>
          </div>

          {readOnly && <PartnerReportContentView stats={partner.stats} />}
          {contentManagerMounted && (
            <div hidden={readOnly}>
              <ReportContentManager
                stats={partner.stats as Record<string, unknown>}
                onCommit={(newStats) => commitReportStats(partner.stats, newStats)}
              />
            </div>
          )}
        </ColoredCard>

        {/* WHAT: Partner Information Display */}
        {/* WHY: Show partner details for context while editing */}
        <ColoredCard>
          <h2 className="section-title">🏢 Partner Information</h2>
          <div className="editor-detailStack">
            <div className="editor-detailRow">
              <span className="text-2xl">{partner.showEmoji !== false ? partner.emoji : ''}</span>
              <div>
                <h3 className="editor-detailHeading">{partner.name}</h3>
                <p className="editor-detailText">Partner ID: {partner._id}</p>
              </div>
            </div>

            {partner.logoUrl && (
              <div>
                <p className="editor-logoPreviewLabel">Partner Logo:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partner.logoUrl}
                  alt={`${partner.name} logo`}
                  className="editor-logoPreview"
                />
              </div>
            )}

            <div className="editor-subsection">
              <h3 className="editor-subsectionTitle">Logo Management</h3>
              <UnifiedTextInput
                label="Logo URL"
                value={partner.logoUrl || ''}
                onSave={handleLogoUrlSave}
                placeholder="https://example.com/logo.png"
                type="url"
                autoComplete="url"
                disabled={readOnly}
              />
              <p className="editor-helperText">
                Paste an existing logo URL, or upload an image below to store it on ImgBB and save the hosted URL automatically.
              </p>
              <ImageUploader
                label="Upload Logo"
                value={partner.logoUrl}
                onChange={handleLogoUpload}
                maxSizeMB={10}
                disabled={readOnly}
              />
            </div>

            {/* WHAT: Events List Visibility Control */}
            {/* WHY: Allow partners to control whether events list appears on their report page */}
            <div className="editor-subsection">
              <UnifiedCheckboxField
                id="showEventsList"
                label="Show Events List on Report Page"
                checked={showEventsList}
                onChange={(checked) => setFlag('showEventsList', checked)}
                disabled={readOnly}
                hint={`Controls whether "${partner.name} Events (X)" appears at the bottom of the partner report page.`}
              />

              <UnifiedCheckboxField
                id="showEventsListTitle"
                label="Show Events List Title on Report Page"
                checked={partner.showEventsListTitle ?? true}
                onChange={(checked) => setFlag('showEventsListTitle', checked)}
                disabled={readOnly || !showEventsList}
                hint={`Controls whether the title "${partner.name} Events (X)" appears above the events list.`}
              />

              <UnifiedCheckboxField
                id="showEventsListDetails"
                label="Show Event Card Details on Report Page"
                checked={partner.showEventsListDetails ?? true}
                onChange={(checked) => setFlag('showEventsListDetails', checked)}
                disabled={readOnly || !showEventsList}
                hint="Controls whether event cards show detailed info and actions or just the event title."
              />

              <UnifiedCheckboxField
                id="showOnlyTeam1Events"
                label="Only Include Local/Home Events (Team 1)"
                checked={partner.showOnlyTeam1Events ?? false}
                onChange={(checked) => setFlag('showOnlyTeam1Events', checked)}
                disabled={readOnly}
                hint="Filters totals, charts, and the events list to only include team-1 / home appearances."
              />
            </div>

            <div className="editor-metaList">
              <p>Created: {new Date(partner.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(partner.updatedAt).toLocaleDateString()}</p>
              {partner.styleId && <p>Style ID: {partner.styleId}</p>}
              {partner.reportTemplateId && <p>Template ID: {partner.reportTemplateId}</p>}
            </div>
          </div>
        </ColoredCard>

        {/* WHAT: Usage Instructions */}
        {/* WHY: Help users understand how partner content editing works */}
        <ColoredCard>
          <h2 className="section-title">📚 How Partner Content Works</h2>
          <div className="editor-guide">
            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">🎯 What You Can Edit</h4>
              <ul className="editor-guideList">
                <li>• <strong>Partner Texts:</strong> Custom descriptions, messages, notes</li>
                <li>• <strong>Partner Images:</strong> Logos, banners, promotional images</li>
                <li>• <strong>Report Content:</strong> Content that appears in partner reports</li>
              </ul>
            </div>

            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">📊 What Comes from Events</h4>
              <ul className="editor-guideList">
                <li>• <strong>Fan Numbers:</strong> Total fans from included partner events</li>
                <li>• <strong>Image Counts:</strong> Total images from included partner events</li>
                <li>• <strong>Demographics:</strong> Age and gender data from included events</li>
                <li>• <strong>Engagement:</strong> Mathematical calculations from included events</li>
              </ul>
            </div>

            <div className="editor-guideSection">
              <h4 className="editor-guideTitle">🔄 How It Works Together</h4>
              <ul className="editor-guideList">
                <li>• Partner reports show <strong>aggregated included event data</strong> for numbers</li>
                <li>• Partner reports show <strong>partner-specific content</strong> for text/images</li>
                <li>• Best of both: Real data + Custom branding</li>
              </ul>
            </div>
          </div>
        </ColoredCard>
      </div>
      </fieldset>

      {/* Last in the page and pinned while scrolling (position: sticky), so it
          never covers the last card. A read-only editor reports its unsaved
          changes in the notice at the top instead. */}
      {!readOnly && (
        <PartnerSaveProblemBanner
          queue={saveQueue}
          draftStored={draftStored}
          accessBlocked={accessBlocked}
          onRetryNow={saveNow}
        />
      )}
    </div>
  );
}
