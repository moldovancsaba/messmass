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
import { hasPageAccess, hasAnyEditGrant } from './pageAccess';
import { getStakeholderSession, type StakeholderSessionData } from './auth/stakeholderSession';
import type { StakeholderRole } from './stakeholderGrants';

function unauthorized(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: 'UNAUTHENTICATED' },
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
  return unauthorized('Sign in or open an event editor to perform this action.');
}

// WHAT: Require permission to modify one specific project.
// WHY: `PUT /api/projects` is how the event editor saves clicker and stats data,
//     and that editor authenticates by page password, not by admin session
//     (components/EditorDashboard.tsx). Requiring a session here would have broken
//     live data collection at events — so the grant path exists and is scoped to
//     the individual project's edit slug, never to projects in general.
// WHAT: Require permission to modify one specific partner.
// WHY: `PUT /api/partners` is also how the partner editor saves, and that
//     editor authenticates by page password (components/PartnerEditorDashboard
//     via app/partner-edit/[slug]), not by admin session. The grant is keyed
//     to the URL slug the editor was opened with, which can be the partner's
//     viewSlug or its raw id (findPartnerByIdentifier accepts both), so both
//     are checked. Create/delete stay session-only — the password editor
//     never performs them.
export async function requirePartnerWrite(
  db: { collection: (name: string) => { findOne: (q: Record<string, unknown>, o?: Record<string, unknown>) => Promise<Record<string, unknown> | null> } },
  partnerId: string
): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (user) return null;

  if (!ObjectId.isValid(partnerId)) return unauthorized('Sign in to perform this action.');

  const partner = await db.collection('partners').findOne(
    { _id: new ObjectId(partnerId) },
    { projection: { viewSlug: 1 } }
  );
  // Missing partner yields 401 rather than 404 on purpose — same id-disclosure
  // reasoning as requireProjectWrite above.
  if (!partner) return unauthorized('Sign in to perform this action.');

  const candidates = [
    partnerId,
    typeof partner.viewSlug === 'string' && partner.viewSlug ? partner.viewSlug : null,
  ].filter((value): value is string => Boolean(value));
  for (const pageId of candidates) {
    if (await hasPageAccess('partner-edit', pageId)) return null;
  }
  return unauthorized('Sign in or enter the page password to edit this partner.');
}

export async function requireProjectWrite(
  db: { collection: (name: string) => { findOne: (q: Record<string, unknown>, o?: Record<string, unknown>) => Promise<Record<string, unknown> | null> } },
  projectId: string
): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (user) return null;

  if (!ObjectId.isValid(projectId)) return unauthorized('Sign in to perform this action.');

  const project = await db.collection('projects').findOne(
    { _id: new ObjectId(projectId) },
    { projection: { editSlug: 1 } }
  );
  // A missing project yields 401 rather than 404 on purpose: telling an
  // unauthenticated caller which project ids exist is itself a disclosure.
  const editSlug = project && typeof project.editSlug === 'string' ? project.editSlug : null;
  if (!editSlug) return unauthorized('Sign in to perform this action.');

  if (await hasPageAccess('edit', editSlug)) return null;
  return unauthorized('Sign in or enter the page password to edit this event.');
}
