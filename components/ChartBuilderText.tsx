// WHAT: Chart Builder for TEXT charts - one input per variable from all element formulas
// WHY: Fill all data in Builder; formulas can reference one or more reportText* (or other) variables
// HOW: Extract variables from all elements, dedupe, one textarea per variable with [varName] label

'use client';

import { useState, useEffect, useMemo } from 'react';
import TextareaField from './TextareaField';
import MaterialIcon from './MaterialIcon';
import { parseMarkdown, isMarkdown } from '@/lib/markdownUtils';
import { sanitizeHTML } from '@/lib/sanitize';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';

interface ChartBuilderTextProps {
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

export default function ChartBuilderText({ chart, stats, onSave }: ChartBuilderTextProps) {
  const elementsKey = chart.elements?.map((e) => e.formula).join('|') ?? '';
  const variables = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.elements]
  );

  const [previewKey, setPreviewKey] = useState<string | null>(null);

  if (variables.length === 0) {
    return (
      <div className="chart-builder-text">
        <div className="chart-builder-header">
          <div className="chart-builder-title-row">
            {chart.icon && (
              <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
            )}
            <h3 className="chart-builder-title">{chart.title}</h3>
          </div>
        </div>
        <div className="chart-builder-card-body">
          <p className="chart-builder-card-id">{chart.chartId}</p>
          <p className="chart-builder-hint">No variables in formula. Add variables (e.g. [reportText1]) in Visualization Manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-builder-text">
      <div className="chart-builder-header">
        <div className="chart-builder-title-row">
          {chart.icon && (
            <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
          )}
          <h3 className="chart-builder-title">{chart.title}</h3>
        </div>
      </div>
      <div className="chart-builder-card-body">
        <p className="chart-builder-card-id">{chart.chartId}</p>
        <div className="chart-builder-inputs">
          {variables.map((key) => (
            <TextBlock key={key} variableKey={key} stats={stats} onSave={onSave} onPreviewToggle={(k) => setPreviewKey((p) => (p === k ? null : k))} isPreview={previewKey === key} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TextBlock({
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
  const hasMarkdown = isMarkdown(value);
  return (
    <div className="chart-builder-variable-row chart-builder-text-block">
      <div className="chart-builder-text-block-header">
        <div className="chart-builder-variable-meta">
          {variableKey}
          <span className="chart-builder-registry-name">[{variableKey}]</span>
        </div>
        {value && hasMarkdown && (
          <button type="button" onClick={() => onPreviewToggle(variableKey)} className="chart-builder-toggle" title={isPreview ? 'Edit' : 'Preview'}>
            {isPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        )}
      </div>
      {isPreview ? (
        <div className="chart-builder-preview chart-builder-preview-inline">
          <div className="chart-builder-preview-content" dangerouslySetInnerHTML={{ __html: sanitizeHTML(parseMarkdown(value)) }} />
        </div>
      ) : (
        <TextareaField label="" value={value} onSave={(text) => onSave(variableKey, text)} rows={6} placeholder="Enter text... (markdown supported)" />
      )}
    </div>
  );
}
