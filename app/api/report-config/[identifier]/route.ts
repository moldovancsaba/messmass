import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { ReportTemplate, ResolvedTemplate, HARDCODED_DEFAULT_TEMPLATE } from '@/lib/reportTemplateTypes';

// WHAT: Report configuration resolution endpoint (v11.0.0)
// WHY: Central API for resolving report templates with hierarchy support
// HOW: Project → Partner → Default → Hardcoded fallback

/**
 * WHAT: Resolve report template for given entity
 * WHY: Templates follow inheritance: entity-specific → partner → default
 * HOW: Try each level in sequence, return first match with metadata
 */
async function resolveReportTemplate(
  entityType: 'project' | 'partner',
  identifier: string
): Promise<ResolvedTemplate> {
  const db = await getDb();
  const templatesCollection = db.collection('report_templates');
  const projectsCollection = db.collection('projects');
  const partnersCollection = db.collection('partners');

  console.log(`🔍 Resolving template for ${entityType}: ${identifier}`);

  /**
   * WHAT: Populate template dataBlocks with full block documents
   * WHY: Template only has blockId references, need full blocks with chartIds
   * HOW: Fetch data_blocks documents for each blockId in template
   */
  async function populateDataBlocks(template: any): Promise<any> {
    if (!template.dataBlocks || template.dataBlocks.length === 0) {
      return template;
    }

    const dataBlocksCollection = db.collection('data_blocks');
    const blockIds = template.dataBlocks.map((ref: any) => 
      typeof ref.blockId === 'string' && ObjectId.isValid(ref.blockId)
        ? new ObjectId(ref.blockId)
        : ref.blockId
    );

    const blocks = await dataBlocksCollection.find({
      _id: { $in: blockIds }
    }).toArray();

    // Map blocks back to template order with full block data
    const populatedBlocks = template.dataBlocks.map((ref: any) => {
      const blockId = ref.blockId.toString();
      const block = blocks.find(b => b._id.toString() === blockId);
      
      if (!block) {
        console.warn(`⚠️  Block not found: ${blockId}`);
        return null;
      }

      // WHAT: Return full block structure that UnifiedDataVisualization expects
      // WHY: Component needs charts array with chartId, width, order for each chart
      return {
        _id: block._id.toString(),
        name: block.name,
        showTitle: block.showTitle ?? true,
        order: ref.order,
        isActive: block.isActive ?? true,
        charts: block.charts || []
      };
    }).filter((b: any) => b !== null);

    return {
      ...template,
      dataBlocks: populatedBlocks
    };
  }

  // ==========================================
  // LEVEL 1: Project-Specific Template
  // ==========================================
  if (entityType === 'project') {
    try {
      // Build query: match by _id, viewSlug, or editSlug
      const orConds: any[] = [
        { viewSlug: identifier },
        { editSlug: identifier }
      ];
      if (ObjectId.isValid(identifier)) {
        orConds.push({ _id: new ObjectId(identifier) });
      }

      const project = await projectsCollection.findOne({ $or: orConds });
      
      if (project?.reportTemplateId) {
        const templateId = typeof project.reportTemplateId === 'string' && ObjectId.isValid(project.reportTemplateId)
          ? new ObjectId(project.reportTemplateId)
          : project.reportTemplateId;
        
        const template = await templatesCollection.findOne({ _id: templateId });
        if (template) {
          console.log(`✅ Using project-specific template: ${template.name}`);
          const populated = await populateDataBlocks(template);
          return {
            template: populated as ReportTemplate,
            resolvedFrom: 'project',
            source: project.eventName || project._id.toString()
          };
        }
      }

      // ==========================================
      // LEVEL 2: Partner Template (via project's partner)
      // ==========================================
      if (project?.partner1) {
        const partnerId = typeof project.partner1 === 'object' && '_id' in project.partner1
          ? project.partner1._id
          : project.partner1;
        
        const partner = await partnersCollection.findOne({ _id: partnerId });
        if (partner?.reportTemplateId) {
          const templateId = typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)
            ? new ObjectId(partner.reportTemplateId)
            : partner.reportTemplateId;
          
          const template = await templatesCollection.findOne({ _id: templateId });
          if (template) {
            console.log(`✅ Using partner template: ${template.name} (via ${partner.name})`);
            const populated = await populateDataBlocks(template);
            
            // WHAT: Merge partner's styleId if template doesn't have one
            // WHY: Partner branding should apply even when accessed via project
            const finalTemplate = {
              ...populated,
              styleId: populated.styleId || partner.styleId || null
            };
            
            return {
              template: finalTemplate as ReportTemplate,
              resolvedFrom: 'partner',
              source: partner.name || partner._id.toString()
            };
          }
        }
      }
    } catch (error) {
      console.error('⚠️  Error resolving project/partner template:', error);
    }
  }

  // ==========================================
  // LEVEL 2: Direct Partner Template
  // ==========================================
  if (entityType === 'partner') {
    try {
      // Build query: match by _id or viewSlug
      const orConds: any[] = [{ viewSlug: identifier }];
      if (ObjectId.isValid(identifier)) {
        orConds.push({ _id: new ObjectId(identifier) });
      }

      const partner = await partnersCollection.findOne({ $or: orConds });
      if (partner?.reportTemplateId) {
        const templateId = typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)
          ? new ObjectId(partner.reportTemplateId)
          : partner.reportTemplateId;
        
        const template = await templatesCollection.findOne({ _id: templateId });
        if (template) {
          console.log(`✅ Using partner-specific template: ${template.name}`);
          const populated = await populateDataBlocks(template);
          
          // WHAT: Merge partner's styleId if template doesn't have one
          // WHY: Partner branding should apply to their reports even if template is shared
          // HOW: Override template.styleId with partner.styleId when template has null
          const finalTemplate = {
            ...populated,
            styleId: populated.styleId || partner.styleId || null
          };
          
          console.log('🎨 StyleId resolution:', {
            templateStyleId: populated.styleId,
            partnerStyleId: partner.styleId,
            finalStyleId: finalTemplate.styleId
          });
          
          return {
            template: finalTemplate as ReportTemplate,
            resolvedFrom: 'partner',
            source: partner.name || partner._id.toString()
          };
        }
      }
    } catch (error) {
      console.error('⚠️  Error resolving partner template:', error);
    }
  }

  // ==========================================
  // SPECIAL CASE: Force Default Event Template for Partner Reports
  // ==========================================
  if (identifier === '__default_event__') {
    try {
      console.log('🎯 Special case: Forcing default event template for partner report');
      const defaultEventTemplate = await templatesCollection.findOne({ 
        type: 'event', 
        isDefault: true 
      });
      if (defaultEventTemplate) {
        console.log(`✅ Using forced default event template: ${defaultEventTemplate.name}`);
        const populated = await populateDataBlocks(defaultEventTemplate);
        return {
          template: populated as ReportTemplate,
          resolvedFrom: 'default',
          source: 'partner-report-system'
        };
      }
    } catch (error) {
      console.error('⚠️  Error resolving forced default event template:', error);
    }
  }

  // ==========================================
  // LEVEL 3: Default Template
  // ==========================================
  try {
    const defaultTemplate = await templatesCollection.findOne({ isDefault: true });
    if (defaultTemplate) {
      console.log(`✅ Using default template: ${defaultTemplate.name}`);
      const populated = await populateDataBlocks(defaultTemplate);
      return {
        template: populated as ReportTemplate,
        resolvedFrom: 'default',
        source: 'system-default'
      };
    }
  } catch (error) {
    console.error('⚠️  Error resolving default template:', error);
  }

  // ==========================================
  // LEVEL 4: Hardcoded Fallback
  // ==========================================
  console.log('⚠️  No database templates found, using hardcoded fallback');
  return {
    template: {
      ...HARDCODED_DEFAULT_TEMPLATE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ReportTemplate,
    resolvedFrom: 'hardcoded',
    source: 'system-hardcoded'
  };
}

/**
 * GET /api/report-config/[identifier]
 * 
 * WHAT: Resolve and return report configuration for given entity
 * WHY: Central endpoint for frontend pages to fetch their report layout
 * 
 * Query Parameters:
 * - type: 'project' | 'partner' (required)
 * 
 * Response:
 * {
 *   success: true,
 *   template: ReportTemplate,
 *   resolvedFrom: 'project' | 'partner' | 'default' | 'hardcoded',
 *   source: string
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await context.params;
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') as 'project' | 'partner' | null;

    // Validation
    if (!identifier) {
      return NextResponse.json({
        success: false,
        error: 'Identifier is required'
      }, { status: 400 });
    }

    if (!entityType || !['project', 'partner'].includes(entityType)) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter "type" must be "project" or "partner"'
      }, { status: 400 });
    }

    // Resolve template
    const resolved = await resolveReportTemplate(entityType, identifier);

    return NextResponse.json({
      success: true,
      template: resolved.template,
      resolvedFrom: resolved.resolvedFrom,
      source: resolved.source
    });

  } catch (error) {
    console.error('❌ Failed to resolve report config:', error);
    
    // Return hardcoded fallback on any error
    return NextResponse.json({
      success: true,
      template: {
        ...HARDCODED_DEFAULT_TEMPLATE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      resolvedFrom: 'hardcoded',
      source: 'error-fallback'
    });
  }
}
