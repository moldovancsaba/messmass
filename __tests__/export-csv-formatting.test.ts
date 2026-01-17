// __tests__/export-csv-formatting.test.ts
// WHAT: Regression tests for A-R-15 - CSV export formatting alignment
// WHY: Ensure CSV values match rendered report formatting
// HOW: Test formatting application for KPI, BAR, and PIE charts

import { exportReportToCSV } from '@/lib/export/csv';
import type { ChartResult } from '@/lib/report-calculator';
import type { ProjectStats } from '@/lib/report-calculator';

// Mock document.createElement and URL.createObjectURL for CSV download
const mockLink = {
  href: '',
  download: '',
  style: { visibility: '' },
  click: jest.fn(),
  setAttribute: jest.fn()
};

global.document.createElement = jest.fn(() => mockLink as any);
global.document.body.appendChild = jest.fn();
global.document.body.removeChild = jest.fn();
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn() as any;

describe('A-R-15: CSV Export Formatting Alignment', () => {
  const mockProject = {
    eventName: 'Test Event',
    eventDate: '2026-01-13',
    _id: 'test-id'
  };

  const mockStats: ProjectStats = {
    female: 100,
    male: 150
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('KPI Chart Formatting', () => {
    it('should format KPI value with currency prefix and 2 decimals', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['kpi-1', {
          chartId: 'kpi-1',
          type: 'kpi',
          title: 'Total Revenue',
          kpiValue: 1234.56,
          formatting: {
            rounded: false,
            prefix: '€',
            suffix: ''
          }
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('€1234.56');
      expect(csvContent).not.toContain('1234.56'); // Should be formatted, not raw
    });

    it('should format KPI value with percentage suffix and 0 decimals', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['kpi-1', {
          chartId: 'kpi-1',
          type: 'kpi',
          title: 'Engagement Rate',
          kpiValue: 50,
          formatting: {
            rounded: true,
            prefix: '',
            suffix: '%'
          }
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('50%');
      expect(csvContent).not.toContain(',50,'); // Should be formatted, not raw
    });

    it('should format KPI value with rounded flag (0 decimals)', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['kpi-1', {
          chartId: 'kpi-1',
          type: 'kpi',
          title: 'Total Count',
          kpiValue: 1234.56,
          formatting: {
            rounded: true,
            prefix: '',
            suffix: ''
          }
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('1235'); // Rounded to whole number
      expect(csvContent).not.toContain('1234.56'); // Should be rounded
    });

    it('should format KPI value with legacy decimals field', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['kpi-1', {
          chartId: 'kpi-1',
          type: 'kpi',
          title: 'Average Value',
          kpiValue: 1234.567,
          formatting: {
            decimals: 1
          } as any
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('1234.6'); // 1 decimal place
    });

    it('should preserve NA values in KPI charts', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['kpi-1', {
          chartId: 'kpi-1',
          type: 'kpi',
          title: 'Missing Data',
          kpiValue: 'NA',
          formatting: {
            rounded: false,
            prefix: '€',
            suffix: ''
          }
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('NA');
      expect(csvContent).not.toContain('€NA'); // Should not add prefix to NA
    });

    it('should handle KPI charts without formatting (defaults)', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['kpi-1', {
          chartId: 'kpi-1',
          type: 'kpi',
          title: 'Unformatted Value',
          kpiValue: 1234.56
          // No formatting property
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('1235'); // Default: 0 decimals (rounded)
    });
  });

  describe('BAR Chart Formatting', () => {
    it('should format BAR element values with percentage suffix', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['bar-1', {
          chartId: 'bar-1',
          type: 'bar',
          title: 'Demographics',
          formatting: {
            rounded: true,
            prefix: '',
            suffix: '%'
          },
          elements: [
            { label: 'Female', value: 40 },
            { label: 'Male', value: 60 }
          ]
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('40%');
      expect(csvContent).toContain('60%');
      expect(csvContent).not.toContain(',40,'); // Should be formatted
      expect(csvContent).not.toContain(',60,'); // Should be formatted
    });

    it('should format BAR element values with currency prefix and 2 decimals', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['bar-1', {
          chartId: 'bar-1',
          type: 'bar',
          title: 'Revenue by Category',
          formatting: {
            rounded: false,
            prefix: '€',
            suffix: ''
          },
          elements: [
            { label: 'Category A', value: 1234.56 },
            { label: 'Category B', value: 2345.67 }
          ]
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('€1234.56');
      expect(csvContent).toContain('€2345.67');
    });

    it('should preserve NA values in BAR elements', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['bar-1', {
          chartId: 'bar-1',
          type: 'bar',
          title: 'Data with Missing',
          formatting: {
            rounded: false,
            prefix: '',
            suffix: '%'
          },
          elements: [
            { label: 'Valid', value: 50 },
            { label: 'Missing', value: 'NA' }
          ]
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('50%');
      expect(csvContent).toContain('NA');
      expect(csvContent).not.toContain('NA%'); // Should not add suffix to NA
    });
  });

  describe('PIE Chart Formatting', () => {
    it('should format PIE element values with percentage suffix', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['pie-1', {
          chartId: 'pie-1',
          type: 'pie',
          title: 'Distribution',
          formatting: {
            rounded: true,
            prefix: '',
            suffix: '%'
          },
          elements: [
            { label: 'Segment A', value: 30 },
            { label: 'Segment B', value: 70 }
          ]
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('30%');
      expect(csvContent).toContain('70%');
    });

    it('should format PIE element values with 2 decimals when rounded=false', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['pie-1', {
          chartId: 'pie-1',
          type: 'pie',
          title: 'Precise Distribution',
          formatting: {
            rounded: false,
            prefix: '',
            suffix: '%'
          },
          elements: [
            { label: 'Segment A', value: 33.333 },
            { label: 'Segment B', value: 66.667 }
          ]
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('33.33%');
      expect(csvContent).toContain('66.67%');
    });
  });

  describe('Raw Values Preserved', () => {
    it('should preserve raw values in Clicker Data section', async () => {
      const chartResults = new Map<string, ChartResult>();

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      // Clicker data should remain raw (no formatting)
      expect(csvContent).toContain('Clicker Data,female,100');
      expect(csvContent).toContain('Clicker Data,male,150');
      // Should not have formatting applied
      expect(csvContent).not.toContain('Clicker Data,female,"100%"');
    });

    it('should preserve raw values in Metadata section', async () => {
      const chartResults = new Map<string, ChartResult>();

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      // Metadata should remain as-is
      expect(csvContent).toContain('Metadata,Event Name,"Test Event"');
      expect(csvContent).toContain('Metadata,Event Date,2026-01-13');
    });
  });

  describe('String Values', () => {
    it('should preserve string values without formatting', async () => {
      const chartResults = new Map<string, ChartResult>([
        ['text-1', {
          chartId: 'text-1',
          type: 'text',
          title: 'Text Chart',
          kpiValue: 'This is text content',
          formatting: {
            rounded: false,
            prefix: '€',
            suffix: ''
          }
        }]
      ]);

      await exportReportToCSV(mockProject, mockStats, chartResults);

      const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      expect(csvContent).toContain('This is text content');
      expect(csvContent).not.toContain('€This is text content'); // Should not format strings
    });
  });
});
