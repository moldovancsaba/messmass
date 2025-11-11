// WHAT: Report Template System Types (v11.0.0)
// WHY: Enable flexible per-partner and per-event report configurations
// HOW: Template hierarchy - Project → Partner → Default

import { ObjectId } from 'mongodb';

/**
 * WHAT: Reference to a data visualization block within a template
 * WHY: Templates compose reusable blocks with custom ordering and overrides
 */
export interface DataBlockReference {
  blockId: ObjectId | string;  // Reference to data_blocks collection
  order: number;                // Display order within template (0-indexed)
  overrides?: {                 // Optional per-template customizations
    showTitle?: boolean;        // Override block's showTitle setting
    customTitle?: string;       // Custom title for this template context
  };
}

/**
 * WHAT: Report template configuration
 * WHY: Store reusable report layouts with style and block references
 * HOW: Templates are assigned to partners/projects or used as system default
 */
export interface ReportTemplate {
  _id?: ObjectId | string;
  name: string;                             // "WUKF Template", "Default Event Report"
  description?: string;                     // Admin-facing description
  type: 'event' | 'partner' | 'global';    // Template scope/purpose
  isDefault: boolean;                       // Global fallback template
  
  // Style Configuration
  styleId?: ObjectId | string;              // Reference to page_styles_enhanced
  
  // Chart/Block Configuration
  dataBlocks: DataBlockReference[];         // Ordered list of blocks to render
  
  // Grid Settings (responsive layout)
  gridSettings: {
    desktopUnits: number;                   // Max columns on desktop (default: 6)
    tabletUnits: number;                    // Max columns on tablet (default: 3)
    mobileUnits: number;                    // Max columns on mobile (default: 2)
  };
  
  // Metadata
  createdBy?: string;                       // User who created template
  createdAt: Date | string;                 // ISO 8601 with milliseconds
  updatedAt: Date | string;                 // ISO 8601 with milliseconds
}

/**
 * WHAT: Lightweight template reference for project/partner documents
 * WHY: Keep main collections lean, avoid embedding full templates
 */
export interface TemplateReference {
  reportTemplateId?: ObjectId | string;     // Optional reference to report_templates
}

/**
 * WHAT: Template resolution result with metadata
 * WHY: API consumers need to know where template came from for debugging
 */
export interface ResolvedTemplate {
  template: ReportTemplate;
  resolvedFrom: 'project' | 'partner' | 'default' | 'hardcoded';
  source?: string;                          // Entity ID/name that provided template
}

/**
 * WHAT: Default grid settings for new templates
 * WHY: Consistent starting point matching current system behavior
 */
export const DEFAULT_GRID_SETTINGS = {
  desktopUnits: 6,
  tabletUnits: 3,
  mobileUnits: 2
};

/**
 * WHAT: Default report template (hardcoded fallback)
 * WHY: System must always have a fallback if database is empty
 */
export const HARDCODED_DEFAULT_TEMPLATE: Omit<ReportTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  name: 'System Default',
  description: 'Hardcoded fallback template (no templates in database)',
  type: 'global',
  isDefault: true,
  dataBlocks: [],
  gridSettings: DEFAULT_GRID_SETTINGS
};

/**
 * WHAT: Type guard for ReportTemplate
 * WHY: Runtime validation for API responses and database documents
 */
export function isReportTemplate(obj: any): obj is ReportTemplate {
  return (
    obj &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    ['event', 'partner', 'global'].includes(obj.type) &&
    typeof obj.isDefault === 'boolean' &&
    Array.isArray(obj.dataBlocks) &&
    obj.gridSettings &&
    typeof obj.gridSettings.desktopUnits === 'number'
  );
}

/**
 * WHAT: Type guard for DataBlockReference
 * WHY: Validate block references before using in template
 */
export function isDataBlockReference(obj: any): obj is DataBlockReference {
  return (
    obj &&
    (typeof obj.blockId === 'string' || obj.blockId instanceof ObjectId) &&
    typeof obj.order === 'number'
  );
}

/**
 * WHAT: Create a new template with defaults
 * WHY: Ensure all required fields are populated with sensible defaults
 */
export function createTemplateDefaults(
  partial: Partial<ReportTemplate>
): Omit<ReportTemplate, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    name: partial.name || 'Untitled Template',
    description: partial.description,
    type: partial.type || 'global',
    isDefault: partial.isDefault ?? false,
    styleId: partial.styleId,
    dataBlocks: partial.dataBlocks || [],
    gridSettings: partial.gridSettings || DEFAULT_GRID_SETTINGS,
    createdBy: partial.createdBy
  };
}
