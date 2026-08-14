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

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from './auth';
import { hasPageAccess } from './pageAccess';

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

// WHAT: Require permission to modify one specific project.
// WHY: `PUT /api/projects` is how the event editor saves clicker and stats data,
//     and that editor authenticates by page password, not by admin session
//     (components/EditorDashboard.tsx). Requiring a session here would have broken
//     live data collection at events — so the grant path exists and is scoped to
//     the individual project's edit slug, never to projects in general.
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
