/**
 * Report Template Assignment API
 * 
 * Handles bulk assignment of report templates to projects and partners.
 * Allows assigning a single template to multiple entities at once.
 * 
 * POST /api/report-templates/assign
 * - Assigns template to projects and/or partners
 * - Updates reportTemplateId field in respective collections
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';

/**
 * POST /api/report-templates/assign
 * 
 * Request body:
 * - templateId: string (required) - Template to assign
 * - projectIds: string[] (optional) - Projects to assign template to
 * - partnerIds: string[] (optional) - Partners to assign template to
 * 
 * Returns:
 * - success: boolean
 * - projectsUpdated: number
 * - partnersUpdated: number
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication: Admin only
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { templateId, projectIds, partnerIds } = body;

    // Validation: Template ID required
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Validation: At least one entity type required
    if ((!projectIds || projectIds.length === 0) && (!partnerIds || partnerIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'At least one project or partner ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Verify template exists
    const template = await db.collection('report_templates').findOne({
      _id: new ObjectId(templateId)
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    let projectsUpdated = 0;
    let partnersUpdated = 0;

    // Assign to projects
    if (projectIds && projectIds.length > 0) {
      const projectObjectIds = projectIds.map((id: string) => new ObjectId(id));
      
      const projectResult = await db.collection('projects').updateMany(
        { _id: { $in: projectObjectIds } },
        { 
          $set: { 
            reportTemplateId: new ObjectId(templateId),
            updatedAt: new Date().toISOString()
          } 
        }
      );

      projectsUpdated = projectResult.modifiedCount;
    }

    // Assign to partners
    if (partnerIds && partnerIds.length > 0) {
      const partnerObjectIds = partnerIds.map((id: string) => new ObjectId(id));
      
      const partnerResult = await db.collection('partners').updateMany(
        { _id: { $in: partnerObjectIds } },
        { 
          $set: { 
            reportTemplateId: new ObjectId(templateId),
            updatedAt: new Date().toISOString()
          } 
        }
      );

      partnersUpdated = partnerResult.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      projectsUpdated,
      partnersUpdated,
      message: `Assigned template to ${projectsUpdated} projects and ${partnersUpdated} partners`
    });

  } catch (error) {
    console.error('Error assigning template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/report-templates/assign
 * 
 * Query params:
 * - projectIds: string (comma-separated project IDs)
 * - partnerIds: string (comma-separated partner IDs)
 * 
 * Removes template assignments from specified entities
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authentication: Admin only
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectIdsParam = searchParams.get('projectIds');
    const partnerIdsParam = searchParams.get('partnerIds');

    const projectIds = projectIdsParam ? projectIdsParam.split(',').filter(Boolean) : [];
    const partnerIds = partnerIdsParam ? partnerIdsParam.split(',').filter(Boolean) : [];

    // Validation: At least one entity required
    if (projectIds.length === 0 && partnerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one project or partner ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    let projectsUpdated = 0;
    let partnersUpdated = 0;

    // Remove from projects
    if (projectIds.length > 0) {
      const projectObjectIds = projectIds.map(id => new ObjectId(id));
      
      const projectResult = await db.collection('projects').updateMany(
        { _id: { $in: projectObjectIds } },
        { 
          $unset: { reportTemplateId: "" },
          $set: { updatedAt: new Date().toISOString() }
        }
      );

      projectsUpdated = projectResult.modifiedCount;
    }

    // Remove from partners
    if (partnerIds.length > 0) {
      const partnerObjectIds = partnerIds.map(id => new ObjectId(id));
      
      const partnerResult = await db.collection('partners').updateMany(
        { _id: { $in: partnerObjectIds } },
        { 
          $unset: { reportTemplateId: "" },
          $set: { updatedAt: new Date().toISOString() }
        }
      );

      partnersUpdated = partnerResult.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      projectsUpdated,
      partnersUpdated,
      message: `Removed template from ${projectsUpdated} projects and ${partnersUpdated} partners`
    });

  } catch (error) {
    console.error('Error removing template assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove template assignment' },
      { status: 500 }
    );
  }
}
