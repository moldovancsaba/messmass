// app/api/admin/organizations/route.ts
// WHAT: Admin CRUD for organization records
// WHY: Organization Management must operate on the same collection used for partner membership

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { hasMinimumRole } from '@/lib/permissions';
import { rehostLogo } from '@/lib/logoStorage';
import {
  loadCentralizedClubRegistry,
  slugifyClub,
  syncClubAssetAcrossEntities,
  type CentralizedClubRegistry,
} from '@/lib/clubLogoResolver';

export const runtime = 'nodejs';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

function slugifyOrgName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function normalizeOrganization(
  organization: OrganizationRecord,
  clubRegistry?: CentralizedClubRegistry
) {
  const resolvedLogo =
    clubRegistry?.resolveLogo({
      organizationId: organization._id,
      slug: organization.slug,
      name: organization.name,
      fallbackUrl:
        organization.logoUrl ||
        (typeof organization.metadata?.logoUrl === 'string' ? organization.metadata.logoUrl : null),
    }) ||
    organization.logoUrl ||
    (typeof organization.metadata?.logoUrl === 'string' ? organization.metadata.logoUrl : null) ||
    null;

  return {
    _id: organization._id.toString(),
    name: organization.name,
    slug: organization.slug,
    logoUrl: resolvedLogo,
    status: organization.status || 'active',
    metadata: {
      ...(organization.metadata || {}),
      ...(resolvedLogo ? { logoUrl: resolvedLogo } : {}),
    },
    createdAt: organization.createdAt || new Date().toISOString(),
    updatedAt: organization.updatedAt || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const db = await getDb();
    const [organizations, clubRegistry] = await Promise.all([
      db
        .collection<OrganizationRecord>('organizations')
        .find({ status: { $ne: 'migrated' } as any })
        .sort({ name: 1 })
        .toArray(),
      loadCentralizedClubRegistry(db),
    ]);

    return NextResponse.json({
      success: true,
      organizations: organizations.map((org) => normalizeOrganization(org, clubRegistry)),
    });
  } catch (error) {
    console.error('Failed to list organizations:', error);
    return NextResponse.json({ success: false, error: 'Failed to list organizations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      slug?: unknown;
      logoUrl?: unknown;
      status?: unknown;
      metadata?: unknown;
    } | null;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, error: 'Organization name is required' }, { status: 400 });
    }

    const slugInput = typeof body?.slug === 'string' ? body.slug.trim() : '';
    const slugBase = slugifyOrgName(slugInput || name) || 'org';
    const status = body?.status === 'inactive' ? 'inactive' : 'active';
    const rawLogoUrl = typeof body?.logoUrl === 'string' ? body.logoUrl.trim() : '';
    const hostedLogoUrl = rawLogoUrl ? (await rehostLogo(rawLogoUrl)) || rawLogoUrl : '';
    const metadataObj =
      body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    const db = await getDb();
    const clubRegistry = await loadCentralizedClubRegistry(db);
    const resolvedLogoUrl =
      hostedLogoUrl ||
      clubRegistry.resolveLogo({ slug: slugBase, name }) ||
      '';
    const metadata: Record<string, unknown> = {
      ...metadataObj,
      ...(resolvedLogoUrl ? { logoUrl: resolvedLogoUrl } : {}),
    };
    const collection = db.collection<OrganizationRecord>('organizations');

    let slug = slugBase;
    for (let i = 0; i < 20; i += 1) {
      const candidate = i === 0 ? slugBase : `${slugBase}-${i + 1}`;
      // eslint-disable-next-line no-await-in-loop
      const existing = await collection.findOne({ slug: candidate });
      if (!existing) {
        slug = candidate;
        break;
      }
    }

    const now = new Date().toISOString();
    const organization: Omit<OrganizationRecord, '_id'> = {
      name,
      slug,
      ...(resolvedLogoUrl ? { logoUrl: resolvedLogoUrl } : {}),
      status,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await collection.insertOne(organization as OrganizationRecord);
    if (resolvedLogoUrl) {
      const canonicalSlug = slugifyClub(slug || name);
      await db.collection('club_assets').updateOne(
        { canonicalSlug },
        {
          $set: {
            name,
            canonicalSlug,
            logoUrl: resolvedLogoUrl,
            organizationId: insertResult.insertedId,
            entityKind: 'federation',
            updatedAt: now,
          },
          $addToSet: { aliases: { $each: [name.toLowerCase(), slug.toLowerCase()] } },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      await syncClubAssetAcrossEntities(db, {
        name,
        canonicalSlug,
        logoUrl: resolvedLogoUrl,
        aliases: [name, slug],
        organizationId: insertResult.insertedId,
      });
    }
    const createdOrganization = await collection.findOne({ _id: insertResult.insertedId });
    if (!createdOrganization) {
      throw new Error('Failed to load created organization');
    }

    return NextResponse.json({
      success: true,
      organization: normalizeOrganization(createdOrganization),
    });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to create organization' }, { status: 500 });
  }
}
