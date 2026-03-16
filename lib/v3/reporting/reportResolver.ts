import connectV3 from '@/lib/mongoose-v3';
import V3Entity from '@/lib/models/v3/Entity';
import V3Organization from '@/lib/models/v3/Organization';
import V3Activity from '@/lib/models/v3/Activity';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';

/**
 * V3ReportResolver
 * 
 * WHAT: Resolves report templates for V3 Entities and Activities
 * WHY: Bridge existing template system with new V3 hierarchy
 */
export class V3ReportResolver {
  
  /**
   * Resolves a report for a V3 Activity (Match/Event)
   * Hierarchy: Activity.metadata.reportId -> Entity.metadata.reportId -> Default
   */
  static async resolveForActivity(activityId: string, orgId: string) {
    await connectV3();
    
    const activity = await V3Activity.findOne({ _id: activityId, organizationId: orgId }).lean();
    if (!activity) throw new Error('Activity not found');

    const entity = await V3Entity.findOne({ _id: activity.ownerEntityId, organizationId: orgId }).lean();
    if (!entity) throw new Error('Owner entity not found');

    // 1. Check Activity metadata
    if (activity.metadata?.reportId) {
      const report = await this.getReportById(activity.metadata.reportId);
      if (report) return { report, resolvedFrom: 'activity', source: activity.name };
    }

    // 2. Check Entity metadata
    if (entity.metadata?.reportId) {
      const report = await this.getReportById(entity.metadata.reportId);
      if (report) return { report, resolvedFrom: 'entity', source: entity.name };
    }

    // 3. Fallback to System Default (V2 source)
    return this.getDefaultReport('event');
  }

  /**
   * Resolves a report for a V3 Entity (Team/Partner)
   * Hierarchy: Entity.metadata.reportId -> ParentEntity.metadata.reportId -> Default
   */
  static async resolveForEntity(entityId: string, orgId: string) {
    await connectV3();
    
    const entity = await V3Entity.findOne({ _id: entityId, organizationId: orgId }).lean();
    if (!entity) throw new Error('Entity not found');

    // 1. Check Entity metadata
    if (entity.metadata?.reportId) {
      const report = await this.getReportById(entity.metadata.reportId);
      if (report) return { report, resolvedFrom: 'entity', source: entity.name };
    }

    // 2. Check Parent Entity (recursive)
    if (entity.parentEntityId) {
      const parent = await V3Entity.findOne({ _id: entity.parentEntityId, organizationId: orgId }).lean();
      if (parent?.metadata?.reportId) {
        const report = await this.getReportById(parent.metadata.reportId);
        if (report) return { report, resolvedFrom: 'entity-parent', source: parent.name };
      }
    }

    // 3. Fallback to System Default (V2 source)
    return this.getDefaultReport('partner');
  }

  /**
   * Resolves a report for a V3 Organization (Root)
   * Hierarchy: Organization.metadata.reportId -> Default
   */
  static async resolveForOrganization(orgId: string) {
    await connectV3();
    
    const org = await V3Organization.findOne({ _id: orgId }).lean();
    if (!org) throw new Error('Organization not found');

    const metadata = org.metadata || {};
    const effectiveReportId = metadata.reportTemplateId || metadata.reportId;

    // 1. Check Organization metadata
    if (effectiveReportId) {
      const reportRes = await this.getReportById(effectiveReportId) as any;
      if (reportRes) {
        // WHAT: Inject Organization-specific style if defined
        if (metadata.styleId) {
          reportRes.styleId = metadata.styleId;
        }
        return { report: reportRes, resolvedFrom: 'organization', source: org.name };
      }
    }

    // 2. Fallback to System Default
    const defaultRes = await this.getDefaultReport('partner') as any;
    if (defaultRes && metadata.styleId) {
      defaultRes.report.styleId = metadata.styleId;
    }
    return defaultRes;
  }

  private static async getReportById(reportId: string) {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const report = await db.collection('reports').findOne({ _id: new ObjectId(reportId) });
    return report ? { ...report, _id: report._id.toString() } : null;
  }

  private static async getDefaultReport(type: 'event' | 'partner') {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const report = await db.collection('reports').findOne({ type, isDefault: true });
    return report ? { report: { ...report, _id: report._id.toString() }, resolvedFrom: 'default', source: 'system-default' } : null;
  }
}
