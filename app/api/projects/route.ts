import { NextRequest, NextResponse, after } from 'next/server';
import { requireAdmin, requireProjectWriteAccess, pickWritableFields, EVENT_EDITOR_WRITABLE_FIELDS } from '@/lib/apiGuards';
import { ObjectId, Db } from 'mongodb';
import { generateProjectSlugs } from '@/lib/slugUtils';
import clientPromise from '@/lib/mongodb';
import { createNotification, getCurrentActor } from '@/lib/notificationUtils';
import { error as logError, info as logInfo, warn as logWarn, debug as logDebug } from '@/lib/logger';

// Import hashtag category helpers for categorized hashtags support
import { 
  mergeHashtagSystems, 
  expandHashtagsWithCategories,
  getAllHashtagRepresentations 
} from '@/lib/hashtagCategoryUtils';
import { addDerivedMetrics } from '@/lib/projectStatsUtils';
import { validateProjectStats, prepareStatsForAnalytics, type ValidationResult } from '@/lib/dataValidator';

// Import Bitly recalculation services for many-to-many link management
import { recalculateProjectLinks, handleProjectDeletion, createLinkAssociation } from '@/lib/bitly-recalculator';
import {
  MAX_EVENT_STAT_CHANGES,
  isWritableEventStatKey,
  isWritableEventStatValue,
  isWritableEventStatIncrement,
  eventHashtagsProblem,
  eventCategorizedHashtagsProblem,
} from '@/lib/eventSaveRules';
import { parseEditorSequence, editorSequenceGuard } from '@/lib/statsFieldChanges';

// WHAT: Upper bound on one invocation of these handlers, in seconds.
// WHY: The event editor gives a save 25 seconds before it treats the request
//     as lost and sends it again (lib/editorSaveQueue.ts). A save the platform
//     let run past that could still land after the retry had, so the function
//     must be stopped first. 20 s leaves the margin; a normal save is well
//     under a second. Applies to every handler in this file.
export const maxDuration = 20;

// ---------------------------------------------------------------------------
// Field-level event editor saves (PUT /api/projects)
// ---------------------------------------------------------------------------
// The limits on one save and the key, value and increment rules are shared
// with the event editor (lib/eventSaveRules.ts), which filters by the same
// rules before it queues a save.

interface EventStatsChanges {
  /** Stat values this save sets, by key. */
  set: Record<string, number | string>;
  /** Stat keys this save removes (a null in statsChanges, or statsRemoved). */
  removed: string[];
  /** Counter keys this save adds to (clicker taps), by how much. */
  increments: Record<string, number>;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const hasOwn = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

const quoteKey = (key: string) => JSON.stringify(key.slice(0, 60));

// WHAT: A project id as PUT accepts it: 24 hex characters, nothing else.
// WHY: ObjectId.isValid() also passes an object such as { id: '<24 hex>' },
//     and new ObjectId() resolves it to the right event, but the write guard's
//     password check compares ids as strings and dropped it: a password set on
//     the event's _id to cut off earlier grants was left out, and the save
//     went through. Every later use gets the canonical lowercase form.
const PROJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

// WHAT: Read the field-level stats of a PUT body: `statsChanges` (a value per
//     key; null removes the key), `statsRemoved` (for editor tabs that send
//     removals separately) and `statsIncrements` (clicker counts to add).
//     null when the body has none of them.
// WHY: A key or value that cannot be stored as one stat refuses the whole
//     save with a 400 rather than being dropped, so the editor never confirms
//     a value that was not written. A key may appear in only one of them: a
//     save either states a value or counts on from the stored one.
function parseEventStatsChanges(body: Record<string, unknown>): Parsed<EventStatsChanges | null> {
  const rawChanges = body.statsChanges;
  const rawRemoved = body.statsRemoved;
  const rawIncrements = body.statsIncrements;
  if (rawChanges === undefined && rawRemoved === undefined && rawIncrements === undefined) {
    return { ok: true, value: null };
  }

  if (rawChanges !== undefined && !isPlainObject(rawChanges)) {
    return { ok: false, error: 'statsChanges must be an object of stat values' };
  }
  if (rawRemoved !== undefined && !(Array.isArray(rawRemoved) && rawRemoved.every((k) => typeof k === 'string'))) {
    return { ok: false, error: 'statsRemoved must be an array of stat keys' };
  }
  if (rawIncrements !== undefined && !isPlainObject(rawIncrements)) {
    return { ok: false, error: 'statsIncrements must be an object of whole numbers' };
  }

  const entries = Object.entries((rawChanges ?? {}) as Record<string, unknown>);
  const removedList = (rawRemoved ?? []) as string[];
  const incrementEntries = Object.entries((rawIncrements ?? {}) as Record<string, unknown>);
  if (entries.length + removedList.length + incrementEntries.length > MAX_EVENT_STAT_CHANGES) {
    return { ok: false, error: `Too many stat changes in one save (max ${MAX_EVENT_STAT_CHANGES})` };
  }

  const set: Record<string, number | string> = {};
  const removed = new Set<string>();
  const increments: Record<string, number> = {};
  for (const [key, value] of entries) {
    if (!isWritableEventStatKey(key)) return { ok: false, error: `Invalid stat key: ${quoteKey(key)}` };
    if (!isWritableEventStatValue(value)) return { ok: false, error: `Invalid value for stat ${quoteKey(key)}` };
    if (value === null) removed.add(key);
    else set[key] = value as number | string;
  }
  for (const key of removedList) {
    if (!isWritableEventStatKey(key)) return { ok: false, error: `Invalid stat key: ${quoteKey(key)}` };
    if (hasOwn(set, key)) return { ok: false, error: `Stat key both changed and removed: ${quoteKey(key)}` };
    removed.add(key);
  }
  for (const [key, value] of incrementEntries) {
    if (!isWritableEventStatKey(key)) return { ok: false, error: `Invalid stat key: ${quoteKey(key)}` };
    if (!isWritableEventStatIncrement(value)) return { ok: false, error: `Invalid increment for stat ${quoteKey(key)}` };
    if (hasOwn(set, key) || removed.has(key)) {
      return { ok: false, error: `Stat key both set and counted in one save: ${quoteKey(key)}` };
    }
    increments[key] = value;
  }
  return { ok: true, value: { set, removed: Array.from(removed), increments } };
}

// WHAT: A stored stat as a number to count on from: a number as it is, a
//     numeric text as its number (older events), anything else as 0.
function countableNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

// WHAT: The update paths for a field-level stats save.
// HOW: Every key the save names is written as `stats.<key>` -- set, or unset
//     for a removal -- whatever the stored value, because the save is the
//     operator's latest word on it. A counted key is added to with $inc, so
//     taps another device stored meanwhile are kept rather than overwritten;
//     where the stored value is not a number $inc could add to (a text, null),
//     it is set to that value counted on instead. Derived totals are then
//     computed on the stored stats with the changes applied
//     (prepareStatsForAnalytics), and only a derived key whose value that
//     changed is written too. Nothing else is touched, so a value another
//     writer stores between this read and this write (fanmass results, a
//     sheet pull, an admin, another device) survives. A removed key the
//     derivation fills back in (a total) is set to that value instead of
//     unset: one path cannot be in both $set and $unset.
// NOTE: A document whose `stats` is present but not an object (null on some
//     old events) has nothing a dotted path can address, so there the whole
//     field is set. A missing `stats` is fine: MongoDB creates it.
//     `decremented` lists the counted keys that went down, which the route
//     keeps from going below zero once the write is done.
function fieldLevelStatsUpdate(
  current: unknown,
  changes: EventStatsChanges
): {
  set: Record<string, unknown>;
  unset: Record<string, ''>;
  inc: Record<string, number>;
  decremented: string[];
  validation: ValidationResult;
} {
  const stored = isPlainObject(current) ? current : {};
  const merged: Record<string, unknown> = { ...stored };
  for (const key of changes.removed) delete merged[key];
  Object.assign(merged, changes.set);
  for (const [key, delta] of Object.entries(changes.increments)) {
    merged[key] = countableNumber(merged[key]) + delta;
  }

  const prepared = prepareStatsForAnalytics(merged as never);
  const enriched = prepared.stats as unknown as Record<string, unknown>;
  const decremented = Object.entries(changes.increments).filter(([, delta]) => delta < 0).map(([key]) => key);

  if (current !== undefined && !isPlainObject(current)) {
    return { set: { stats: enriched }, unset: {}, inc: {}, decremented, validation: prepared.validation };
  }

  const named = new Set([...Object.keys(changes.set), ...changes.removed, ...Object.keys(changes.increments)]);
  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};
  const inc: Record<string, number> = {};
  for (const [key, value] of Object.entries(changes.set)) set[`stats.${key}`] = value;
  for (const key of changes.removed) {
    if (hasOwn(enriched, key) && enriched[key] !== undefined) set[`stats.${key}`] = enriched[key];
    else unset[`stats.${key}`] = '';
  }
  for (const [key, delta] of Object.entries(changes.increments)) {
    const storedValue = hasOwn(stored, key) ? stored[key] : undefined;
    if (storedValue === undefined || (typeof storedValue === 'number' && Number.isFinite(storedValue))) {
      inc[`stats.${key}`] = delta;
    } else {
      set[`stats.${key}`] = merged[key];
    }
  }
  for (const [key, value] of Object.entries(enriched)) {
    if (named.has(key)) continue;
    if (value !== (hasOwn(stored, key) ? stored[key] : undefined)) set[`stats.${key}`] = value;
  }
  return { set, unset, inc, decremented, validation: prepared.validation };
}

// WHAT: Project fields only an admin or superadmin session may change through PUT.
// WHY: An edit grant comes from the edit password or from holding an
//     unprotected editor's edit link, and a signed-in account with another
//     role (guest, user) is not an administrator either -- POST and DELETE on
//     this route refuse it. The event's name and date (a date change re-runs
//     the Bitly recalculation), its style and template, and its partner
//     references (re-pointing one changes what another partner's report
//     aggregates) stay with admins. The route drops these for every other
//     caller on its own, whatever the shared EVENT_EDITOR_WRITABLE_FIELDS list
//     says, so the rule cannot drift away from this handler.
const ADMIN_ONLY_PROJECT_FIELDS = ['eventName', 'eventDate', 'styleId', 'reportTemplateId', 'partner1Id', 'partner2Id'] as const;

// WHAT: Case-insensitive exact match for one hashtag value. On an array field
//     it matches when any element matches (same idiom as lib/cameraPartnerSync.ts).
function exactCaseInsensitive(value: string) {
  return { $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
}

// WHAT: Filter matching any project that still produces `representation` under
//     the rules getAllHashtagRepresentations uses to build it:
//       "tag"      <- a plain `hashtags` entry equal to "tag" (any case)
//       "cat:tag"  <- a `categorizedHashtags.cat` entry equal to "tag" (any case)
//     A representation with a colon is checked both ways, because a plain
//     hashtag containing a colon produces the same string.
// WHY: Category names are stored lowercase (CATEGORY_NAME_VALIDATION.PATTERN,
//     normalizeCategoryName), so the category is matched as the literal field
//     key. A category part that is not a safe field path cannot be queried, so
//     it returns null and the caller keeps that representation.
function representationInUseFilter(representation: string): Record<string, unknown> | null {
  const clauses: Record<string, unknown>[] = [{ hashtags: exactCaseInsensitive(representation) }];
  const colonIndex = representation.indexOf(':');
  if (colonIndex > 0) {
    const category = representation.slice(0, colonIndex);
    const value = representation.slice(colonIndex + 1);
    if (category.includes('.') || category.startsWith('$')) return null;
    clauses.push({ [`categorizedHashtags.${category}`]: exactCaseInsensitive(value) });
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

// WHAT: Most removed representations one request checks for remaining use.
// WHY: Each check is a case-insensitive regex (an $or of two for "cat:tag")
//     that no index serves, so it is a scan of the projects collection -- a
//     full one for a representation nothing uses any more. The checks run one
//     at a time, so a request never has more than one such scan open, and this
//     cap bounds how many scans one request can start in total. Removing a few
//     hashtags in one edit, the normal case, is always checked in full; a body
//     that drops hundreds of hashtags cannot turn one save into hundreds of
//     collection scans.
// NOTE: A representation past the cap is skipped, not deleted: its count doc
//     stays at its decremented count. That is harmless -- nothing displays the
//     `hashtags` counts collection (GET /api/hashtags aggregates from the
//     projects themselves), and deleting a hashtag from /admin/hashtags still
//     removes its count docs.
const MAX_HASHTAG_CLEANUP_CHECKS = 20;

// WHAT: Delete the `hashtags` count docs for the representations a request just
//     dropped, but only those no project uses any more.
// WHY: The previous cleanupUnusedHashtags(db) ran on EVERY save and loaded every
//     project document in full (find({}).toArray()) to rebuild the used set. The
//     live editor saves on every click, so each click read the whole projects
//     collection. Only a representation this request removed can have become
//     unused, so only those need checking.
// HOW: One existence check per removed representation, sequentially and at most
//     MAX_HASHTAG_CLEANUP_CHECKS of them (countDocuments with limit 1: the scan
//     stops at the first hit and only a number comes back), then a single
//     deleteMany over the ones with no remaining use.
//     Two deliberate differences from the old full sweep: a "cat:tag" doc that
//     is still in use is kept (the old used-set held only unprefixed values, so
//     it deleted every prefixed doc on every save), and docs this request did
//     not touch are left alone.
// NOTE: Must run AFTER the project write, so the project being saved or deleted
//     no longer counts as a user of what it dropped. Failures are logged and
//     never fail the save, as before.
async function cleanupRemovedHashtags(db: Db, removedRepresentations: string[]): Promise<number> {
  const candidates = Array.from(new Set(removedRepresentations.map((h) => h.toLowerCase())));
  if (candidates.length === 0) return 0;

  try {
    const projectsCollection = db.collection('projects');
    const unused: string[] = [];
    let checked = 0;
    let skipped = 0;

    // Sequential on purpose: one scan at a time (see MAX_HASHTAG_CLEANUP_CHECKS).
    for (const representation of candidates) {
      const filter = representationInUseFilter(representation);
      if (!filter) continue; // not queryable: keep it, costs nothing
      if (checked >= MAX_HASHTAG_CLEANUP_CHECKS) {
        skipped += 1;
        continue;
      }
      checked += 1;
      if ((await projectsCollection.countDocuments(filter, { limit: 1 })) === 0) {
        unused.push(representation);
      }
    }

    if (skipped > 0) {
      logWarn('Hashtag cleanup capped; skipped representations keep their count docs', {
        context: 'projects',
        checked,
        skipped,
        limit: MAX_HASHTAG_CLEANUP_CHECKS,
      });
    }

    if (unused.length === 0) return 0;

    const deleteResult = await db.collection('hashtags').deleteMany({ hashtag: { $in: unused } });
    logInfo('Cleaned up unused hashtags', { context: 'projects', checked, deletedCount: deleteResult.deletedCount });
    return deleteResult.deletedCount;
  } catch (error) {
    logError('Failed to cleanup hashtags', { context: 'projects' }, error instanceof Error ? error : new Error(String(error)));
    return 0;
  }
}

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

async function connectToDatabase() {
  try {
    logDebug('Connecting to MongoDB Atlas', { context: 'projects' });
    const client = await clientPromise;
    
    // Test the connection
    await client.db(MONGODB_DB).admin().ping();
    logDebug('MongoDB Atlas connected successfully', { context: 'projects' });
    
    return client;
  } catch (error) {
    logError('Failed to connect to MongoDB Atlas', { context: 'projects' }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// GET /api/projects - Fetch projects with optional pagination and search
export async function GET(request: NextRequest) {
  // SECURITY (messmass#386): admin-only read; the file-level sweep missed
  // this GET because other handlers here already carried a guard.
  const __denied = await requireAdmin();
  if (__denied) return __denied;

  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId'); // WHAT: Single project lookup for KYC pages
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor');
    const q = url.searchParams.get('q');
    const offsetParam = url.searchParams.get('offset');

    // New: server-side sorting across the entire dataset
    // WHAT: Allow sorting by Event Name, Date, Images, Total Fans, Attendees
    // WHY: Clicking a table header in the admin UI must reorder ALL projects, not just the visible page
    const sortFieldParam = url.searchParams.get('sortField'); // 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees'
    const sortOrderParam = url.searchParams.get('sortOrder'); // 'asc' | 'desc'

    // WHAT: If projectId is provided, return single project (used by KYC pages)
    // WHY: Event KYC pages need specific project data, not a list
    if (projectId && ObjectId.isValid(projectId)) {
      const client = await connectToDatabase();
      const db = client.db(MONGODB_DB);
      
      const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
      
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      
      // WHAT: Format response to match expected structure from KYC page
      return NextResponse.json({
        success: true,
        project: {
          _id: project._id.toString(),
          eventName: project.eventName,
          eventDate: project.eventDate,
          stats: project.stats,
        },
      });
    }

    // Defaults and caps
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Normalize and validate sorting inputs
    const ALLOWED_FIELDS = new Set(['eventName', 'eventDate', 'images', 'fans', 'attendees']);
    const sortField = sortFieldParam && ALLOWED_FIELDS.has(sortFieldParam) ? sortFieldParam as 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' : null;
    const sortOrder = sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : null;

    // Decide pagination mode:
    // - If search (q) or explicit sort present -> use OFFSET pagination for global ordering
    // - Else -> keep existing CURSOR pagination by updatedAt desc (infinite scroll default)
    const isSearch = !!(q && q.trim() !== '');
    const isSorted = !!(sortField && sortOrder);

    if (isSearch || isSorted) {
      // OFFSET mode with aggregation to ensure full-dataset ordering
      const offset = Math.max(Number(offsetParam) || 0, 0);

      // Build $match (server-side search reuses existing criteria)
      const pipeline: any[] = [];
      if (isSearch) {
        const query = q!.trim();
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
        
        // WHAT: Expanded search to include both traditional and categorized hashtags
        // WHY: Users need to find events by hashtag values across both storage formats
        // HOW: Added $expr with $anyElementTrue to search nested categorizedHashtags object values
        pipeline.push({
          $match: {
            $or: [
              { eventName: { $regex: regex } },
              { viewSlug: { $regex: regex } },
              { editSlug: { $regex: regex } },
              // Traditional hashtags array search (regex already has 'i' flag)
              { hashtags: { $elemMatch: { $regex: regex } } },
              // Categorized hashtags nested object search
              // Uses $expr to evaluate if any category array contains matching hashtag
              {
                $expr: {
                  $anyElementTrue: {
                    $map: {
                      input: { $objectToArray: { $ifNull: ['$categorizedHashtags', {}] } },
                      as: 'category',
                      in: {
                        $anyElementTrue: {
                          $map: {
                            input: '$$category.v',
                            as: 'hashtag',
                            in: { $regexMatch: { input: '$$hashtag', regex: query, options: 'i' } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        });
      }

      // Compute sort keys for numeric aggregations; use $convert for dates
      pipeline.push({
        $addFields: {
          _sortEventDate: { $convert: { input: "$eventDate", to: "date", onError: null, onNull: null } },
          _images: {
            $add: [
              { $ifNull: ["$stats.remoteImages", 0] },
              { $ifNull: ["$stats.hostessImages", 0] },
              { $ifNull: ["$stats.selfies", 0] }
            ]
          },
          _fans: {
            $ifNull: [
              {
                $convert: {
                  input: "$stats.totalFans",
                  to: "double",
                  onError: null,
                  onNull: null
                }
              },
              {
                $add: [
                  {
                    $ifNull: [
                      {
                        $convert: {
                          input: "$stats.remoteFans",
                          to: "double",
                          onError: null,
                          onNull: null
                        }
                      },
                      {
                        $add: [
                          { $ifNull: ["$stats.indoor", 0] },
                          { $ifNull: ["$stats.outdoor", 0] }
                        ]
                      }
                    ]
                  },
                  { $ifNull: ["$stats.stadium", 0] }
                ]
              }
            ]
          },
          _attendees: { $ifNull: ["$stats.eventAttendees", 0] }
        }
      });

      // Map sort field to computed keys, with deterministic tie-breaker
      const dir = sortOrder === 'asc' ? 1 : -1;
      const sortSpec: Record<string, 1 | -1> = {};
      if (sortField === 'eventName') {
        // Use natural field with case-insensitive collation applied at aggregate call
        sortSpec['eventName'] = dir;
      } else if (sortField === 'eventDate') {
        sortSpec['_sortEventDate'] = dir;
      } else if (sortField === 'images') {
        sortSpec['_images'] = dir;
      } else if (sortField === 'fans') {
        sortSpec['_fans'] = dir;
      } else if (sortField === 'attendees') {
        sortSpec['_attendees'] = dir;
      } else {
        // No explicit sort provided: fallback to updatedAt desc for search-only mode
        sortSpec['updatedAt'] = -1;
        sortSpec['_id'] = -1;
      }
      // Deterministic tie-breaker for stable pagination order
      if (!sortSpec['_id']) sortSpec['_id'] = 1;
      pipeline.push({ $sort: sortSpec });

      // Use $facet to paginate and count in a single round-trip
      pipeline.push({
        $facet: {
          results: [
            { $skip: offset },
            { $limit: limit },
            {
              $project: {
                _sortEventDate: 0,
                _images: 0,
                _fans: 0,
                _attendees: 0
              }
            }
          ],
          totalCount: [ { $count: 'count' } ]
        }
      });

      const aggOptions = sortField === 'eventName' ? { collation: { locale: 'en', strength: 2 } } : undefined;
      const agg = await collection.aggregate(pipeline, aggOptions as any).toArray();
      const first = agg[0] || { results: [], totalCount: [] };
      const results = first.results || [];
      const totalMatched = (first.totalCount?.[0]?.count as number) || 0;

      // WHAT: Populate partner data for Sports Match projects (sort/search mode)
      // WHY: Frontend needs partner logos and emojis for display
      const partnersCollection = db.collection('partners');
      const partnerIds = results
        .map((p: any) => [p.partner1Id, p.partner2Id])
        .flat()
        .filter((id: any) => id && ObjectId.isValid(id))
        .map((id: any) => new ObjectId(id));
      
      const partnersData = partnerIds.length > 0
        ? await partnersCollection.find({ _id: { $in: partnerIds } }).toArray()
        : [];
      
      const partnersMap = new Map(
        partnersData.map(p => [p._id.toString(), p])
      );

      const formatted = results.map((project: any) => {
        const projectId = project._id.toString();
        logDebug('Formatting project', { context: 'projects', eventName: project.eventName, projectId });
        const result: any = {
          _id: projectId,
          eventName: project.eventName,
          eventDate: project.eventDate,
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {},
          stats: project.stats,
          viewSlug: project.viewSlug,
          editSlug: project.editSlug,
          styleIdEnhanced: project.styleIdEnhanced ? project.styleIdEnhanced.toString() : null,
          reportTemplateId: project.reportTemplateId ? project.reportTemplateId.toString() : null,
          externalRefs: project.externalRefs || null, // Cross-app refs (camera.eventId) set by lib/cameraProvision.ts
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
        
        // Add partner data if available
        if (project.partner1Id) {
          const partner1 = partnersMap.get(project.partner1Id.toString());
          if (partner1) {
            result.partner1 = {
              _id: partner1._id.toString(),
              name: partner1.name,
              emoji: partner1.emoji,
              logoUrl: partner1.logoUrl
            };
          }
        }
        
        if (project.partner2Id) {
          const partner2 = partnersMap.get(project.partner2Id.toString());
          if (partner2) {
            result.partner2 = {
              _id: partner2._id.toString(),
              name: partner2.name,
              emoji: partner2.emoji,
              logoUrl: partner2.logoUrl
            };
          }
        }
        
        return result;
      });

      const nextOffset = offset + formatted.length;
      const hasMore = nextOffset < totalMatched;

      return NextResponse.json({
        success: true,
        projects: formatted,
        pagination: {
          mode: isSearch ? 'search' : 'sort',
          limit,
          offset,
          nextOffset: hasMore ? nextOffset : null,
          totalMatched
        }
      });
    }

    // Default list mode with cursor-based pagination (no search, no explicit sort)
    // Cursor is a base64-encoded JSON: { u: updatedAt (ISO string), id: _id string }
    let filter: any = {};
    let sort = { updatedAt: -1 as const, _id: -1 as const };
    if (cursorParam) {
      try {
        const decoded = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf-8')) as { u: string; id: string };
        const u = decoded.u;
        const id = decoded.id;
        filter = {
          $or: [
            { updatedAt: { $lt: u } },
            { updatedAt: u, _id: { $lt: new ObjectId(id) } }
          ]
        };
      } catch {
        // Invalid cursor -> ignore and start from top
        filter = {};
      }
    }

    const projects = await collection
      .find(filter)
      .sort(sort)
      .limit(limit)
      .toArray();

    // WHAT: Populate partner data for Sports Match projects
    // WHY: Frontend needs partner logos and emojis for display
    const partnersCollection = db.collection('partners');
    const partnerIds = projects
      .map(p => [p.partner1Id, p.partner2Id])
      .flat()
      .filter(id => id && ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    const partnersData = partnerIds.length > 0
      ? await partnersCollection.find({ _id: { $in: partnerIds } }).toArray()
      : [];
    
    const partnersMap = new Map(
      partnersData.map(p => [p._id.toString(), p])
    );
    
    const formatted = projects.map(project => {
      // WHAT: Validate project data quality
      // WHY: Inform frontend about incomplete data for UI indicators
      const validation = validateProjectStats(project.stats || {});
      const projectId = project._id.toString();
      logDebug('Formatting project (cursor mode)', { context: 'projects', eventName: project.eventName, projectId });
      
      const result: any = {
        _id: projectId,
        eventName: project.eventName,
        eventDate: project.eventDate,
        hashtags: project.hashtags || [],               // Traditional hashtags (backward compatibility)
        categorizedHashtags: project.categorizedHashtags || {}, // New categorized hashtags
        stats: project.stats,
        viewSlug: project.viewSlug,
        editSlug: project.editSlug,
        styleIdEnhanced: project.styleIdEnhanced ? project.styleIdEnhanced.toString() : null, // Project-specific style reference
        reportTemplateId: project.reportTemplateId ? project.reportTemplateId.toString() : null, // Project-specific report template
        externalRefs: project.externalRefs || null, // Cross-app refs (camera.eventId) set by lib/cameraProvision.ts
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // WHAT: Add data quality metadata for frontend consumption
        // WHY: Enable UI to show quality badges and warnings
        dataQuality: {
          completeness: validation.completeness,
          quality: validation.dataQuality,
          hasMinimumData: validation.hasMinimumData,
          missingRequired: validation.missingRequired
        }
      };
      
      // Add partner data if available
      if (project.partner1Id) {
        const partner1 = partnersMap.get(project.partner1Id.toString());
        if (partner1) {
          result.partner1 = {
            _id: partner1._id.toString(),
            name: partner1.name,
            emoji: partner1.emoji,
            logoUrl: partner1.logoUrl
          };
        }
      }
      
      if (project.partner2Id) {
        const partner2 = partnersMap.get(project.partner2Id.toString());
        if (partner2) {
          result.partner2 = {
            _id: partner2._id.toString(),
            name: partner2.name,
            emoji: partner2.emoji,
            logoUrl: partner2.logoUrl
          };
        }
      }
      
      return result;
    });

    let nextCursor: string | null = null;
    if (projects.length === limit) {
      const last = projects[projects.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ u: last.updatedAt, id: last._id.toString() }), 'utf-8').toString('base64');
    }

    return NextResponse.json({
      success: true,
      projects: formatted,
      pagination: {
        mode: 'cursor',
        limit,
        nextCursor
      }
    });

  } catch (error) {
    logError('Failed to fetch projects', { context: 'projects' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    }, { status: 500 });
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  // F-009: creating events is admin-only. The page-password editor updates an
  // existing event and never creates one, so no grant path applies here.
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    // Enhanced to support both traditional and categorized hashtags + styleId + partner references + reportTemplateId
    const { eventName, eventDate, hashtags = [], categorizedHashtags = {}, stats, styleId, partner1Id, partner2Id, reportTemplateId } = body;

    if (!eventName || !eventDate || !stats) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: eventName, eventDate, stats' },
        { status: 400 }
      );
    }

    // Same hashtag shape rule as PUT (lib/eventSaveRules.ts): a malformed list
    // stored on one event breaks every page that reads all events' hashtags.
    const hashtagProblem = eventHashtagsProblem(hashtags) ?? eventCategorizedHashtagsProblem(categorizedHashtags);
    if (hashtagProblem) {
      return NextResponse.json({ success: false, error: hashtagProblem }, { status: 400 });
    }

    // WHAT: Validate and enrich stats before saving
    // WHY: Ensure data quality and add derived metrics
    const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);
    
    // WHAT: Warn if data quality is poor (but don't reject)
    // WHY: Allow creation with incomplete data but flag for admin attention
    if (!validation.hasMinimumData) {
      logWarn('Creating project with insufficient data quality', { context: 'projects', dataQuality: validation.dataQuality, completeness: validation.completeness, missingRequired: validation.missingRequired });
    }

    logInfo('Creating new project', { context: 'projects', eventName });

    // Generate unique slugs for the project
    logDebug('Generating unique slugs', { context: 'projects' });
    const { viewSlug, editSlug } = await generateProjectSlugs();
    logDebug('Generated slugs', { context: 'projects', viewSlugPrefix: viewSlug.substring(0, 8), editSlugPrefix: editSlug.substring(0, 8) });

    // WHAT: Validate styleId against page_styles_enhanced collection
    // WHY: Migrated from old pageStyles system to new enhanced system
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    if (styleId && styleId !== null && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid styleId format' },
          { status: 400 }
        );
      }
      
      // Validate that the style exists in report_styles collection (26-color system)
      const reportStylesCollection = db.collection('report_styles');
      const styleExists = await reportStylesCollection.findOne({ _id: new ObjectId(styleId) });
      
      if (!styleExists) {
        return NextResponse.json(
          { success: false, error: 'Referenced report style does not exist' },
          { status: 404 }
        );
      }
    }
    
    const collection = db.collection('projects');

    const now = new Date().toISOString();
    
    // Enhanced project structure to support categorized hashtags, styleId, and partner references
    const project: any = {
      eventName,
      eventDate,
      hashtags: hashtags || [],                        // Traditional hashtags (backward compatibility)
      categorizedHashtags: categorizedHashtags || {},  // New categorized hashtags field
      stats: enrichedStats, // Already enriched with derived metrics
      viewSlug,
      editSlug,
      createdAt: now,
      updatedAt: now
    };
    
    // WHAT: Add styleIdEnhanced field for page_styles_enhanced system integration
    // WHY: Migrated from old styleId to new styleIdEnhanced field name
    if (styleId && styleId !== null && styleId !== 'null') {
      project.styleIdEnhanced = styleId;
      logDebug('Setting styleIdEnhanced', { context: 'projects', styleId, method: 'POST' });
    } else {
      logDebug('No styleId provided', { context: 'projects', styleId, method: 'POST' });
    }
    
    // WHAT: Add partner references for Sports Match projects
    // WHY: Enable display of team logos in projects list
    if (partner1Id && ObjectId.isValid(partner1Id)) {
      project.partner1Id = new ObjectId(partner1Id);
    }
    if (partner2Id && ObjectId.isValid(partner2Id)) {
      project.partner2Id = new ObjectId(partner2Id);
    }
    
    // WHAT: Add reportTemplateId if provided
    // WHY: Allow events to have custom report templates
    if (reportTemplateId && reportTemplateId !== '' && reportTemplateId !== 'null' && ObjectId.isValid(reportTemplateId)) {
      project.reportTemplateId = new ObjectId(reportTemplateId);
      logDebug('Setting reportTemplateId', { context: 'projects', reportTemplateId, method: 'POST' });
    } else {
      logDebug('No reportTemplateId provided', { context: 'projects', reportTemplateId, method: 'POST' });
    }

    // Enhanced hashtag processing to handle both traditional and categorized hashtags
    // Store both plain hashtags and category-prefixed versions for comprehensive filtering
    const allHashtagRepresentations = getAllHashtagRepresentations({
      hashtags,
      categorizedHashtags
    });
    
    if (allHashtagRepresentations.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Process each hashtag representation individually to avoid conflicts
      for (const hashtagRepresentation of allHashtagRepresentations) {
        const normalizedHashtag = hashtagRepresentation.toLowerCase();
        
        // First try to increment existing hashtag
        const updateResult = await hashtagsCollection.updateOne(
          { hashtag: normalizedHashtag },
          { $inc: { count: 1 } }
        );
        
        // If no document was updated, create new hashtag
        if (updateResult.matchedCount === 0) {
          await hashtagsCollection.updateOne(
            { hashtag: normalizedHashtag },
            { 
              $setOnInsert: { 
                hashtag: normalizedHashtag, 
                count: 1,
                createdAt: now 
              }
            },
            { upsert: true }
          );
        }
      }
      
      logInfo('Updated hashtag counts', { context: 'projects', totalRepresentations: allHashtagRepresentations.length, traditionalCount: hashtags.length, categoryCount: Object.keys(categorizedHashtags).length });
    }

    const result = await collection.insertOne(project);
    logInfo('Project created successfully', { context: 'projects', projectId: result.insertedId.toString(), eventName });

    // WHAT: Auto-associate Partner 1's Bitly links with new project (many-to-many)
    // WHY: Quick Add shows partner Bitly links in preview, must connect them automatically
    // NOTE: Only Partner 1 (home team) links are associated, NOT Partner 2
    if (partner1Id && ObjectId.isValid(partner1Id)) {
      try {
        const partnersCollection = db.collection('partners');
        const partner = await partnersCollection.findOne({ _id: new ObjectId(partner1Id) });
        
        if (partner && partner.bitlyLinkIds && Array.isArray(partner.bitlyLinkIds)) {
          logInfo('Auto-associating Bitly links from Partner 1', { context: 'projects', linkCount: partner.bitlyLinkIds.length, partnerName: partner.name, projectId: result.insertedId.toString() });
          
          // Create junction table entries for each Bitly link
          // This will automatically calculate date ranges and populate cached metrics
          let associatedCount = 0;
          for (const bitlyLinkId of partner.bitlyLinkIds) {
            try {
              await createLinkAssociation({
                bitlyLinkId: new ObjectId(bitlyLinkId),
                projectId: result.insertedId,
                autoCalculated: true
              });
              associatedCount++;
            } catch (linkError) {
              logError('Failed to associate Bitly link', { context: 'projects', bitlyLinkId: bitlyLinkId.toString(), projectId: result.insertedId.toString() }, linkError instanceof Error ? linkError : new Error(String(linkError)));
              // Continue with other links even if one fails
            }
          }
          
          logInfo('Successfully associated Bitly links', { context: 'projects', associatedCount, totalLinks: partner.bitlyLinkIds.length, projectId: result.insertedId.toString() });
        } else {
          logDebug('Partner 1 has no Bitly links to associate', { context: 'projects', projectId: result.insertedId.toString() });
        }
      } catch (bitlyError) {
        logError('Failed to auto-associate Bitly links', { context: 'projects', projectId: result.insertedId.toString() }, bitlyError instanceof Error ? bitlyError : new Error(String(bitlyError)));
        // Don't fail the project creation if Bitly association fails
      }
    }

    // WHAT: Provision the mirror event in the camera app (messmass is the master).
    // WHY: Full circle — same partner/event everywhere; the camera event inherits
    //      the partner's default design. Runs via after() so it completes AFTER the
    //      response WITHOUT being suspended (a plain fire-and-forget is killed by the
    //      serverless runtime once the response is returned). Never blocks/fails create.
    const provisionProject = { ...project, _id: result.insertedId };
    after(async () => {
      try {
        const { getDb } = await import('@/lib/fanmassIntegration');
        const { provisionCameraEventForProject } = await import('@/lib/cameraProvision');
        await provisionCameraEventForProject(await getDb(), provisionProject);
      } catch (err) {
        logError('Camera provisioning failed', { context: 'projects', projectId: result.insertedId.toString() }, err instanceof Error ? err : new Error(String(err)));
      }
    });

    // WHAT: Log notification for project creation
    // WHY: Notify all users of new project activity
    try {
      const actor = await getCurrentActor();
      await createNotification(db, {
        activityType: 'create',
        actorId: actor.id,
        actorName: actor.name,
        projectId: result.insertedId.toString(),
        projectName: eventName,
        projectSlug: viewSlug
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      projectId: result.insertedId.toString(),
      project: {
        _id: result.insertedId.toString(),
        ...project
      },
      // WHAT: Include data quality validation in response
      // WHY: Frontend can show warnings immediately after creation
      dataQuality: {
        completeness: validation.completeness,
        quality: validation.dataQuality,
        hasMinimumData: validation.hasMinimumData,
        warnings: validation.warnings,
        missingRequired: validation.missingRequired,
        missingOptional: validation.missingOptional
      }
    });

  } catch (error) {
    console.error('❌ Failed to create project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create project' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects - Update existing project
export async function PUT(request: NextRequest) {
  let projectId: string | undefined;
  try {
    const body = await request.json();

    // WHAT: The event, by its 24-hex id only; from here on its canonical form.
    // WHY: See PROJECT_ID_PATTERN: an id in any other form reached the write
    //     while the password on the event's _id was left out of the guard.
    const rawProjectId: unknown = body?.projectId;
    if (typeof rawProjectId !== 'string' || !PROJECT_ID_PATTERN.test(rawProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    projectId = new ObjectId(rawProjectId).toHexString();

    // F-009: admin session, or an edit grant for THIS project's edit slug (from
    // the edit password, or from loading an unprotected editor by its edit
    // link). Scoped per project so a grant for one event cannot modify another.
    // Placed after the id validation so the guard always has a usable id, and
    // before any write so nothing is mutated on the unauthorised path.
    let writable: Record<string, any> = body;
    {
      const guardClient = await connectToDatabase();
      const access = await requireProjectWriteAccess(guardClient.db(MONGODB_DB), projectId);
      if (!access.allowed) return access.response;

      // WHAT: Anyone but an administrator may change only what the event
      //     editor saves.
      // WHY: See EVENT_EDITOR_WRITABLE_FIELDS and ADMIN_ONLY_PROJECT_FIELDS.
      //     Grants are also issued to whoever opens an unprotected editor by
      //     its edit link, and neither that, an edit password, nor a signed-in
      //     account with a role below admin is an admin credential: partner,
      //     style and template references, and the event's name and date (the
      //     editor cannot change them; a date change re-runs the Bitly
      //     recalculation), stay with admin and superadmin sessions. Other
      //     fields are ignored rather than rejected, as in PUT /api/partners.
      if (!access.isAdmin) {
        writable = pickWritableFields(body, EVENT_EDITOR_WRITABLE_FIELDS);
        for (const field of ADMIN_ONLY_PROJECT_FIELDS) delete writable[field];
      }
    }

    // Enhanced to support both traditional and categorized hashtags + styleId + reportTemplateId + partner references
    // WHAT: Every field is optional: a field the body leaves out keeps its
    //     stored value. Stats come either whole (`stats`, editor tabs opened
    //     before field-level saves) or field-level (`statsChanges`, where null
    //     removes a key, plus `statsRemoved` and the clicker counts in
    //     `statsIncrements`; the event editor), never both.
    // WHY: The event editor sends only what it changed since its last confirmed
    //     save (see EditorSavePayload in components/EditorDashboard.tsx). A
    //     field it does not send must not be reset: before, a body without
    //     hashtags stored [] and one without stats stored empty totals.
    let { eventName, eventDate, hashtags, categorizedHashtags, stats, styleId, reportTemplateId, partner1Id, partner2Id } = writable;
    const statsChanges = parseEventStatsChanges(writable);
    if (!statsChanges.ok) {
      return NextResponse.json({ success: false, error: statsChanges.error }, { status: 400 });
    }
    if (statsChanges.value && stats !== undefined) {
      return NextResponse.json(
        { success: false, error: 'Send either stats or statsChanges/statsRemoved/statsIncrements, not both' },
        { status: 400 }
      );
    }
    if (stats !== undefined && !isPlainObject(stats)) {
      return NextResponse.json({ success: false, error: 'stats must be an object of stat values' }, { status: 400 });
    }

    // WHAT: The hashtag lists must have the shape every reader expects, for
    //     every caller and both body forms, before anything is written.
    // WHY: They were stored as sent and only read afterwards: a list holding
    //     a number, or a category that was not a list, was written, then the
    //     hashtag bookkeeping threw a 500 -- and from then on every page that
    //     reads all events' hashtags (filter reports, the hashtag lists, the
    //     admin events list) answered 500 too, until the document was
    //     repaired by hand. The weakest writer is anyone holding an
    //     unprotected editor's link. See lib/eventSaveRules.ts.
    const hashtagProblem = eventHashtagsProblem(hashtags) ?? eventCategorizedHashtagsProblem(categorizedHashtags);
    if (hashtagProblem) {
      return NextResponse.json({ success: false, error: hashtagProblem }, { status: 400 });
    }

    // WHAT: The late-write guard: which editor tab sent this save, and its
    //     place in that tab's sequence of saves (lib/statsFieldChanges.ts).
    // WHY: A save can outlive the editor's patience with it -- a slow request
    //     is given up on and sent again -- and then land after a newer one,
    //     putting the older values back, or land twice. The write below is
    //     conditional on no save from the same tab with the same or a higher
    //     number having landed first. Read from the body itself: these are not
    //     project fields, so they pass for grant holders too.
    const sequence = parseEditorSequence(body);
    if (!sequence.ok) {
      return NextResponse.json({ success: false, error: sequence.error }, { status: 400 });
    }
    // WHAT: Counts (statsIncrements) only with the guard.
    // WHY: A set value sent twice stores the same value; a count sent twice
    //     counts twice. The editor retries a save whose answer never came with
    //     the same tabId and clientSeq, and the guard turns the second copy
    //     away, so each tap is counted once.
    if (statsChanges.value && Object.keys(statsChanges.value.increments).length > 0 && !sequence.value) {
      return NextResponse.json(
        { success: false, error: 'statsIncrements must be sent with tabId and clientSeq' },
        { status: 400 }
      );
    }

    logInfo('Updating project', { context: 'projects', projectId, styleId });

    // WHAT: Validate styleId against report_styles collection (26-color system)
    // WHY: Using new report style system, not legacy page_styles_enhanced
    if (styleId && styleId !== null && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid styleId format' },
          { status: 400 }
        );
      }
    }

    // WHAT: Reuse the client the guard block above already connected and pinged.
    // WHY: connectToDatabase() pings the cluster; a second ping in the same
    //     request was one more round trip on every editor save.
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // If styleId is provided, validate it exists in report_styles collection
    // If invalid, remove it instead of rejecting (use default style)
    if (styleId && styleId !== null && styleId !== 'null') {
      const reportStylesCollection = db.collection('report_styles');
      const styleExists = await reportStylesCollection.findOne({ _id: new ObjectId(styleId) });
      
      if (!styleExists) {
        logWarn('Invalid styleId provided, removing to use default style', { context: 'projects', projectId, styleId });
        // Don't reject - just remove the invalid styleId to use default
        // This prevents "Referenced report style does not exist" errors
        styleId = null;
      }
    }
    
    // Get the current project to compare hashtags
    const currentProject = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Enhanced update data to include categorized hashtags
    const setData: any = {
      updatedAt: new Date().toISOString()
    };
    let unsetData: any = {};
    if (eventName !== undefined) setData.eventName = eventName;
    if (eventDate !== undefined) setData.eventDate = eventDate;
    if (hashtags !== undefined) setData.hashtags = hashtags || [];                                   // Traditional hashtags (backward compatibility)
    if (categorizedHashtags !== undefined) setData.categorizedHashtags = categorizedHashtags || {};  // New categorized hashtags field

    // WHAT: Validate and enrich stats before updating
    // WHY: Ensure data quality and add derived metrics
    // HOW: Field-level: only the keys this save names, and the derived totals
    //     they change, are written (as stats.<key>; see fieldLevelStatsUpdate),
    //     so a value another writer stored since the editor loaded -- fanmass
    //     results, a sheet pull, an admin, another device -- is left as it is.
    //     Whole: replaced as before.
    let validation: ValidationResult | null = null;
    let incData: Record<string, number> = {};
    let decremented: string[] = [];
    if (statsChanges.value) {
      const fieldLevel = fieldLevelStatsUpdate(currentProject.stats, statsChanges.value);
      validation = fieldLevel.validation;
      Object.assign(setData, fieldLevel.set);
      Object.assign(unsetData, fieldLevel.unset);
      incData = fieldLevel.inc;
      decremented = fieldLevel.decremented;
    } else if (stats !== undefined) {
      const prepared = prepareStatsForAnalytics(stats);
      validation = prepared.validation;
      setData.stats = prepared.stats; // Already enriched with derived metrics
    }

    // WHAT: Warn if data quality is poor (but don't reject)
    // WHY: Allow updates with incomplete data but flag for admin attention
    if (validation && !validation.hasMinimumData) {
      logWarn('Updating project with insufficient data quality', { context: 'projects', projectId, dataQuality: validation.dataQuality, completeness: validation.completeness, missingRequired: validation.missingRequired });
    }

    // WHAT: Handle styleIdEnhanced assignment/removal strategically
    // WHY: Migrated from old styleId to new styleIdEnhanced field name
    
    if (styleId === null || styleId === 'null') {
      // Remove styleIdEnhanced to use global/default style
      unsetData.styleIdEnhanced = '';
      logDebug('Removing styleIdEnhanced', { context: 'projects', projectId, method: 'PUT' });
    } else if (styleId && styleId !== undefined) {
      // Set specific styleIdEnhanced
      setData.styleIdEnhanced = styleId;
      logDebug('Setting styleIdEnhanced', { context: 'projects', projectId, styleId, method: 'PUT' });
    } else {
      logDebug('No styleId in request', { context: 'projects', projectId, method: 'PUT' });
    }
    // If styleId is not provided in the request, don't modify existing styleIdEnhanced
    
    // WHAT: Handle reportTemplateId assignment/removal
    // WHY: Allow events to override partner or default report templates
    if (reportTemplateId === null || reportTemplateId === '' || reportTemplateId === 'null') {
      // Remove reportTemplateId (use partner or default template)
      unsetData.reportTemplateId = '';
      logDebug('Removing reportTemplateId', { context: 'projects', projectId, method: 'PUT' });
    } else if (reportTemplateId && reportTemplateId !== undefined && ObjectId.isValid(reportTemplateId)) {
      // Set specific reportTemplateId
      setData.reportTemplateId = new ObjectId(reportTemplateId);
      logDebug('Setting reportTemplateId', { context: 'projects', projectId, reportTemplateId, method: 'PUT' });
    } else if (reportTemplateId !== undefined) {
      logWarn('Invalid reportTemplateId', { context: 'projects', projectId, reportTemplateId, method: 'PUT' });
    }
    // If reportTemplateId is not provided in the request, don't modify existing reportTemplateId
    
    // WHAT: Handle partner1Id and partner2Id assignment/removal
    // WHY: Convert old events to Sports Matches by setting partner references
    if (partner1Id === null || partner1Id === '' || partner1Id === 'null') {
      // Remove partner1Id
      unsetData.partner1Id = '';
      logDebug('Removing partner1Id', { context: 'projects', projectId, method: 'PUT' });
    } else if (partner1Id && partner1Id !== undefined && ObjectId.isValid(partner1Id)) {
      // Set specific partner1Id
      setData.partner1Id = new ObjectId(partner1Id);
      logDebug('Setting partner1Id', { context: 'projects', projectId, partner1Id, method: 'PUT' });
    }
    
    if (partner2Id === null || partner2Id === '' || partner2Id === 'null') {
      // Remove partner2Id (Type 1 event)
      unsetData.partner2Id = '';
      logDebug('Removing partner2Id', { context: 'projects', projectId, method: 'PUT' });
    } else if (partner2Id && partner2Id !== undefined && ObjectId.isValid(partner2Id)) {
      // Set specific partner2Id (Type 2 - Sports Match)
      setData.partner2Id = new ObjectId(partner2Id);
      logDebug('Setting partner2Id', { context: 'projects', projectId, partner2Id, method: 'PUT' });
    }
    
    // WHAT: The write, conditional on no newer save from the same editor tab
    //     having landed (see `sequence` above), and recording this one.
    // HOW: editorSequenceGuard: of two saves from one tab the one with the
    //     higher number wins whichever order they arrive in, and a save that
    //     arrives twice is written once, in one atomic update.
    const updateFilter: Record<string, unknown> = { _id: new ObjectId(projectId) };
    if (sequence.value) {
      const guard = editorSequenceGuard(sequence.value);
      Object.assign(updateFilter, guard.filter);
      Object.assign(setData, guard.set);
    }

    // Build the update operation object
    const updateOperation: any = { $set: setData };
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }
    if (Object.keys(incData).length > 0) {
      updateOperation.$inc = incData;
    }

    const result = await collection.updateOne(updateFilter, updateOperation);

    if (result.matchedCount === 0) {
      // WHAT: Nothing matched. With the guard, that is a newer save from this
      //     tab already stored, or this same save stored by an earlier copy of
      //     it (a retry goes out under the same clientSeq) -- unless the event
      //     was deleted meanwhile.
      // WHY: 200 with `stale: true`, not an error: what this save carried is
      //     already stored or superseded, so the editor treats it as done, and
      //     a count is not added twice. Nothing else below runs for it -- no
      //     hashtag counts, no Bitly recalculation, no notification -- because
      //     nothing was written.
      if (sequence.value && (await collection.findOne({ _id: new ObjectId(projectId) }, { projection: { _id: 1 } }))) {
        logInfo('Ignored a late editor save; a newer save from the same tab is stored', {
          context: 'projects',
          projectId,
          clientSeq: sequence.value.clientSeq,
        });
        return NextResponse.json({ success: true, stale: true });
      }
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    logInfo('Project updated successfully', { context: 'projects', projectId });

    // WHAT: A count taken down below zero goes back to zero.
    // WHY: Each device lets -1 through only while it shows more than zero, but
    //     two devices can both take the last one away: counted on the server,
    //     that is -1, which no count can be. Only a key this save took down is
    //     checked, and only a negative value is changed.
    for (const key of decremented) {
      await collection.updateOne(
        { _id: new ObjectId(projectId), [`stats.${key}`]: { $lt: 0 } },
        { $set: { [`stats.${key}`]: 0 } }
      );
    }

    // Enhanced hashtag change handling for both traditional and categorized hashtags
    // Use all hashtag representations (including category-prefixed versions)
    const currentAllHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: currentProject.hashtags || [],
      categorizedHashtags: currentProject.categorizedHashtags || {}
    }).map((h: string) => h.toLowerCase());
    
    // A hashtag list the body leaves out keeps its stored value.
    const newAllHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: (hashtags !== undefined ? hashtags : currentProject.hashtags) || [],
      categorizedHashtags: (categorizedHashtags !== undefined ? categorizedHashtags : currentProject.categorizedHashtags) || {}
    }).map((h: string) => h.toLowerCase());
    
    const hashtagsCollection = db.collection('hashtags');
    const now = new Date().toISOString();
    
    // Hashtags to add (in new but not in current)
    const hashtagsToAdd = newAllHashtagRepresentations.filter((h: string) => !currentAllHashtagRepresentations.includes(h));
    // Hashtags to remove (in current but not in new)
    const hashtagsToRemove = currentAllHashtagRepresentations.filter((h: string) => !newAllHashtagRepresentations.includes(h));
    
    // Update hashtag counts
    // NOTE: After the project write, not before it: a save the late-write
    //     guard turned away stored nothing, so it must count nothing either.
    if (hashtagsToAdd.length > 0) {
      // Process each hashtag individually to avoid conflicts
      for (const hashtag of hashtagsToAdd) {
        // First try to increment existing hashtag
        const updateResult = await hashtagsCollection.updateOne(
          { hashtag },
          { $inc: { count: 1 } }
        );
        
        // If no document was updated, create new hashtag
        if (updateResult.matchedCount === 0) {
          await hashtagsCollection.updateOne(
            { hashtag },
            { 
              $setOnInsert: { 
                hashtag, 
                count: 1,
                createdAt: now 
              }
            },
            { upsert: true }
          );
        }
      }
      logInfo('Added new hashtags', { context: 'projects', projectId, hashtagCount: hashtagsToAdd.length });
    }
    
    if (hashtagsToRemove.length > 0) {
      // Decrement count for removed hashtags
      for (const hashtag of hashtagsToRemove) {
        await hashtagsCollection.updateOne(
          { hashtag },
          { $inc: { count: -1 } }
        );
      }
      logInfo('Decremented count for hashtags', { context: 'projects', projectId, hashtagCount: hashtagsToRemove.length });
    }

    // WHAT: Trigger Bitly recalculation if eventDate changed
    // WHY: Date changes affect temporal boundaries for Bitly analytics attribution
    if (eventDate !== undefined && currentProject.eventDate !== eventDate) {
      logInfo('Event date changed, triggering Bitly recalculation', { context: 'projects', projectId });
      try {
        const bitlinksAffected = await recalculateProjectLinks(new ObjectId(projectId));
        logInfo('Recalculated Bitly links due to date change', { context: 'projects', projectId, bitlinksAffected });
      } catch (bitlyError) {
        logWarn('Failed to recalculate Bitly links', { context: 'projects', projectId }, bitlyError instanceof Error ? bitlyError : new Error(String(bitlyError)));
        // Don't fail the request if Bitly recalculation fails
      }
    }
    
    // WHAT: Log notification for project edit
    // WHY: Notify all users of project changes
    try {
      const actor = await getCurrentActor();
      await createNotification(db, {
        activityType: 'edit',
        actorId: actor.id,
        actorName: actor.name,
        projectId: projectId,
        projectName: eventName !== undefined ? eventName : currentProject.eventName,
        projectSlug: currentProject.viewSlug || null
      });
    } catch (notifError) {
      logError('Failed to create notification', { context: 'projects', projectId }, notifError instanceof Error ? notifError : new Error(String(notifError)));
      // Don't fail the request if notification fails
    }
    
    // WHAT: Hashtag cleanup only when this save dropped a representation, and
    //     only for those representations.
    // WHY: The editor saves on every click with the hashtags unchanged; those
    //     saves must not pay for any hashtag work.
    if (hashtagsToRemove.length > 0) {
      await cleanupRemovedHashtags(db, hashtagsToRemove);
    }

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount > 0
    });

  } catch (error) {
    logError('Failed to update project', { context: 'projects', projectId: projectId || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update project' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
  // F-009: this handler was reachable unauthenticated — a CSRF token is public,
  // and nothing else stood between the request and deleteOne(). Deletion is
  // admin-only; a page password must never be able to destroy an event.
  const deleteDenied = await requireAdmin();
  if (deleteDenied) return deleteDenied;

  let projectId: string | null = null;
  try {
    const url = new URL(request.url);
    projectId = url.searchParams.get('projectId');

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    logInfo('Deleting project', { context: 'projects', projectId });

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // Get the project's hashtags before deletion
    const project = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Delete the project
    const result = await collection.deleteOne({ _id: new ObjectId(projectId) });

    logInfo('Project deleted successfully', { context: 'projects', projectId });
    
    // WHAT: Trigger Bitly recalculation for affected links
    // WHY: Deleted event's date ranges must be redistributed to remaining events
    logInfo('Handling Bitly link redistribution after project deletion', { context: 'projects', projectId });
    try {
      const bitlinksAffected = await handleProjectDeletion(new ObjectId(projectId));
      logInfo('Redistributed date ranges for Bitly links', { context: 'projects', projectId, bitlinksAffected });
    } catch (bitlyError) {
      logWarn('Failed to handle Bitly redistribution', { context: 'projects', projectId }, bitlyError instanceof Error ? bitlyError : new Error(String(bitlyError)));
      // Don't fail the request if Bitly handling fails
    }
    
    // Enhanced hashtag cleanup for both traditional and categorized hashtags
    // Remove all hashtag representations (including category-prefixed versions)
    const allDeletedHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {}
    });
    
    if (allDeletedHashtagRepresentations.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Decrement count for each hashtag representation
      for (const hashtagRepresentation of allDeletedHashtagRepresentations) {
        await hashtagsCollection.updateOne(
          { hashtag: hashtagRepresentation.toLowerCase() },
          { $inc: { count: -1 } }
        );
      }
      
      logInfo('Decremented count for hashtag representations', { context: 'projects', projectId, hashtagCount: allDeletedHashtagRepresentations.length });
      
      // WHAT: Same targeted cleanup as PUT, for this event's representations only
      //     (it used to share the full-collection sweep).
      await cleanupRemovedHashtags(db, allDeletedHashtagRepresentations);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logError('Failed to delete project', { context: 'projects', projectId: projectId || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete project' 
      },
      { status: 500 }
    );
  }
}
