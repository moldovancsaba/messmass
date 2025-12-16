# Template System Documentation

## Overview

The MessMass platform uses a hierarchical template system for report visualization. This system allows customization of how data is displayed across different report types (events, partners, global).

## Template Hierarchy

### Template Resolution Order

Reports use the following hierarchy to determine which template to use:

1. **Entity-Specific Template** (highest priority)
   - Project has `reportTemplateId` → Use project's template
   - Partner has `reportTemplateId` → Use partner's template

2. **Partner Template** (via project association)
   - Project's partner has `reportTemplateId` → Use partner's template

3. **Default Template** (fallback)
   - Find template with `isDefault: true` and matching type
   - Event reports → Default event template
   - Partner reports → Default partner template

4. **Hardcoded Fallback** (system emergency)
   - If no database templates found → Use hardcoded template

### Template Types

- **`event`** - Used by individual event reports
- **`partner`** - Used by partner aggregate reports  
- **`global`** - System-wide default templates

## Visualization Admin System

### Location
`/admin/visualization` - Template editor interface

### Key Features

1. **Template Selector**
   - Dropdown shows all available templates
   - Clear labeling indicates template usage:
     - 🎯 = Currently used by partner reports
     - ⭐ = Default template
     - Partner-Specific Template = Custom partner template

2. **Template Editing**
   - Add/remove/reorder data visualization blocks
   - Configure charts within each block
   - Set responsive grid settings
   - Preview charts with sample data

3. **Data Block Management**
   - Each template contains ordered data blocks
   - Each block contains multiple charts
   - Charts have configurable width and order
   - Blocks can be active/inactive

## Template Structure

```typescript
interface ReportTemplate {
  _id: string;
  name: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  dataBlocks: Array<{
    blockId: string;
    order: number;
  }>;
  gridSettings: {
    desktopUnits: number;
    tabletUnits: number; 
    mobileUnits: number;
  };
}
```

## Data Block Structure

```typescript
interface DataVisualizationBlock {
  _id: string;
  name: string;
  isActive: boolean;
  showTitle: boolean;
  order: number;
  charts: Array<{
    chartId: string;
    width: number;
    order: number;
  }>;
}
```

## Common Issues and Solutions

### Issue: Template Dropdown Not Working
**Symptoms**: Cannot select templates from dropdown
**Cause**: Race condition in template loading or authentication errors
**Solution**: Fixed in v11.29.0 - proper sequential loading and error handling

### Issue: Report Shows Different Content Than Template Editor
**Symptoms**: Editing template doesn't affect report display
**Causes**:
1. Report using different template than expected
2. Some data blocks are inactive (`isActive: false`)
3. Template resolution hierarchy not working as expected

**Solution**: 
1. Check browser console for template resolution logs
2. Verify which template the report actually uses
3. Check data block active status in template editor

### Issue: Empty Templates
**Symptoms**: Template selected but no blocks show for editing
**Cause**: Template has no data blocks configured
**Solution**: Add data blocks to template or copy from working template

## API Endpoints

### Template Management
- `GET /api/report-templates` - List all templates
- `POST /api/report-templates` - Create new template
- `PUT /api/report-templates?templateId=X` - Update template
- `DELETE /api/report-templates?templateId=X` - Delete template

### Template Resolution
- `GET /api/report-config/{identifier}?type=partner` - Resolve template for partner
- `GET /api/report-config/{identifier}?type=project` - Resolve template for project

### Data Blocks
- `GET /api/data-blocks` - List all data blocks
- `POST /api/data-blocks` - Create new data block
- `PUT /api/data-blocks` - Update data block
- `DELETE /api/data-blocks?id=X` - Delete data block

## Best Practices

### Template Creation
1. **Start with existing template** - Copy from working template rather than creating from scratch
2. **Use descriptive names** - Include entity type and purpose
3. **Set appropriate defaults** - Mark primary templates as default
4. **Test thoroughly** - Verify template works in actual reports

### Data Block Management
1. **Keep blocks focused** - Each block should have a clear purpose
2. **Use consistent naming** - Follow naming conventions
3. **Set proper order** - Order affects display sequence
4. **Mark inactive blocks** - Use `isActive: false` to hide without deleting

### Chart Configuration
1. **Use appropriate widths** - Consider responsive design
2. **Test on all devices** - Verify mobile/tablet display
3. **Group related charts** - Put similar charts in same block
4. **Use meaningful titles** - Help users understand chart purpose

## Debugging

### Template Resolution
Check browser console for logs:
```
✅ Loaded template: [NAME] (resolved from: [SOURCE])
✅ Template ID: [ID]
✅ Template data blocks: [COUNT]
```

### Data Block Loading
Check console for block details:
```
📊 Block details:
  Block 1: Overview (3 charts) - Active: true
  Block 2: Hidden Block (1 chart) - Active: false
```

### Common Debug Commands
```javascript
// Check current template in visualization admin
console.log('Selected template:', selectedTemplateId);

// Check loaded data blocks
console.log('Data blocks:', dataBlocks);

// Check template configuration
console.log('Template config:', templates.find(t => t._id === selectedTemplateId));
```

## Migration Notes

### v11.29.0 Changes
- Fixed template dropdown race conditions
- Added proper authentication error handling
- Enhanced template resolution for partner reports
- Added comprehensive debugging
- Improved template labeling and user experience

### Breaking Changes
- Partner reports now use proper template hierarchy instead of forced default
- Template resolution may return different templates than before
- Some templates may need data block reconfiguration

## Support

For template system issues:
1. Check browser console for error messages
2. Verify template resolution logs
3. Test with known working templates (AS Roma templates)
4. Check data block active status
5. Verify API endpoint responses

## Related Documentation
- `PARTNER_TEMPLATE_CONNECTION_SOLUTION.md` - Specific partner template fixes
- `TEMPLATE_DROPDOWN_FIX_SUMMARY.md` - Dropdown issue resolution
- `API_REFERENCE.md` - Complete API documentation