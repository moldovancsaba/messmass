import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import {
  createTemplateDefaults,
} from '@/lib/reportTemplateTypes';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';
import V3Entity from '@/lib/models/v3/Entity';
import V3Activity from '@/lib/models/v3/Activity';
import connectV3 from '@/lib/mongoose-v3';

// WHAT: Report Templates CRUD API (v11.0.0)
// WHY: Manage report template configurations for partners and events with V3 Org scoping
// HOW: Wrapped with withOrgContext for multi-tenant isolation

/**
 * GET Handler
 */
async function getTemplates(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = request.headers.get('x-v3-org-id');
    const typeFilter = searchParams.get('type');
    const includeDefault = searchParams.get('includeDefault') !== 'false';
    const includeAssociations = searchParams.get('includeAssociations') !== 'false';

    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    // Build query
    const query: any = { 
      organizationId: new ObjectId(orgId as string) 
    };
    if (typeFilter && ['event', 'partner', 'global'].includes(typeFilter)) {
      query.type = typeFilter;
    }
    if (!includeDefault) {
      query.isDefault = false;
    }

    const templates = await templatesCollection
      .find(query)
      .sort({ isDefault: -1, name: 1 })
      .toArray();

    if (!includeAssociations) {
      return NextResponse.json({
        success: true,
        templates: templates.map(t => ({ ...t, _id: t._id.toString() })),
        count: templates.length
      });
    }

    // Fetch associated V3 Entities/Activities
    await connectV3();
    const templatesWithAssociations = await Promise.all(
      templates.map(async (template) => {
        const baseTemplate = { ...template, _id: template._id.toString() };

        const associatedProjects = await V3Activity.find({ 
          organizationId: orgId,
          $or: [
            { "metadata.reportTemplateId": template._id.toString() },
            { "metadata.originalData.reportTemplateId": template._id }
          ]
        }, { name: 1, startDate: 1 }).lean();

        const associatedPartners = await V3Entity.find({ 
          organizationId: orgId,
          $or: [
            { "metadata.reportTemplateId": template._id.toString() },
            { "metadata.originalData.reportTemplateId": template._id }
          ]
        }, { name: 1, metadata: 1 }).lean();

        return {
          ...baseTemplate,
          associatedProjects: associatedProjects.map((p: any) => ({
            _id: p._id.toString(),
            eventName: p.name,
            eventDate: p.startDate
          })),
          associatedPartners: associatedPartners.map((p: any) => ({
            _id: p._id.toString(),
            name: p.name,
            emoji: p.metadata?.emoji || '🎯'
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      templates: templatesWithAssociations,
      count: templatesWithAssociations.length
    });

  } catch (error) {
    console.error('❌ Failed to fetch report templates:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST Handler
 */
async function createTemplate(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id') as string;
    const user = await getAdminUser();
    const body = await request.json();

    if (!body.name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    if (!Array.isArray(body.dataBlocks)) return NextResponse.json({ success: false, error: 'dataBlocks must be an array' }, { status: 400 });

    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    if (body.isDefault === true) {
      await templatesCollection.updateMany(
        { isDefault: true, organizationId: new ObjectId(orgId) },
        { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
      );
    }

    const newTemplate = {
      ...createTemplateDefaults(body),
      organizationId: new ObjectId(orgId),
      createdBy: user?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await templatesCollection.insertOne(newTemplate as any);
    return NextResponse.json({
      success: true,
      template: { ...newTemplate, _id: result.insertedId.toString() }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Failed to create template:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT Handler
 */
async function updateTemplate(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id') as string;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId || !ObjectId.isValid(templateId)) {
      return NextResponse.json({ success: false, error: 'Valid templateId is required' }, { status: 400 });
    }

    const body = await request.json();
    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    const existing = await templatesCollection.findOne({ 
      _id: new ObjectId(templateId),
      organizationId: new ObjectId(orgId)
    });
    if (!existing) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });

    if (body.isDefault === true && !existing.isDefault) {
      await templatesCollection.updateMany(
        { _id: { $ne: new ObjectId(templateId) }, isDefault: true, organizationId: new ObjectId(orgId) },
        { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
      );
    }

    const updates: any = { ...body, updatedAt: new Date().toISOString() };
    delete updates._id;
    delete updates.organizationId;

    await templatesCollection.updateOne({ _id: new ObjectId(templateId) }, { $set: updates });
    const updated = await templatesCollection.findOne({ _id: new ObjectId(templateId) });

    return NextResponse.json({ success: true, template: { ...updated, _id: templateId } });

  } catch (error) {
    console.error('❌ Failed to update template:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE Handler
 */
async function deleteTemplate(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id') as string;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId || !ObjectId.isValid(templateId)) {
      return NextResponse.json({ success: false, error: 'Valid templateId is required' }, { status: 400 });
    }

    const db = await getDb();
    const templatesCollection = db.collection('report_templates');

    const template = await templatesCollection.findOne({ 
      _id: new ObjectId(templateId),
      organizationId: new ObjectId(orgId)
    });
    if (!template) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    if (template.isDefault) return NextResponse.json({ success: false, error: 'Cannot delete default template' }, { status: 400 });

    await connectV3();
    const [assignedProjects, assignedPartners] = await Promise.all([
      V3Activity.countDocuments({
        organizationId: orgId,
        $or: [
          { "metadata.reportTemplateId": templateId },
          { "metadata.originalData.reportTemplateId": new ObjectId(templateId) }
        ]
      }),
      V3Entity.countDocuments({
        organizationId: orgId,
        $or: [
          { "metadata.reportTemplateId": templateId },
          { "metadata.originalData.reportTemplateId": new ObjectId(templateId) }
        ]
      })
    ]);

    if (assignedProjects > 0 || assignedPartners > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Template is still assigned to ${assignedProjects} project(s) and ${assignedPartners} partner(s)`,
        },
        { status: 400 }
      );
    }

    await templatesCollection.deleteOne({ _id: new ObjectId(templateId) });
    return NextResponse.json({ success: true, deletedId: templateId });

  } catch (error) {
    console.error('❌ Failed to delete template:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = (req: Request) => withOrgContext(req, getTemplates);
export const POST = (req: Request) => withOrgContext(req, createTemplate);
export const PUT = (req: Request) => withOrgContext(req, updateTemplate);
export const DELETE = (req: Request) => withOrgContext(req, deleteTemplate);
