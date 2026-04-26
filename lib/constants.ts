/**
 * Messmass canonical hierarchy collection names.
 * Centralized registry for the organization/entity/activity hierarchy.
 */
export const V3_COLLECTIONS = {
  ORGANIZATIONS: 'v3_organizations',
  ENTITIES: 'v3_entities',
  ACTIVITIES: 'v3_activities',
  METRIC_DEFINITIONS: 'v3_metric_definitions',
  METRIC_VALUES: 'v3_metric_values',
  RELATIONSHIPS: 'v3_relationships',
  PARTICIPANTS: 'v3_participants',
  METRIC_THRESHOLDS: 'v3_metric_thresholds',
  MIGRATION_HISTORY: 'v3_migration_history',
} as const;
