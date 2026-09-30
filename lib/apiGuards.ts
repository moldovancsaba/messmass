// lib/apiGuards.ts
// WHAT: Authentication guards for mutating API routes.
// WHY: Audit finding F-009 — 40 route files export POST/PUT/PATCH/DELETE handlers
//     with no authentication primitive anywhere in them. Verified on
//     `DELETE /api/projects`: with a CSRF token that any anonymous caller can
//     fetch from /api/csrf-token, the request reached the database lookup and
//     returned 404 "Project not found". Against a real id it would have deleted
//     the project. CSRF was the only barrier, and CSRF is not authentication.
// HOW: Two guards. Most mutations are admin-only. Project updates are not, because
//     event operators run the editor behind a page password rather than an admin
//     session — so that guard accepts an admin session OR an edit grant for the
//     specific project, and nothing else.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from './auth';
import { currentPageGrants, hasAnyEditGrant } from './pageAccess';
import { getStakeholderSession, type StakeholderSessionData } from './auth/stakeholderSession';
import type { StakeholderRole } from './stakeholderGrants';

function unauthorized(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: 'UNAUTHENTICATED' },
    { status: 401 }
  );
}

// WHAT: 401 for an editor save or editor-driven write that lacks edit access.
// WHY: The editors must tell "re-establish access, then retry" apart from every
//     other failure. Before this, a save refused for want of a grant looked like
//     any other error: the event editor showed "Save Error" for three seconds,
//     went back to "Ready", and the typed numbers existed only in the tab. The
//     remedy is the same for every cause -- the grant expired, was never issued,
//     or the admin session ended -- so it is one code. Still 401, not 403: the
//     caller may regain access. Every denial path uses the same body, so it
//     does not tell an anonymous caller whether an id exists.
function editAccessRequired(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: 'EDIT_ACCESS_REQUIRED' },
    { status: 401 }
  );
}

// WHAT: Require any authenticated admin-session user.
// WHY: Returns null to proceed, or a response to return as-is.
// NOTE: This is authentication, not authorisation — it deliberately does not
//     check role. Role checks belong to the individual route, and inventing a
//     role model here would be guessing at each route's intent.
export async function requireSession(): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (!user) return unauthorized('Sign in to perform this action.');
  return null;
}

// WHAT: Require an authenticated admin or superadmin session.
// WHY: requireSession() above authenticates and deliberately stops there, but
//     around twenty routes carried comments promising "admin-only" and enforced
//     nothing -- F-009 closed the anonymous hole by adding requireSession() and
//     the authorisation half was never built (F-025 / #400). getAdminUser()
//     grants the same permission array to every role, so the role field is the
//     only thing that distinguishes callers.
// NOTE: This is for session-authenticated routes only. API-key callers (camera,
//     fanmass) authenticate through the Bearer path in lib/apiAuth.ts and never
//     reach this guard, so gating here cannot break the fleet integrations.
export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (!user) return unauthorized('Sign in to perform this action.');
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json(
      { success: false, error: 'Administrator access required.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  return null;
}

// WHAT: Require superadmin specifically, not admin-or-superadmin.
// WHY: messmass#227. Approving a fan-identity merge is the one action that can
//     misattribute one real person's data to another if it's wrong -- the
//     issue's own constraint ("identity confidence and merge rules must be
//     governed") is why this is narrower than requireAdmin.
export async function requireSuperadmin(): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (!user) return unauthorized('Sign in to perform this action.');
  if (user.role !== 'superadmin') {
    return NextResponse.json(
      { success: false, error: 'Superadmin access required.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  return null;
}

// WHAT: Require a stakeholder-session cookie (messmass#231), scoped to one
//     report and restricted to specific roles. Returns the session data so
//     the route can confirm the request's own scopeId matches -- this guard
//     only checks that SOME valid grant exists with an allowed role; it does
//     not know which resource the caller is asking for.
// WHY: A sponsor's stakeholder-session should read that sponsor's report and
//     nothing else. Role alone isn't a scope check: two different sponsors
//     both hold role 'sponsor', so the calling route must still compare
//     session.scopeId against the resource id in the URL/body.
export async function requireStakeholderRole(
  request: NextRequest,
  roles: StakeholderRole[]
): Promise<{ session: StakeholderSessionData } | NextResponse> {
  const session = getStakeholderSession(request);
  if (!session) return unauthorized('Sign in to view this report.');
  if (!roles.includes(session.role)) {
    return NextResponse.json(
      { success: false, error: 'This access role cannot view this report.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  return { session };
}

// WHAT: Require an admin session OR an unlocked page editor.
// WHY: For the handful of routes the page-password editor drives that are not
//     scoped to one project. POST /api/auto-generate-chart-block is the case:
//     it writes a global chart configuration and accepts no project id, but
//     ReportContentManager calls it from EditorDashboard, which an event
//     operator reaches by page password. It had no guard at all -- verified
//     live, an anonymous caller with a CSRF token from the public
//     /api/csrf-token endpoint created a chart_configurations and a data_blocks
//     document. requireAdmin would have closed that and broken event editing
//     with it.
export async function requireEditorAccess(): Promise<NextResponse | null> {
  if (await getAdminUser()) return null;
  if (await hasAnyEditGrant()) return null;
  return editAccessRequired('Edit access expired or missing. Reopen the edit link or sign in.');
}

// WHAT: A database id as the write guards accept it: 24 hex characters.
// WHY: ObjectId.isValid() also accepts any 12-character string and an object
//     such as { id: '<24 hex>' }, and new ObjectId() resolves both to a real
//     document. The grant check compares page ids as strings, so an id in one
//     of those forms passed the guard while the password on the event's _id
//     was left out of the check (see hasProjectWriteGrant).
const OBJECT_ID_HEX = /^[0-9a-f]{24}$/i;

type GuardDb = {
  collection: (name: string) => {
    findOne: (q: Record<string, unknown>, o?: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  };
};

const PARTNER_EDIT_ACCESS_MESSAGE = 'Edit access expired or missing. Reopen the partner edit link or sign in.';
const EVENT_EDIT_ACCESS_MESSAGE = 'Edit access expired or missing. Reopen the event edit link or sign in.';

// WHAT: The 401 a partner editor save answers when the caller may not write.
// WHY: PUT /api/partners/edit/[slug] (custom report variants) refuses on its
//     own rule, and must answer with the same body as PUT /api/partners so the
//     editor treats both the same way.
export function partnerEditAccessRequired(): NextResponse {
  return editAccessRequired(PARTNER_EDIT_ACCESS_MESSAGE);
}

// WHAT: Copy only the listed fields of a request body.
// WHY: A page-grant holder may change only what its editor writes (see
//     PARTNER_EDITOR_WRITABLE_FIELDS and EVENT_EDITOR_WRITABLE_FIELDS). Fields
//     outside the list are ignored rather than rejected: the current editors
//     send only listed fields, but a partner editor tab opened before that
//     change still sends name and hashtags back unchanged with every save.
export function pickWritableFields(
  body: Record<string, unknown>,
  fields: readonly string[]
): Record<string, unknown> {
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
}

// WHAT: The partner fields a page-grant holder may change through
//     PUT /api/partners. Everything else in that body is admin-session only.
// WHY: A partner-edit grant comes from the partner-edit page password (and
//     renewals of it), and a page password is a shared secret handed to
//     partners and guests, not an admin credential. So the grant must unlock no
//     more than the partner-edit route itself already lets that caller write
//     (PUT /api/partners/edit/[slug] -> updateReportVariant): report content
//     stats, emoji, logo, style, template and the events-list display flags.
//     Name, hashtags, Google Sheets URL, clicker set, SportsDB link and Bitly
//     associations are admin settings. The partner editor never sends them (a
//     tab opened before it stopped sending name and hashtags still echoes
//     those unchanged), so dropping them for grant holders loses nothing the
//     editor does. Report content goes field-level (statsChanges /
//     statsRemoved, lib/statsFieldChanges.ts); whole `stats` stays for editor
//     tabs opened before that.
export const PARTNER_EDITOR_WRITABLE_FIELDS = [
  'stats',
  'statsChanges',
  'statsRemoved',
  'emoji',
  'showEmoji',
  'logoUrl',
  'styleId',
  'reportTemplateId',
  'showEventsList',
  'showEventsListTitle',
  'showEventsListDetails',
  'showOnlyTeam1Events',
] as const;

// WHAT: Is this signed-in user an administrator?
// WHY: getAdminUser() answers for every approved account, whatever its role
//     (guest, user, api, admin, superadmin). The write guards below let any
//     signed-in user save through the editors, as before, but the admin-only
//     fields -- an event's name, date and partner, style and template
//     references; a partner's name, hashtags, sheet, clicker set and link
//     settings -- follow requireAdmin's rule, the same one POST and DELETE on
//     those routes use (F-025 / #400).
function isAdminRole(role: unknown): boolean {
  return role === 'admin' || role === 'superadmin';
}

// WHAT: How a write was authorised. `isAdmin` is true only for an admin or
//     superadmin session; every other caller -- a page grant, or a signed-in
//     account with another role -- may change only the editor's own fields.
export type PartnerWriteAccess =
  | { allowed: true; via: 'session' | 'page-grant'; isAdmin: boolean }
  | { allowed: false; response: NextResponse };

// WHAT: Does this request hold a partner-edit grant PUT /api/partners accepts
//     for this partner?
// WHY: The grant is keyed to the URL slug the editor was opened with, which can
//     be the partner's viewSlug or its raw id (findPartnerByIdentifier accepts
//     both), so both are checked. It must also be newer than the partner-edit
//     password on any of the partner's identifiers, legacy slugs included, so
//     setting or regenerating that password cuts off earlier holders at once
//     (see currentPageGrants). Exported so GET /api/partners/edit/[slug] can
//     tell the editor at load time whether its saves will be accepted, by this
//     rule rather than a copy of it.
export async function hasPartnerWriteGrant(
  partnerId: string,
  viewSlug: unknown,
  legacyViewSlugs?: unknown
): Promise<boolean> {
  const grantIds = [
    partnerId,
    typeof viewSlug === 'string' && viewSlug ? viewSlug : null,
  ].filter((value): value is string => Boolean(value));
  const legacy = Array.isArray(legacyViewSlugs)
    ? legacyViewSlugs.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];
  return (await currentPageGrants('partner-edit', grantIds, legacy)).length > 0;
}

// WHAT: Require permission to modify one specific partner, and report how it
//     was granted so the route can limit a page-grant holder's fields.
// WHY: `PUT /api/partners` is also how the partner editor saves, and that
//     editor authenticates by page password (components/PartnerEditorDashboard
//     via app/partner-edit/[slug]), not by admin session. An unprotected
//     partner editor issues no grant: its slug is the partner's public report
//     slug, so holding it proves nothing, and saving there needs a session.
//     Create/delete stay session-only — the password editor never performs
//     them.
export async function requirePartnerWriteAccess(
  db: GuardDb,
  partnerId: string
): Promise<PartnerWriteAccess> {
  const user = await getAdminUser();
  if (user) return { allowed: true, via: 'session', isAdmin: isAdminRole(user.role) };

  const deny = (): PartnerWriteAccess => ({
    allowed: false,
    response: editAccessRequired(PARTNER_EDIT_ACCESS_MESSAGE),
  });
  if (typeof partnerId !== 'string' || !OBJECT_ID_HEX.test(partnerId)) return deny();

  const partner = await db.collection('partners').findOne(
    { _id: new ObjectId(partnerId) },
    { projection: { viewSlug: 1, legacyViewSlugs: 1 } }
  );
  // Missing partner yields the same 401 on purpose — same id-disclosure
  // reasoning as requireProjectWrite below.
  if (!partner) return deny();

  if (await hasPartnerWriteGrant(partnerId, partner.viewSlug, partner.legacyViewSlugs)) {
    return { allowed: true, via: 'page-grant', isAdmin: false };
  }
  return deny();
}

export async function requirePartnerWrite(
  db: GuardDb,
  partnerId: string
): Promise<NextResponse | null> {
  const access = await requirePartnerWriteAccess(db, partnerId);
  return access.allowed ? null : access.response;
}

// WHAT: The project fields a page-grant holder may change through
//     PUT /api/projects. Everything else in that body is admin-session only.
// WHY: An event edit grant comes from the edit password or, for an editor with
//     no password, from holding its edit link -- neither is an admin
//     credential. The event editor sends only these fields (EditorDashboard's
//     EditorSaveRequestBody, plus projectId): field-level stats
//     (statsChanges / statsRemoved), clicker counts (statsIncrements) and a
//     hashtag list it changed. `stats`
//     (the whole object) stays for editor tabs opened before field-level
//     saves. Partner, template and style references are admin settings:
//     re-pointing partner1Id or partner2Id changes what another partner's
//     public report aggregates, which is a write to a partner this caller
//     cannot edit. The event's name and date are admin settings too: the
//     editor has no control for either and no longer sends them (PUT
//     /api/projects keeps a field the body leaves out), and a date change
//     re-runs the Bitly link recalculation for the event.
export const EVENT_EDITOR_WRITABLE_FIELDS = [
  'hashtags',
  'categorizedHashtags',
  'stats',
  'statsChanges',
  'statsRemoved',
  'statsIncrements',
] as const;

// WHAT: How a project write was authorised; see PartnerWriteAccess for `isAdmin`.
export type ProjectWriteAccess =
  | { allowed: true; via: 'session' | 'page-grant'; isAdmin: boolean }
  | { allowed: false; response: NextResponse };

// WHAT: Does this request hold an event edit grant PUT /api/projects accepts
//     for this project?
// WHY: Only a grant for edit:<editSlug> counts -- the _id is public, so a grant
//     keyed to it proves nothing about the edit link. It must also be newer
//     than the edit password on the editSlug or the _id (see
//     currentPageGrants), so setting or regenerating that password stops the
//     next save of anyone who got in before it. Exported so GET
//     /api/projects/edit/[slug] reports `canSave` by this rule rather than a
//     copy of it.
// NOTE: Both ids must be strings, the projectId in its 24-hex form: an id in
//     any other form would drop out of the password lookup (currentPageGrants
//     ignores non-strings) and a password set on the _id to cut this grant off
//     would not count. Anything else is refused.
export async function hasProjectWriteGrant(editSlug: string, projectId: string): Promise<boolean> {
  if (typeof editSlug !== 'string' || !editSlug || typeof projectId !== 'string' || !OBJECT_ID_HEX.test(projectId)) {
    return false;
  }
  return (await currentPageGrants('edit', [editSlug], [projectId])).length > 0;
}

// WHAT: Require permission to modify one specific project, and report how it
//     was granted so the route can limit a page-grant holder's fields.
// WHY: `PUT /api/projects` is how the event editor saves clicker and stats data,
//     and that editor authenticates by page password or by holding an
//     unprotected editor's edit link, not by admin session
//     (components/EditorDashboard.tsx). Requiring a session here would have
//     broken live data collection at events — so the grant path exists and is
//     scoped to the individual project's edit slug, never to projects in
//     general. The grant comes from the edit password, or from GET
//     /api/projects/edit/[slug] serving an unprotected editor by its secret
//     edit link, and never from anything that knows only the project id, which
//     is public — so this still refuses an anonymous caller who has an id and
//     nothing else (F-009). Only an admin or superadmin session may write more
//     than EVENT_EDITOR_WRITABLE_FIELDS; the route applies that when `isAdmin`
//     is false. `projectId` must be the 24-hex form (see hasProjectWriteGrant).
export async function requireProjectWriteAccess(
  db: GuardDb,
  projectId: string
): Promise<ProjectWriteAccess> {
  const user = await getAdminUser();
  if (user) return { allowed: true, via: 'session', isAdmin: isAdminRole(user.role) };

  const deny = (): ProjectWriteAccess => ({
    allowed: false,
    response: editAccessRequired(EVENT_EDIT_ACCESS_MESSAGE),
  });
  if (typeof projectId !== 'string' || !OBJECT_ID_HEX.test(projectId)) return deny();

  const project = await db.collection('projects').findOne(
    { _id: new ObjectId(projectId) },
    { projection: { editSlug: 1 } }
  );
  // A missing project yields the same 401 on purpose: telling an
  // unauthenticated caller which project ids exist is itself a disclosure.
  const editSlug = project && typeof project.editSlug === 'string' ? project.editSlug : null;
  if (!editSlug) return deny();

  if (await hasProjectWriteGrant(editSlug, projectId)) return { allowed: true, via: 'page-grant', isAdmin: false };
  return deny();
}

// WHAT: requireProjectWriteAccess as null-or-response, for callers that do not
//     limit fields by how access was granted.
export async function requireProjectWrite(
  db: GuardDb,
  projectId: string
): Promise<NextResponse | null> {
  const access = await requireProjectWriteAccess(db, projectId);
  return access.allowed ? null : access.response;
}
