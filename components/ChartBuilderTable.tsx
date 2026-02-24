// WHAT: Chart Builder for TABLE charts - one input per variable from all element formulas
// WHY: Fill all data in Builder; formulas can reference one or more reportTable* (or other) variables
// HOW: Extract variables from all elements, dedupe, one textarea per variable with [varName] label

'use client';

import { useState, useMemo } from 'react';
import TextareaField from './TextareaField';
import MaterialIcon from './MaterialIcon';
import { parseTableMarkdown } from '@/lib/tableMarkdownUtils';
import { sanitizeHTML } from '@/lib/sanitize';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';

interface ChartBuilderTableProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

function getStatsVariablesFromElements(elements: Array<{ formula: string }>): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const el of elements) {
    if (!el.formula?.trim()) continue;
    const vars = extractVariablesFromFormula(el.formula);
    for (const v of vars) {
      if (v.includes(':')) continue;
      if (seen.has(v)) continue;
      seen.add(v);
      list.push(v);
    }
  }
  return list;
}

const TABLE_PLACEHOLDER = 'Paste markdown table...\n\n| Col A | Col B |\n|-------|-------|\n| 1     | 2     |';

export default function ChartBuilderTable({ chart, stats, onSave }: ChartBuilderTableProps) {
  const variables = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.chartId, chart.elements?.map((e) => e.formula).join('|') ?? '']
  );
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  if (variables.length === 0) {
    return (
      <div className="chart-builder-table">
        <div className="chart-builder-header">
          <div className="chart-builder-title-row">
            {chart.icon && (
              <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
            )}
            <h3 className="chart-builder-title">{chart.title}</h3>
          </div>
        </div>
        <p className="chart-builder-hint">No variables in formula. Add variables (e.g. [reportTable1]) in Visualization Manager.</p>
      </div>
    );
  }

  return (
    <div className="chart-builder-table">
      <div className="chart-builder-header">
        <div className="chart-builder-title-row">
          {chart.icon && (
            <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
          )}
          <h3 className="chart-builder-title">{chart.title}</h3>
        </div>
      </div>
      <div className="chart-builder-inputs">
        {variables.map((key) => (
          <TableBlock
            key={key}
            variableKey={key}
            stats={stats}
            onSave={onSave}
            onPreviewToggle={(k) => setPreviewKey((p) => (p === k ? null : k))}
            isPreview={previewKey === key}
          />
        ))}
      </div>
      <p className="chart-builder-hint" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
        💡 Use pipes (|) for columns, dashes (---) for header separator.
      </p>
      <p className="chart-builder-hint" style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--mm-gray-500)' }}>
        Table chart • {variables.length} variable(s). Each value feeds the report.
      </p>
    </div>
  );
}

function TableBlock({
  variableKey,
  stats,
  onSave,
  onPreviewToggle,
  isPreview,
}: {
  variableKey: string;
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
  onPreviewToggle: (key: string) => void;
  isPreview: boolean;
}) {
  const value = (stats[variableKey] ?? '') as string;
  return (
    <div className="chart-builder-text-block">
      <div className="chart-builder-text-block-header">
        <label className="chart-builder-bar-label">[{variableKey}]</label>
        {value && (
          <button type="button" onClick={() => onPreviewToggle(variableKey)} className="chart-builder-toggle" title={isPreview ? 'Edit' : 'Preview table'}>
            {isPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        )}
      </div>
      {isPreview ? (
        <div className="chart-builder-preview chart-builder-preview-inline">
          <div className="chart-builder-preview-content" dangerouslySetInnerHTML={{ __html: sanitizeHTML(parseTableMarkdown(value)) }} />
        </div>
      ) : (
        <TextareaField label="" value={value} onSave={(text) => onSave(variableKey, text)} rows={8} placeholder={TABLE_PLACEHOLDER} />
      )}
    </div>
  );
}

