// WHAT: Report Resolution API Endpoint (v12.0.0)
// WHY: Frontend needs to fetch resolved reports with simplified 2-level hierarchy
// HOW: Use ReportResolver to resolve project/partner reports

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createReportResolver } from '@/lib/report-resolver';

/**
 * GET /api/reports/resolve
 * 
 * WHAT: Resolve report configuration for given project or partner
 * WHY: Single endpoint for report resolution with new simplified hierarchy
 * 
 * Query Parameters:
 * - projectId: Project ID or slug (resolves: project → partner → default)
 * - partnerId: Partner ID or slug (resolves: partner → default)
 * 
 * Response:
 * {
 *   success: true,
 *   report: Report,
 *   resolvedFrom: 'project' | 'partner' | 'default',
 *   source: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const partnerId = searchParams.get('partnerId');

    // Validation: exactly one of projectId or partnerId required
    if (!projectId && !partnerId) {
      return NextResponse.json({
        success: false,
        error: 'Either projectId or partnerId is required'
      }, { status: 400 });
    }

    if (projectId && partnerId) {
      return NextResponse.json({
        success: false,
        error: 'Provide either projectId or partnerId, not both'
      }, { status: 400 });
    }

    // Get database and create resolver
    const db = await getDb();
    const resolver = createReportResolver(db);

    // Resolve report based on entity type
    let resolved;
    
    if (projectId) {
      // Resolve for project (checks project → partner → default)
      resolved = await resolver.resolveForProject(projectId);
    } else {
      // Resolve for partner (checks partner → default)
      resolved = await resolver.resolveForPartner(partnerId!);
    }

    return NextResponse.json({
      success: true,
      report: resolved.report,
      resolvedFrom: resolved.resolvedFrom,
      source: resolved.source
    });

  } catch (error) {
    console.error('❌ [/api/reports/resolve] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve report'
    }, { status: 500 });
  }
}
