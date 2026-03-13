/**
 * V3 Compatibility Adapter
 * 
 * WHAT: Utilities to transform V3 Entity/Activity models to V2 shapes
 * WHY: Support existing UI components without full rewrite (Phase 2)
 */

export interface V2PartnerShape {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
  hashtags: string[];
  categorizedHashtags: Record<string, string[]>;
  stats: Record<string, any>;
}

/**
 * Transforms a V3 Entity (and its metadata) into the V2 Partner shape
 * @param entity - V3 Entity object from lean query
 */
export function mapEntityToV2Partner(entity: any): V2PartnerShape {
  if (!entity) return null as any;

  // Extract from metadata.originalData if available (migrated)
  // Fallback to direct entity properties for new V3-native entities
  const original = entity.metadata?.originalData || {};

  return {
    _id: entity._id.toString(),
    name: entity.name,
    emoji: entity.metadata?.emoji || original.emoji || '🏢',
    logoUrl: entity.metadata?.logoUrl || original.logoUrl,
    hashtags: entity.metadata?.hashtags || original.hashtags || [],
    categorizedHashtags: entity.metadata?.categorizedHashtags || original.categorizedHashtags || {},
    stats: entity.metadata?.stats || original.stats || {},
  };
}

/**
 * Transforms a V3 Activity into a V2 Project shape
 * @param activity - V3 Activity object
 * @param entity - Owning V3 Entity
 */
export function mapActivityToV2Project(activity: any, entity: any) {
  if (!activity || !entity) return null;

  const originalProject = activity.metadata?.originalData || {};

  return {
    _id: activity._id.toString(),
    eventName: activity.name,
    eventDate: activity.startDate || originalProject.eventDate || new Date().toISOString(),
    viewSlug: activity.slug || originalProject.viewSlug,
    hashtags: activity.metadata?.hashtags || originalProject.hashtags || [],
    categorizedHashtags: activity.metadata?.categorizedHashtags || originalProject.categorizedHashtags || {},
    partner1: mapEntityToV2Partner(entity),
    stats: activity.metadata?.stats || originalProject.stats || {},
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}
