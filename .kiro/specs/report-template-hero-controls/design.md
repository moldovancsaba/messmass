# Design Document

## Overview

This design implements fine-grained control over report template HERO block visibility and enhances visual alignment within report blocks. The system extends the existing chart configuration interface at `/admin/visualization` to provide administrators with granular control over which header elements appear in reports, while ensuring consistent visual alignment of elements within individual report blocks.

## Architecture

The enhancement builds upon the existing report template system with the following architectural components:

### Frontend Components
- **Enhanced ChartAlgorithmManager**: Extended with HERO block visibility controls
- **Report Template Editor**: New section for HERO block configuration
- **Report Renderer**: Updated to respect visibility settings and apply alignment styles
- **Block Layout Engine**: CSS Grid/Flexbox system for consistent element alignment

### Backend Components
- **Template Configuration API**: Extended to handle HERO block visibility settings
- **Report Generation Service**: Updated to apply visibility rules during rendering
- **Database Schema**: New fields for HERO block visibility preferences

### Data Flow
1. Administrator configures HERO visibility in template editor
2. Settings saved to template configuration in database
3. Report renderer applies visibility rules and alignment styles
4. End users see customized reports with consistent visual alignment

## Components and Interfaces

### Template Configuration Interface
```typescript
interface HeroBlockSettings {
  showEmoji: boolean;           // Controls emoji visibility (e.g., "🏒")
  showDateInfo: boolean;        // Controls creation/update date visibility
  showExportOptions: boolean;   // Controls export buttons visibility
}

interface TemplateConfiguration {
  // ... existing fields
  heroSettings?: HeroBlockSettings;
}
```

### Report Block Alignment Interface
```typescript
interface BlockAlignmentSettings {
  alignTitles: boolean;         // Align titles within block
  alignDescriptions: boolean;   // Align descriptions within block
  alignCharts: boolean;         // Align chart visualizations within block
  minElementHeight?: number;    // Minimum height for consistent alignment
}
```

### Enhanced Chart Configuration
```typescript
interface ChartConfigFormData {
  // ... existing fields
  heroSettings?: HeroBlockSettings;
  alignmentSettings?: BlockAlignmentSettings;
}
```

## Data Models

### Database Schema Extensions

#### Template Configuration Collection
```javascript
{
  // ... existing template fields
  heroSettings: {
    showEmoji: { type: Boolean, default: true },
    showDateInfo: { type: Boolean, default: true },
    showExportOptions: { type: Boolean, default: true }
  },
  alignmentSettings: {
    alignTitles: { type: Boolean, default: true },
    alignDescriptions: { type: Boolean, default: true },
    alignCharts: { type: Boolean, default: true },
    minElementHeight: { type: Number, default: null }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I identified several areas of redundancy:
- Properties 2.1, 2.2, 2.3 and 4.3 all test element alignment within blocks - these can be combined into one comprehensive alignment property
- Properties 1.2, 1.3, 1.4 and 4.1 all test visibility control application - these can be combined into one visibility property
- Properties 3.2 and 3.3 test save/load round-trip behavior - these can be combined into one persistence property

**Property 1: HERO element visibility control**
*For any* template configuration with HERO visibility settings, when a report is rendered using that template, only the enabled HERO elements should be visible in the report header
**Validates: Requirements 1.2, 1.3, 1.4, 4.1**

**Property 2: Template settings persistence round-trip**
*For any* template configuration with HERO visibility settings, saving the settings and then loading the template should restore the exact same visibility configuration
**Validates: Requirements 3.2, 3.3**

**Property 3: Block element alignment consistency**
*For any* report block containing multiple elements, all titles should be aligned at the same height, all descriptions should be aligned at the same height, and all charts should be aligned at the same height within that block
**Validates: Requirements 2.1, 2.2, 2.3, 4.3**

**Property 4: Template independence**
*For any* set of multiple templates with different HERO visibility settings, changes to one template should not affect the visibility settings of any other template
**Validates: Requirements 3.5**

**Property 5: Layout preservation across output formats**
*For any* report with specific HERO visibility and alignment settings, the same visibility and alignment should be preserved when the report is printed or exported
**Validates: Requirements 4.5**

**Property 6: Real-time preview updates**
*For any* template configuration change in the editor, the report preview should immediately reflect the updated HERO visibility settings without requiring a page refresh
**Validates: Requirements 3.4**

**Property 7: Hidden element layout flow**
*For any* combination of hidden HERO elements, the remaining visible elements should maintain proper spacing and layout flow without gaps or overlaps
**Validates: Requirements 4.2**

## Error Handling

### Validation Rules
- HERO settings must be boolean values (showEmoji, showDateInfo, showExportOptions)
- Alignment settings must be boolean values with optional numeric minElementHeight
- Template configurations must maintain backward compatibility with existing templates
- Invalid settings should default to showing all HERO elements (fail-safe behavior)

### Error Recovery
- Missing HERO settings default to all elements visible
- Invalid alignment settings fall back to browser default layout
- Database connection failures preserve last known template configuration
- Malformed template data triggers validation and correction

### User Feedback
- Real-time validation in template editor
- Clear error messages for invalid configurations
- Preview updates to show immediate effects of changes
- Confirmation dialogs for significant template modifications

## Testing Strategy

### Dual Testing Approach
The system requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples of HERO visibility configurations
- Template editor UI component behavior
- Database persistence operations
- CSS alignment calculations

**Property-Based Tests:**
- Universal properties that should hold across all template configurations
- Random generation of HERO visibility combinations
- Alignment consistency across different block layouts
- Template independence verification

### Property-Based Testing Requirements
- Use Jest with fast-check library for property-based testing
- Configure each property test to run minimum 100 iterations
- Tag each property test with format: **Feature: report-template-hero-controls, Property {number}: {property_text}**
- Each correctness property must be implemented by a single property-based test

### Testing Configuration
```javascript
// Example property test structure
describe('HERO Visibility Control', () => {
  test('Property 1: HERO element visibility control', () => {
    fc.assert(fc.property(
      fc.record({
        showEmoji: fc.boolean(),
        showDateInfo: fc.boolean(), 
        showExportOptions: fc.boolean()
      }),
      (heroSettings) => {
        const report = renderReportWithSettings(heroSettings);
        return verifyOnlyEnabledElementsVisible(report, heroSettings);
      }
    ), { numRuns: 100 });
  });
});
```