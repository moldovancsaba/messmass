// WHAT: API for managing project-partner relationships
// WHY: Enable manual assignment of partner1/partner2 for template inheritance
// HOW: GET (list projects), PUT (update partners)

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/project-partners
 * 
 * WHAT: List all projects with partner info
 * WHY: Admin UI needs to display current relationships
 */
export async function GET() {
  try {
    const db = await getDb();
    const projectsCollection = db.collection('projects');

    // Fetch all projects sorted by newest first
    const projects = await projectsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      projects: projects.map(p => ({
        _id: p._id.toString(),
        eventName: p.eventName,
        editSlug: p.editSlug,
        partner1: p.partner1 ? (typeof p.partner1 === 'object' ? p.partner1._id?.toString() : p.partner1.toString()) : null,
        partner2: p.partner2 ? (typeof p.partner2 === 'object' ? p.partner2._id?.toString() : p.partner2.toString()) : null,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects'
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/project-partners
 * 
 * WHAT: Update project's partner relationships
 * WHY: Admin needs to manually assign or change partners
 * 
 * Body: { projectId: string, partner1Id: string | null, partner2Id: string | null }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, partner1Id, partner2Id } = body;

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid project ID'
      }, { status: 400 });
    }

    // Validate partner IDs if provided
    if (partner1Id && !ObjectId.isValid(partner1Id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid partner1 ID'
      }, { status: 400 });
    }

    if (partner2Id && !ObjectId.isValid(partner2Id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid partner2 ID'
      }, { status: 400 });
    }

    const db = await getDb();
    const projectsCollection = db.collection('projects');

    // Build update object
    const update: any = {};
    
    if (partner1Id) {
      update.partner1 = new ObjectId(partner1Id);
    } else {
      update.$unset = { partner1: '' };
    }

    if (partner2Id) {
      update.partner2 = new ObjectId(partner2Id);
    } else if (!update.$unset) {
      update.$unset = { partner2: '' };
    } else {
      update.$unset.partner2 = '';
    }

    // Separate $set and $unset operations
    const setFields: any = {};
    const unsetFields: any = {};

    if (partner1Id) {
      setFields.partner1 = new ObjectId(partner1Id);
    } else {
      unsetFields.partner1 = '';
    }

    if (partner2Id) {
      setFields.partner2 = new ObjectId(partner2Id);
    } else {
      unsetFields.partner2 = '';
    }

    const updateOperation: any = {};
    if (Object.keys(setFields).length > 0) {
      updateOperation.$set = setFields;
    }
    if (Object.keys(unsetFields).length > 0) {
      updateOperation.$unset = unsetFields;
    }

    // Update project
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error('Failed to update project partners:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update partners'
    }, { status: 500 });
  }
}
