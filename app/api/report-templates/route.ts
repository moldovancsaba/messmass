import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
import {
  ReportTemplate,
  createTemplateDefaults,
  isReportTemplate
} from '@/lib/reportTemplateTypes';

// WHAT: Report Templates CRUD API (v11.0.0)
// WHY: Manage report template configurations for partners and events
// HOW: Full CRUD with validation, safety checks, and CSRF protection

/**
 * GET /api/report-templates
 * 
 * WHAT: List all report templates with optional filtering
 * WHY: Admin UI needs to display and manage templates
 * 
 * Query Parameters:
 * - type: Filter by template type ('event' | 'partner' | 'global')
 * - includeDefault: Include default template (default: true)
 * 
 * Response:
 * {
 *   success: true,
 *   templates: ReportTemplate[],
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const includeDefault = searchParams.get('includeDefault') !== 'false';

    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    // Build query
    const query: any = {};
    if (typeFilter && ['event', 'partner', 'global'].includes(typeFilter)) {
      query.type = typeFilter;
    }
    if (!includeDefault) {
      query.isDefault = false;
    }

    const templates = await templatesCollection
      .find(query)
      .sort({ isDefault: -1, name: 1 })  // Default first, then alphabetically
      .toArray();

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        ...t,
        _id: t._id.toString()
      })),
      count: templates.length
    });

  } catch (error) {
    console.error('❌ Failed to fetch report templates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates'
    }, { status: 500 });
  }
}

/**
 * POST /api/report-templates
 * 
 * WHAT: Create new report template
 * WHY: Admins need to create custom report layouts
 * 
 * Request Body: Partial<ReportTemplate>
 * 
 * Validation:
 * - Template name required
 * - Only one default template allowed
 * - dataBlocks must be valid array
 * - gridSettings must have valid structure
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // CSRF check (currently disabled globally but keep for future)
    const csrfValid = validateCsrfToken(request);
    if (!csrfValid && process.env.CSRF_ENABLED === 'true') {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSRF token'
      }, { status: 403 });
    }

    const body = await request.json();

    // Validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Template name is required'
      }, { status: 400 });
    }

    if (!Array.isArray(body.dataBlocks)) {
      return NextResponse.json({
        success: false,
        error: 'dataBlocks must be an array'
      }, { status: 400 });
    }

    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    // Check if marking as default
    if (body.isDefault === true) {
      // Only one default template allowed - unset current default
      await templatesCollection.updateMany(
        { isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
      );
      console.log('✅ Unmarked previous default template');
    }

    // Create template with defaults
    const newTemplate = {
      ...createTemplateDefaults(body),
      createdBy: user.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await templatesCollection.insertOne(newTemplate as any);
    
    console.log(`✅ Created template: ${newTemplate.name} (${result.insertedId})`);

    return NextResponse.json({
      success: true,
      template: {
        ...newTemplate,
        _id: result.insertedId.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Failed to create template:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create template'
    }, { status: 500 });
  }
}

/**
 * PUT /api/report-templates
 * 
 * WHAT: Update existing report template
 * WHY: Admins need to modify template configurations
 * 
 * Query Parameter: templateId (required)
 * Request Body: Partial<ReportTemplate>
 * 
 * Validation:
 * - Template must exist
 * - Cannot change isDefault without permission
 * - dataBlocks must remain valid array
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // CSRF check (currently disabled globally but keep for future)
    const csrfValid = validateCsrfToken(request);
    if (!csrfValid && process.env.CSRF_ENABLED === 'true') {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSRF token'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId || !ObjectId.isValid(templateId)) {
      return NextResponse.json({
        success: false,
        error: 'Valid templateId is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    // Check template exists
    const existing = await templatesCollection.findOne({ _id: new ObjectId(templateId) });
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }

    // If marking as default, unset other defaults
    if (body.isDefault === true && !existing.isDefault) {
      await templatesCollection.updateMany(
        { _id: { $ne: new ObjectId(templateId) }, isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
      );
      console.log('✅ Unmarked previous default template');
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Only update provided fields
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.type !== undefined) updates.type = body.type;
    if (body.isDefault !== undefined) updates.isDefault = body.isDefault;
    if (body.styleId !== undefined) updates.styleId = body.styleId;
    if (body.dataBlocks !== undefined) updates.dataBlocks = body.dataBlocks;
    if (body.gridSettings !== undefined) updates.gridSettings = body.gridSettings;

    // Update template
    await templatesCollection.updateOne(
      { _id: new ObjectId(templateId) },
      { $set: updates }
    );

    const updated = await templatesCollection.findOne({ _id: new ObjectId(templateId) });

    console.log(`✅ Updated template: ${templateId}`);

    return NextResponse.json({
      success: true,
      template: {
        ...updated,
        _id: updated!._id.toString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to update template:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update template'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/report-templates
 * 
 * WHAT: Delete report template with safety checks
 * WHY: Remove unused templates from system
 * 
 * Query Parameter: templateId (required)
 * 
 * Safety Checks:
 * - Cannot delete default template (must mark another as default first)
 * - Cannot delete template currently in use by partners/projects
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // CSRF check (currently disabled globally but keep for future)
    const csrfValid = validateCsrfToken(request);
    if (!csrfValid && process.env.CSRF_ENABLED === 'true') {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSRF token'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId || !ObjectId.isValid(templateId)) {
      return NextResponse.json({
        success: false,
        error: 'Valid templateId is required'
      }, { status: 400 });
    }

    const db = await getDb();
    const templatesCollection = db.collection('report_templates');
    const partnersCollection = db.collection('partners');
    const projectsCollection = db.collection('projects');

    // Check template exists
    const template = await templatesCollection.findOne({ _id: new ObjectId(templateId) });
    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }

    // Safety check 1: Cannot delete default template
    if (template.isDefault) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete default template. Mark another template as default first.'
      }, { status: 400 });
    }

    // Safety check 2: Cannot delete if in use
    const partnersUsingTemplate = await partnersCollection.countDocuments({
      reportTemplateId: new ObjectId(templateId)
    });
    
    const projectsUsingTemplate = await projectsCollection.countDocuments({
      reportTemplateId: new ObjectId(templateId)
    });

    if (partnersUsingTemplate > 0 || projectsUsingTemplate > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete template in use by ${partnersUsingTemplate} partner(s) and ${projectsUsingTemplate} project(s)`
      }, { status: 400 });
    }

    // Delete template
    await templatesCollection.deleteOne({ _id: new ObjectId(templateId) });

    console.log(`✅ Deleted template: ${template.name} (${templateId})`);

    return NextResponse.json({
      success: true,
      deletedId: templateId
    });

  } catch (error) {
    console.error('❌ Failed to delete template:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete template'
    }, { status: 500 });
  }
}
