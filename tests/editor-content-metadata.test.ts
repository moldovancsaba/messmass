/**
 * Unit tests for buildContentMetadata (#284).
 * WHAT: Locks the deterministic mapping from a chart's calculation result to the
 *       content-metadata keys consumed by the Layout Grammar fit validators
 *       (elementFitValidator / blockHeightCalculator): barCount, rowCount,
 *       legendItemCount, legendLabels, labels, characterCount, lineCount, aspectRatio.
 * WHY:  These keys drive block-height/fit decisions; the contract must stay stable.
 */

import { buildContentMetadata, type EditorChart } from '@/lib/editorBlockValidator';

function chart(type: EditorChart['type']): EditorChart {
  return { _id: `c-${type}`, chartId: `chart-${type}`, type };
}

function elements(labels: string[]) {
  return labels.map((label, i) => ({
    id: `e${i}`,
    label,
    value: i,
    color: '#000000',
  }));
}

describe('buildContentMetadata', () => {
  it('returns only the chart type when no chartData is provided', () => {
    expect(buildContentMetadata(chart('bar'))).toEqual({ type: 'bar' });
  });

  it('extracts barCount and labels for bar charts', () => {
    const meta = buildContentMetadata(chart('bar'), {
      elements: elements(['A', 'B', 'C', 'D', 'E']),
    } as any);
    expect(meta).toMatchObject({ type: 'bar', barCount: 5, labels: ['A', 'B', 'C', 'D', 'E'] });
  });

  it('extracts legendItemCount and legendLabels for pie charts', () => {
    const meta = buildContentMetadata(chart('pie'), {
      elements: elements(['Yes', 'No']),
    } as any);
    expect(meta).toMatchObject({ type: 'pie', legendItemCount: 2, legendLabels: ['Yes', 'No'] });
  });

  it('extracts rowCount and labels for table charts', () => {
    const meta = buildContentMetadata(chart('table'), {
      elements: elements(['r1', 'r2', 'r3']),
    } as any);
    expect(meta).toMatchObject({ type: 'table', rowCount: 3, labels: ['r1', 'r2', 'r3'] });
  });

  it('computes characterCount and lineCount for text charts from kpiValue', () => {
    const meta = buildContentMetadata(chart('text'), { elements: [], kpiValue: 'line1\nline2' } as any);
    expect(meta).toMatchObject({ type: 'text', characterCount: 11, lineCount: 2 });
  });

  it('treats empty text as zero characters and zero lines', () => {
    const meta = buildContentMetadata(chart('text'), { elements: [], kpiValue: '' } as any);
    expect(meta).toMatchObject({ type: 'text', characterCount: 0, lineCount: 0 });
  });

  it('carries aspectRatio for image charts', () => {
    const meta = buildContentMetadata(chart('image'), { elements: [], aspectRatio: '16:9' } as any);
    expect(meta).toMatchObject({ type: 'image', aspectRatio: '16:9' });
  });

  it('returns only the type for kpi charts (no size-driving metadata)', () => {
    const meta = buildContentMetadata(chart('kpi'), { elements: elements(['x']) } as any);
    expect(meta).toEqual({ type: 'kpi' });
  });
});
