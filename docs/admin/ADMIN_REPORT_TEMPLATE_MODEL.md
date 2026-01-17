# Admin Report Template Model and Selection Rules
Status: Active
Version: 1.0.0
Created: 2026-01-16T11:09:32.000Z
Last Updated: 2026-01-16T11:09:32.000Z
Owner: Admin (Katja)
Audience: Admin operators, developers

1 Purpose
- Document the Admin-side report template data model used by the Visualization Editor.
- Record the selection rules for resolving templates for event and partner reports.

2 Canonical Sources (Code)
- app/admin/visualization/page.tsx (template editor UI + model mapping)
- lib/reportTemplateTypes.ts (shared ReportTemplate types)
- app/api/report-templates/route.ts (CRUD API)
- app/api/data-blocks/route.ts (data block CRUD)
- app/api/report-config/[identifier]/route.ts (runtime template resolution)
- app/admin/events/page.tsx (event template assignment)
- app/admin/partners/page.tsx (partner template assignment)
- app/admin/project-partners/page.tsx (template inheritance note)

3 Data Model (Admin View)

3.1 ReportTemplate (report_templates collection)
Fields used by the Admin Visualization Editor:
- _id: string (Mongo ObjectId as string)
- name: string
- description?: string
- type: 'event' | 'partner' | 'global'
- isDefault: boolean
- dataBlocks: Array<{ blockId: string; order: number }>
- gridSettings: { desktopUnits: number; tabletUnits: number; mobileUnits: number }
- heroSettings?: HeroBlockSettings
- alignmentSettings?: BlockAlignmentSettings

Notes:
- The Admin UI does not currently set blockLayoutMode, fontSyncSettings, or styleId.
- gridSettings defaults to 4/2/1 when templates are created in the Visualization Editor.
- isDefault is enforced server-side as unique (existing default is cleared when a new default is created).

3.2 DataVisualizationBlock (data_blocks collection)
Fields used by the Admin Visualization Editor:
- _id: string
- name: string
- charts: Array<BlockChart>
- order: number
- isActive: boolean
- showTitle?: boolean

BlockChart fields (stored in data_blocks):
- chartId: string (references chart_configurations)
- order: number (horizontal order inside the block)
- width: number (legacy; kept in sync with unitSize)
- unitSize?: 1 | 2 (LayoutV2 unit allocation)
- aspectRatio?: '1:1' | '2:1' | '16:9' | '9:16'

Notes:
- width is still persisted for legacy compatibility but should equal unitSize.
- unitSize + aspectRatio are normalized on load and saved explicitly by the editor.

3.3 Chart Configuration (chart_configurations collection)
- chartId: string
- type: 'kpi' | 'pie' | 'bar' | 'text' | 'table' | 'image'
- aspectRatio?: '1:1' | '16:9' | '9:16' (used for default LayoutV2 settings)

4 Admin Visualization Editor Mapping

4.1 Load flow
- GET /api/report-templates?includeAssociations=false
- GET /api/data-blocks (filter by template dataBlocks blockId)
- GET /api/chart-configs (available charts list)
- GET /api/chart-config/public (preview configuration)

4.2 Save flow
- PUT /api/data-blocks (when block content changes)
- PUT /api/report-templates?templateId=... (save dataBlocks order + gridSettings + heroSettings + alignmentSettings)

4.3 Template copy behavior
- Template copy duplicates data_blocks to avoid shared state between templates.

5 Template Assignment Points (Admin UI)

5.1 Event (project) templates
- Field: projects.reportTemplateId
- UI: app/admin/events/page.tsx (Create/Edit Event)
- Hint shown in UI: if not set, event uses partner template or default template.

5.2 Partner templates
- Field: partners.reportTemplateId
- UI: app/admin/partners/page.tsx (Create/Edit Partner)
- Hint shown in UI: all events from this partner use this template by default.

5.3 Template inheritance note
- UI: app/admin/project-partners/page.tsx
- Explicit hierarchy shown in UI: Project -> Partner -> Default -> Hardcoded.

6 Selection Rules (Runtime Resolution)

Canonical logic: app/api/report-config/[identifier]/route.ts

6.1 Event report (entityType: project)
1) Project-specific template (projects.reportTemplateId)
2) Partner template via partner1 (partners.reportTemplateId) - partner2 is not used for template resolution
3) Default template (report_templates where isDefault = true)
4) Hardcoded fallback (HARDCODED_DEFAULT_TEMPLATE)

6.2 Partner report (entityType: partner)
1) Partner-specific template (partners.reportTemplateId)
2) Default template (report_templates where isDefault = true)
3) Hardcoded fallback

6.3 Special case
- identifier == '__default_event__' forces the default event template (type: 'event', isDefault: true).

6.4 Type filtering
- Default template lookup does not filter by template type.
- Admin assignment UI allows any template type to be selected for events/partners.

7 Selection Rule Summary (Admin-facing)
- Event template overrides partner template.
- Partner template overrides global default.
- If no database default exists, the system uses the hardcoded fallback.

8 References
- docs/admin/ADMIN_LAYOUT_V2_SCHEMA.md
- docs/admin/ADMIN_LAYOUT_V2_TEMPLATE_BUILDER.md
