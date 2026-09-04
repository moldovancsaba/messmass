// lib/pagePasswordAccess.ts
// WHAT: Resource-scoped authorization gate for GET/DELETE /api/page-passwords.
// WHY: Finding F-MM-01 -- requireSession() only proves the caller is signed in,
//     not that they have any relationship to the specific pageId+pageType being
//     read or unprotected. Every role, including guest, passed identically.
// HOW: Mirrors resolveCanonicalPageId's per-pageType dispatch (lib/pagePassword.ts)
//     to find the owning partner/organization/project, then reuses the same
//     scoped-access primitives requireProjectWrite/requirePartnerWrite already
//     rely on (validateOrganizationAccess, hasPageAccess) -- without their
//     "any admin session passes" shortcut, since that shortcut is exactly the
//     unscoped-authorization bug this closes.

import { ObjectId, type Db } from 'mongodb';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess } from '@/lib/pageAccess';
import { validateOrganizationAccess } from '@/lib/auth/orgGuard';
import { resolvePartnerIdentifier } from '@/lib/partnerIdentifier';
import { warn as logWarn } from '@/lib/logger';
import type { PageType } from '@/lib/pagePassword';

export interface OwnerScope {
  kind: 'organization' | 'partner' | 'project' | 'unresolved';
  organizationId?: string;
  partnerId?: string;
  projectId?: string;
}

function stripVariant(pageId: string): string {
  return pageId.split('::variant=')[0];
}

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(config.dbName) as unknown as Db;
}

// WHAT: Branches on pageType exactly like resolveCanonicalPageId does, but
//     resolves to an owning scope rather than a canonical slug.
// WHY: partner-report/partner-edit share resolvePartnerIdentifier's dispatch;
//     organization-report/organization-edit are keyed directly by the
//     organization's _id; event-report/edit are keyed by a project's
//     viewSlug/editSlug. filter and hashtag pageIds are a saved hashtag
//     combination and a raw hashtag string respectively -- neither maps to a
//     single partner/organization/project, so they resolve unresolved and fall
//     to the fail-closed path (superadmin only) below.
export async function resolveOwnerScope(pageId: string, pageType: PageType): Promise<OwnerScope> {
  const basePageId = stripVariant(pageId);
  const db = await getDb();

  switch (pageType) {
    case 'partner-report':
    case 'partner-edit': {
      const resolved = await resolvePartnerIdentifier(db, basePageId);
      if (!resolved?.partner) return { kind: 'unresolved' };

      const partner = resolved.partner as { _id: ObjectId; organizationId?: ObjectId };
      const partnerId = partner._id.toString();

      if (partner.organizationId) {
        return { kind: 'organization', organizationId: partner.organizationId.toString(), partnerId };
      }
      return { kind: 'partner', partnerId };
    }

    case 'organization-report':
    case 'organization-edit': {
      if (!ObjectId.isValid(basePageId)) return { kind: 'unresolved' };

      const organization = await db.collection('organizations').findOne(
        { _id: new ObjectId(basePageId) },
        { projection: { _id: 1 } }
      );
      if (!organization) return { kind: 'unresolved' };

      return { kind: 'organization', organizationId: organization._id.toString() };
    }

    case 'event-report':
    case 'edit': {
      const slugField = pageType === 'edit' ? 'editSlug' : 'viewSlug';
      const query: Record<string, unknown> = ObjectId.isValid(basePageId)
        ? { $or: [{ _id: new ObjectId(basePageId) }, { [slugField]: basePageId }] }
        : { [slugField]: basePageId };

      const project = await db.collection('projects').findOne(query, { projection: { _id: 1 } });
      if (!project) return { kind: 'unresolved' };

      return { kind: 'project', projectId: project._id.toString() };
    }

    case 'filter':
    case 'hashtag':
    default:
      return { kind: 'unresolved' };
  }
}

function forbidden(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'You do not have access to this page.', code: 'FORBIDDEN' },
    { status: 403 }
  );
}

// WHAT: Require the caller to have a genuine relationship to pageId+pageType.
// WHY: Called after requireSession() succeeds and before the route reads or
//     removes the page's password. Returns null to proceed, or a 403 response.
// NOTE: Fails closed -- an owner scope that cannot be resolved at all denies
//     everyone but superadmin, it never falls back to allowing the request.
export async function requirePageResourceAccess(
  pageId: string,
  pageType: PageType
): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (!user) return forbidden();
  if (user.role === 'superadmin') return null;

  const scope = await resolveOwnerScope(pageId, pageType);

  let allowed = false;
  if (scope.kind === 'organization' && scope.organizationId) {
    allowed = (await validateOrganizationAccess(scope.organizationId)) !== null;
    if (!allowed) {
      allowed = (await hasPageAccess(pageType, pageId)) || (scope.partnerId ? await hasPageAccess(pageType, scope.partnerId) : false);
    }
  } else if (scope.kind === 'partner' && scope.partnerId) {
    allowed = (await hasPageAccess(pageType, pageId)) || (await hasPageAccess(pageType, scope.partnerId));
  } else if (scope.kind === 'project' && scope.projectId) {
    // WHAT: Events/projects are NOT organization-scoped in resolveOwnerScope (it
    //     returns {kind:'project'} with no org), and the Manage Events console is
    //     a global surface — a console admin sees and manages every event, not a
    //     per-org subset. So a full 'admin' (or superadmin, already fast-pathed
    //     above) may manage an event's share status; guest/user/api roles still
    //     need a page-access grant for the specific event.
    // WHY: #376 scoped this route to stop guest accounts stripping page passwords,
    //     but the project branch had no admin path, so the Share Edit/Report modal
    //     403'd for every non-superadmin admin ("Failed to load share status").
    //     The cross-org restriction that #376 enforces still applies to the
    //     org/partner branches above (see the "denies an admin assigned to a
    //     different organization" test), which this does not touch.
    allowed = user.role === 'admin'
      || (await hasPageAccess(pageType, pageId))
      || (await hasPageAccess(pageType, scope.projectId));
  }

  if (allowed) return null;

  logWarn('Denied page-password access: no relationship to resolved scope', {
    context: 'page-passwords',
    role: user.role,
    pageType,
    scopeKind: scope.kind,
  });

  return forbidden();
}
