import connectV3 from '@/lib/mongoose-v3';
import V3Entity from '@/lib/models/v3/Entity';
import V3MetricValue from '@/lib/models/v3/MetricValue';

/**
 * V3ReportingResolver
 * 
 * Logic to aggregate metrics across an entity hierarchy.
 */
export class V3ReportingResolver {
  
  /**
   * getDescendantIds
   * Recursively finds all children, grandchildren, etc. of an entity.
   */
  private static async getDescendantIds(entityId: string): Promise<string[]> {
    const descendants: string[] = [entityId];
    
    // Breadth-first search for children
    let toProcess = [entityId];
    while (toProcess.length > 0) {
      const children = await V3Entity.find({ 
        parentEntityId: { $in: toProcess } 
      }).select('_id').lean();
      
      const childIds = children.map(c => c._id.toString());
      if (childIds.length === 0) break;
      
      descendants.push(...childIds);
      toProcess = childIds;
    }
    
    return Array.from(new Set(descendants));
  }

  /**
   * aggregateMetric
   * Sums a specific metric across an entity (and its descendants) OR an entire organization.
   */
  static async aggregateMetric(
    organizationId: string, 
    entityId: string | null, 
    metricKey: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ) {
    await connectV3();
    
    let entityIds: string[] | null = null;
    if (entityId) {
      entityIds = await this.getDescendantIds(entityId);
    }

    const match: any = {
      organizationId,
      metricKey,
    };

    if (entityIds) {
      match.entityId = { $in: entityIds };
    }

    if (options.startDate || options.endDate) {
      match.timestamp = {};
      if (options.startDate) match.timestamp.$gte = options.startDate;
      if (options.endDate) match.timestamp.$lte = options.endDate;
    }

    const result = await V3MetricValue.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$value" }, count: { $sum: 1 } } }
    ]);

    return {
      entityId,
      metricKey,
      descendantCount: entityIds ? entityIds.length - 1 : 0,
      total: result[0]?.total || 0,
      count: result[0]?.count || 0
    };
  }
}
