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
 * 
 * UPDATED (v11.37.0): Added support for hashtag and filter report types
 */
async function resolveReportTemplate(
  entityType: 'project' | 'partner' | 'hashtag' | 'filter',
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
      // WHAT: Validate secure UUID format (MongoDB ObjectId OR UUID v4)
      // WHY: Prevent slug-based URL guessing attacks (reject human-readable slugs)
      // HOW: Accept cryptographically random identifiers only
      
      // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (32 hex + 4 dashes)
      const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isMongoObjectId = ObjectId.isValid(identifier);
      const isUuidV4 = uuidV4Pattern.test(identifier);
      
      if (!isMongoObjectId && !isUuidV4) {
        console.log('❌ Invalid secure UUID format:', identifier);
        throw new Error('Invalid project ID format');
      }

      // WHAT: Match by _id (MongoDB ObjectId) OR viewSlug (UUID v4)
      // WHY: Both formats are cryptographically secure (prevent URL guessing)
      // HOW: UUID v4 uses viewSlug lookup, ObjectId uses _id lookup
      let project;
      if (isMongoObjectId) {
        project = await projectsCollection.findOne({ _id: new ObjectId(identifier) });
      } else {
        // UUID v4 format - lookup by viewSlug (secure)
        project = await projectsCollection.findOne({ viewSlug: identifier });
      }
      
      if (project?.reportTemplateId) {
        const templateId = typeof project.reportTemplateId === 'string' && ObjectId.isValid(project.reportTemplateId)
          ? new ObjectId(project.reportTemplateId)
          : project.reportTemplateId;
        
        const template = await templatesCollection.findOne({ _id: templateId });
        if (template) {
          console.log(`✅ Using project-specific template: ${template.name}`);
          const populated = await populateDataBlocks(template);
          
          // WHAT: Project's styleIdEnhanced takes precedence over template styleId
          // WHY: Event-specific branding should override template defaults
          // HOW: Use project.styleIdEnhanced first, then fall back to template.styleId
          const finalTemplate = {
            ...populated,
            styleId: project.styleIdEnhanced || populated.styleId || null
          };
          
          console.log('🎨 StyleId resolution (project-level):', {
            templateStyleId: populated.styleId,
            projectStyleId: project.styleIdEnhanced,
            finalStyleId: finalTemplate.styleId
          });
          
          return {
            template: finalTemplate as ReportTemplate,
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
            
            // WHAT: Style resolution hierarchy: project.styleIdEnhanced > partner.styleId > template.styleId
            // WHY: Event-specific style overrides partner style, which overrides template default
            // HOW: Check each level in order of precedence
            const finalTemplate = {
              ...populated,
              styleId: project.styleIdEnhanced || partner.styleId || populated.styleId || null
            };
            
            console.log('🎨 StyleId resolution (partner-level):', {
              templateStyleId: populated.styleId,
              partnerStyleId: partner.styleId,
              projectStyleId: project.styleIdEnhanced,
              finalStyleId: finalTemplate.styleId
            });
            
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
      // WHAT: Validate secure UUID format (MongoDB ObjectId OR UUID v4)
      // WHY: Prevent slug-based URL guessing attacks (reject human-readable slugs)
      // HOW: Accept cryptographically random identifiers only
      
      // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (32 hex + 4 dashes)
      const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isMongoObjectId = ObjectId.isValid(identifier);
      const isUuidV4 = uuidV4Pattern.test(identifier);
      
      if (!isMongoObjectId && !isUuidV4) {
        console.log('❌ Invalid secure UUID format:', identifier);
        throw new Error('Invalid partner ID format');
      }

      // WHAT: Match by _id (MongoDB ObjectId) OR viewSlug (UUID v4)
      // WHY: Both formats are cryptographically secure (prevent URL guessing)
      // HOW: UUID v4 uses viewSlug lookup, ObjectId uses _id lookup
      let partner;
      if (isMongoObjectId) {
        partner = await partnersCollection.findOne({ _id: new ObjectId(identifier) });
      } else {
        // UUID v4 format - lookup by viewSlug (secure)
        partner = await partnersCollection.findOne({ viewSlug: identifier });
      }
      if (partner?.reportTemplateId) {
        const templateId = typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)
          ? new ObjectId(partner.reportTemplateId)
          : partner.reportTemplateId;
        
        const template = await templatesCollection.findOne({ _id: templateId });
        if (template) {
          console.log(`✅ Using partner-specific template: ${template.name}`);
          const populated = await populateDataBlocks(template);
          
          // WHAT: Partner's styleId takes precedence over template styleId
          // WHY: Partner-specific branding should always override template defaults
          // HOW: Use partner.styleId first, then fall back to template.styleId
          const finalTemplate = {
            ...populated,
            styleId: partner.styleId || populated.styleId || null
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
  // LEVEL 2.5: Hashtag/Filter Template (NEW v11.37.0)
  // ==========================================
  // WHAT: For hashtag and filter reports, use global default template
  // WHY: Hashtags/filters don't have individual templates, but should use same v12 system
  // HOW: Skip to default template (no entity-specific lookups needed)
  if (entityType === 'hashtag' || entityType === 'filter') {
    console.log(`🏷️  Resolving template for ${entityType} report: ${identifier}`);
    // Fall through to default template resolution below
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
        source: entityType === 'hashtag' ? `hashtag:${identifier}` : entityType === 'filter' ? `filter:${identifier}` : 'system-default'
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

    if (!entityType || !['project', 'partner', 'hashtag', 'filter'].includes(entityType)) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter "type" must be "project", "partner", "hashtag", or "filter"'
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
