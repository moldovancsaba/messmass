// __tests__/template-compatibility.test.ts
// WHAT: Regression tests for A-R-12 - Template compatibility validation
// WHY: Ensure templates are validated for compatibility with available data
// HOW: Test all compatibility scenarios identified in investigation

import { validateTemplateCompatibility, formatCompatibilityIssue } from '@/lib/templateCompatibilityValidator';
import type { ReportTemplate } from '@/lib/reportTemplateTypes';
import type { Chart, ProjectStats } from '@/lib/report-calculator';

describe('A-R-12: Template Compatibility Validation', () => {
  const mockStats: ProjectStats = {
    female: 100,
    male: 150,
    indoor: 50,
    outdoor: 30
  };

  const mockTemplate: ReportTemplate = {
    _id: 'template-1',
    name: 'Test Template',
    type: 'event',
    isDefault: false,
    dataBlocks: [],
    gridSettings: {
      desktopUnits: 3,
      tabletUnits: 2,
      mobileUnits: 1
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('Missing Chart Config Validation', () => {
    it('should detect missing chart configurations', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female]',
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1', 'chart-2']; // chart-2 is missing

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'MISSING_CHART_CONFIG')).toBe(true);
      expect(result.issues.some(i => i.context?.chartId === 'chart-2')).toBe(true);
      expect(result.summary.missingCharts).toBe(1);
    });

    it('should pass when all chart configs exist', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female]',
          isActive: true,
          order: 1
        },
        {
          chartId: 'chart-2',
          title: 'Chart 2',
          type: 'kpi',
          formula: '[male]',
          isActive: true,
          order: 2
        }
      ];

      const blockChartIds = ['chart-1', 'chart-2'];

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.issues.filter(i => i.type === 'MISSING_CHART_CONFIG').length).toBe(0);
    });
  });

  describe('Missing Variable Validation', () => {
    it('should detect missing variables in chart formulas', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[nonExistentVar]', // Variable not in stats
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'MISSING_VARIABLE')).toBe(true);
      expect(result.issues.some(i => i.context?.variableName === 'nonExistentVar')).toBe(true);
      expect(result.summary.missingVariables).toBeGreaterThan(0);
    });

    it('should detect missing variables in element formulas', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'bar',
          formula: '',
          isActive: true,
          order: 1,
          elements: [
            {
              label: 'Element 1',
              formula: '[nonExistentVar]' // Variable not in stats
            }
          ]
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'MISSING_VARIABLE')).toBe(true);
      expect(result.issues.some(i => i.context?.variableName === 'nonExistentVar')).toBe(true);
    });

    it('should pass when all variables exist in stats', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female] + [male]', // Both variables exist
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.issues.filter(i => i.type === 'MISSING_VARIABLE').length).toBe(0);
    });
  });

  describe('Template Type Validation', () => {
    it('should warn when template type does not match entity type', () => {
      const partnerTemplate: ReportTemplate = {
        ...mockTemplate,
        type: 'partner'
      };

      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female]',
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        partnerTemplate,
        charts,
        mockStats,
        'project', // Entity is project, template is partner
        blockChartIds
      );

      expect(result.issues.some(i => i.type === 'TYPE_MISMATCH')).toBe(true);
      expect(result.issues.some(i => i.severity === 'warning')).toBe(true);
      expect(result.summary.typeMismatches).toBe(1);
    });

    it('should not warn for global templates', () => {
      const globalTemplate: ReportTemplate = {
        ...mockTemplate,
        type: 'global'
      };

      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female]',
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        globalTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.issues.filter(i => i.type === 'TYPE_MISMATCH').length).toBe(0);
    });

    it('should not warn when template type matches entity type', () => {
      const eventTemplate: ReportTemplate = {
        ...mockTemplate,
        type: 'event'
      };

      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female]',
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        eventTemplate,
        charts,
        mockStats,
        'project', // Project uses event templates
        blockChartIds
      );

      expect(result.issues.filter(i => i.type === 'TYPE_MISMATCH').length).toBe(0);
    });
  });

  describe('Compatibility Summary', () => {
    it('should calculate correct summary statistics', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[missingVar]', // Missing variable
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1', 'chart-2']; // chart-2 missing

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.summary.totalCharts).toBe(2);
      expect(result.summary.missingCharts).toBe(1);
      expect(result.summary.missingVariables).toBeGreaterThan(0);
    });
  });

  describe('Error Message Formatting', () => {
    it('should format MISSING_CHART_CONFIG error', () => {
      const issue = {
        type: 'MISSING_CHART_CONFIG' as const,
        severity: 'error' as const,
        message: 'Chart configuration not found',
        context: { chartId: 'missing-chart' }
      };

      const message = formatCompatibilityIssue(issue);
      expect(message).toContain('missing-chart');
      expect(message).toContain('not found');
    });

    it('should format MISSING_VARIABLE error', () => {
      const issue = {
        type: 'MISSING_VARIABLE' as const,
        severity: 'error' as const,
        message: 'Variable not found',
        context: { chartId: 'chart-1', variableName: 'missingVar' }
      };

      const message = formatCompatibilityIssue(issue);
      expect(message).toContain('chart-1');
      expect(message).toContain('missingVar');
      expect(message).toContain('requires');
    });

    it('should format TYPE_MISMATCH warning', () => {
      const issue = {
        type: 'TYPE_MISMATCH' as const,
        severity: 'warning' as const,
        message: 'Template type mismatch',
        context: { templateType: 'partner', entityType: 'project' }
      };

      const message = formatCompatibilityIssue(issue);
      expect(message).toBe('Template type mismatch');
    });
  });

  describe('Compatibility Status', () => {
    it('should return compatible=true when no errors (warnings OK)', () => {
      const partnerTemplate: ReportTemplate = {
        ...mockTemplate,
        type: 'partner' // Type mismatch (warning only)
      };

      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[female]', // Valid variable
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        partnerTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      // Compatible because only warnings, no errors
      expect(result.compatible).toBe(true);
      expect(result.issues.filter(i => i.severity === 'error').length).toBe(0);
    });

    it('should return compatible=false when errors exist', () => {
      const charts: Chart[] = [
        {
          chartId: 'chart-1',
          title: 'Chart 1',
          type: 'kpi',
          formula: '[missingVar]', // Missing variable (error)
          isActive: true,
          order: 1
        }
      ];

      const blockChartIds = ['chart-1'];

      const result = validateTemplateCompatibility(
        mockTemplate,
        charts,
        mockStats,
        'project',
        blockChartIds
      );

      expect(result.compatible).toBe(false);
      expect(result.issues.filter(i => i.severity === 'error').length).toBeGreaterThan(0);
    });
  });
});
