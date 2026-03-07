/**
 * GET/PUT /api/admin/landing-settings
 * WHAT: Read or update landing page settings (which report slug, optional static snapshot metadata)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { hasMinimumRole } from '@/lib/permissions';
import { getLandingSettings, setLandingReportSlug } from '@/lib/landingSettings';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    if (!hasMinimumRole(user.role, 'admin')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const settings = await getLandingSettings();
    return NextResponse.json({
      success: true,
      settings: settings ?? { landingReportSlug: (await import('@/lib/landingSettings')).DEFAULT_LANDING_SLUG },
    });
  } catch (err) {
    console.error('[landing-settings] GET', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed to load' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    if (!hasMinimumRole(user.role, 'admin')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const slug = typeof body?.landingReportSlug === 'string' ? body.landingReportSlug.trim() : null;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'landingReportSlug is required' }, { status: 400 });
    }
    await setLandingReportSlug(slug);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[landing-settings] PUT', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed to save' }, { status: 500 });
  }
}
