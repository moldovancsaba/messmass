// WHAT: Report Resolver - Simplified 2-Level Hierarchy (v12.0.0)
// WHY: Replace complex 4-level fallback (Project → Partner → Default → Hardcoded) with simple 2-level
// HOW: Project-specific report → System default (partner inheritance handled at data level)

import { ObjectId } from 'mongodb';

/**
 * WHAT: Report configuration from database
 * WHY: Type-safe interface for report data
 */
export interface Report {
  _id: ObjectId | string;
  name: string;
  description?: string;
  type: 'event' | 'partner';
  isDefault: boolean;
  styleId?: ObjectId | string;
  layout: {
    gridColumns: { desktop: number; tablet: number; mobile: number };
    blocks: Array<{
      id: string;
      title: string;
      showTitle: boolean;
      order: number;
      charts: Array<{
        chartId: string;
        width: number;
        order: number;
      }>;
    }>;
  };
  heroSettings: {
    showEmoji: boolean;
    showDateInfo: boolean;
    showExportOptions: boolean;
  };
  alignmentSettings: {
    alignTitles: boolean;
    alignDescriptions: boolean;
    alignCharts: boolean;
    minElementHeight?: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Project entity reference
 * WHY: Minimal project data needed for resolution
 */
export interface ProjectReference {
  _id: ObjectId | string;
  eventName: string;
  reportId?: ObjectId | string;
  partner1?: ObjectId | string | { _id: ObjectId | string };
}

/**
 * WHAT: Partner entity reference
 * WHY: Minimal partner data needed for resolution
 */
export interface PartnerReference {
  _id: ObjectId | string;
  name: string;
  reportId?: ObjectId | string;
}

/**
 * WHAT: Report resolution result
 * WHY: Include metadata about where report came from
 */
export interface ResolvedReport {
  report: Report;
  resolvedFrom: 'project' | 'partner' | 'default';
  source: string; // Entity name or "system-default"
}

/**
 * WHAT: Report Resolver
 * WHY: Handle report template resolution with simple 2-level hierarchy
 * HOW: Check project → Check partner → Use default
 * 
 * @example
 * ```typescript
 * const resolver = new ReportResolver(db);
 * const { report, resolvedFrom } = await resolver.resolveForProject(project);
 * ```
 */
export class ReportResolver {
  private db: any; // MongoDB database instance

  constructor(db: any) {
    this.db = db;
  }

  /**
   * WHAT: Resolve report for given project
   * WHY: Projects can have custom reports, inherit from partner, or use default
   * HOW: 2-level check: project.reportId → partner.reportId → default
   * 
   * @param project - Project reference or ID
   * @returns Resolved report with metadata
   */
  async resolveForProject(
    project: ProjectReference | ObjectId | string
  ): Promise<ResolvedReport> {
    const reportsCollection = this.db.collection('reports');
    const projectsCollection = this.db.collection('projects');
    const partnersCollection = this.db.collection('partners');

    // If string/ObjectId provided, fetch project
    let projectDoc: ProjectReference;
    if (typeof project === 'string' || project instanceof ObjectId) {
      const doc = await projectsCollection.findOne({ 
        _id: typeof project === 'string' ? new ObjectId(project) : project 
      });
      if (!doc) {
        throw new Error(`Project not found: ${project}`);
      }
      projectDoc = doc as ProjectReference;
    } else {
      projectDoc = project;
    }

    // Level 1: Check project-specific report
    if (projectDoc.reportId) {
      const reportId = typeof projectDoc.reportId === 'string' 
        ? new ObjectId(projectDoc.reportId) 
        : projectDoc.reportId;

      const report = await reportsCollection.findOne({ _id: reportId });
      if (report) {
        return {
          report: this.normalizeReport(report),
          resolvedFrom: 'project',
          source: projectDoc.eventName
        };
      }
    }

    // Level 2: Check partner default report
    if (projectDoc.partner1) {
      const partnerId = typeof projectDoc.partner1 === 'object' && '_id' in projectDoc.partner1
        ? projectDoc.partner1._id
        : projectDoc.partner1;

      const partner = await partnersCollection.findOne({ _id: partnerId });
      
      if (partner?.reportId) {
        const reportId = typeof partner.reportId === 'string'
          ? new ObjectId(partner.reportId)
          : partner.reportId;

        const report = await reportsCollection.findOne({ _id: reportId });
        if (report) {
          return {
            report: this.normalizeReport(report),
            resolvedFrom: 'partner',
            source: partner.name
          };
        }
      }
    }

    // Level 3: Use system default
    return this.getDefaultReport('event');
  }

  /**
   * WHAT: Resolve report for given partner
   * WHY: Partners can have custom reports or use default
   * HOW: Check partner.reportId → default
   * 
   * @param partner - Partner reference or ID
   * @returns Resolved report with metadata
   */
  async resolveForPartner(
    partner: PartnerReference | ObjectId | string
  ): Promise<ResolvedReport> {
    const reportsCollection = this.db.collection('reports');
    const partnersCollection = this.db.collection('partners');

    // If string/ObjectId provided, fetch partner
    let partnerDoc: PartnerReference;
    if (typeof partner === 'string' || partner instanceof ObjectId) {
      const doc = await partnersCollection.findOne({ 
        _id: typeof partner === 'string' ? new ObjectId(partner) : partner 
      });
      if (!doc) {
        throw new Error(`Partner not found: ${partner}`);
      }
      partnerDoc = doc as PartnerReference;
    } else {
      partnerDoc = partner;
    }

    // Level 1: Check partner-specific report
    if (partnerDoc.reportId) {
      const reportId = typeof partnerDoc.reportId === 'string'
        ? new ObjectId(partnerDoc.reportId)
        : partnerDoc.reportId;

      const report = await reportsCollection.findOne({ _id: reportId });
      if (report) {
        return {
          report: this.normalizeReport(report),
          resolvedFrom: 'partner',
          source: partnerDoc.name
        };
      }
    }

    // Level 2: Use system default
    return this.getDefaultReport('partner');
  }

  /**
   * WHAT: Get system default report
   * WHY: Fallback when no custom report assigned
   * HOW: Query for isDefault=true with matching type
   * 
   * @param type - Report type to get default for
   * @returns Resolved default report
   */
  async getDefaultReport(type: 'event' | 'partner'): Promise<ResolvedReport> {
    const reportsCollection = this.db.collection('reports');

    const defaultReport = await reportsCollection.findOne({
      type,
      isDefault: true
    });

    if (!defaultReport) {
      throw new Error(`No default ${type} report found in database`);
    }

    return {
      report: this.normalizeReport(defaultReport),
      resolvedFrom: 'default',
      source: 'system-default'
    };
  }

  /**
   * WHAT: Get report by ID directly
   * WHY: Admin pages need to load specific reports
   * HOW: Direct database query
   * 
   * @param reportId - Report ID to fetch
   * @returns Report or null
   */
  async getReportById(reportId: ObjectId | string): Promise<Report | null> {
    const reportsCollection = this.db.collection('reports');

    const id = typeof reportId === 'string' ? new ObjectId(reportId) : reportId;
    const report = await reportsCollection.findOne({ _id: id });

    return report ? this.normalizeReport(report) : null;
  }

  /**
   * WHAT: List all reports
   * WHY: Admin UI needs to display all available reports
   * HOW: Query all reports, optionally filter by type
   * 
   * @param type - Optional type filter
   * @returns Array of reports
   */
  async listReports(type?: 'event' | 'partner'): Promise<Report[]> {
    const reportsCollection = this.db.collection('reports');

    const query = type ? { type } : {};
    const reports = await reportsCollection
      .find(query)
      .sort({ isDefault: -1, name: 1 })
      .toArray();

    return reports.map((r: any) => this.normalizeReport(r));
  }

  /**
   * WHAT: Normalize report from database
   * WHY: Ensure consistent ObjectId string conversion
   * HOW: Convert _id and styleId to strings
   * 
   * @param report - Raw report from database
   * @returns Normalized report
   */
  private normalizeReport(report: any): Report {
    return {
      ...report,
      _id: report._id.toString(),
      styleId: report.styleId ? report.styleId.toString() : undefined
    };
  }
}

/**
 * WHAT: Create resolver instance
 * WHY: Convenient factory function for consistency
 * HOW: Instantiate ReportResolver with database
 * 
 * @param db - MongoDB database instance
 * @returns New ReportResolver instance
 */
export function createReportResolver(db: any): ReportResolver {
  return new ReportResolver(db);
}
