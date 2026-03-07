/**
 * GET /api/landing-static
 * WHAT: Public API returning pre-generated static snapshot for the main page
 * WHY: messmass.com can render static content without live DB/report pipeline
 */

import { NextResponse } from 'next/server';
import { getLandingSettings } from '@/lib/landingSettings';

export async function GET() {
  try {
    const settings = await getLandingSettings();
    const snapshot = settings?.staticSnapshot ?? null;
    const landingReportSlug = settings?.landingReportSlug ?? (await import('@/lib/landingSettings')).DEFAULT_LANDING_SLUG;
    return NextResponse.json({
      success: true,
      staticSnapshot: snapshot,
      generatedAt: settings?.generatedAt ?? null,
      landingReportSlug,
    });
  } catch (err) {
    console.error('[landing-static]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load' },
      { status: 500 }
    );
  }
}
