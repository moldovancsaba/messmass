/**
 * GET /api/admin/landing-projects
 * WHAT: Minimal project list (eventName, viewSlug) for main page report selector
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { hasMinimumRole } from '@/lib/permissions';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    if (!hasMinimumRole(user.role, 'admin')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const db = await getDb();
    const projects = await db
      .collection('projects')
      .find({})
      .project({ eventName: 1, viewSlug: 1, eventDate: 1 })
      .sort({ eventDate: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      projects: projects.map((p: any) => ({
        _id: p._id.toString(),
        eventName: p.eventName ?? 'Untitled',
        viewSlug: p.viewSlug ?? null,
        eventDate: p.eventDate,
      })),
    });
  } catch (err) {
    console.error('[landing-projects]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load projects' },
      { status: 500 }
    );
  }
}
