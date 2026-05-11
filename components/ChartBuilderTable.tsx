// WHAT: Chart Builder for TABLE charts - one input per variable from all element formulas
// WHY: Fill all data in Builder; formulas can reference one or more reportTable* (or other) variables
// HOW: Extract variables from all elements, dedupe; when no formula vars, infer from title/chartId (e.g. "Report Table 1" or report-table-1 → reportTable1) or fallback to reportTable1 so table chart always shows an input

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

/** Infer reportTableN from chart title ("Report Table 1") or chartId ("report-table-1"). */
function inferTableVariableFromChart(chart: { title?: string; chartId?: string }): string | null {
  const title = (chart.title || '').trim();
  const id = (chart.chartId || '').trim();
  const fromTitle = title.match(/\bReport\s+Table\s+(\d+)\b/i);
  if (fromTitle) return `reportTable${fromTitle[1]}`;
  const fromId = id.match(/report-table-(\d+)/i);
  if (fromId) return `reportTable${fromId[1]}`;
  return null;
}

const TABLE_PLACEHOLDER = 'Paste markdown table...\n\n| Col A | Col B |\n|-------|-------|\n| 1     | 2     |';

export default function ChartBuilderTable({ chart, stats, onSave }: ChartBuilderTableProps) {
  const elementsKey = chart.elements?.map((e) => e.formula).join('|') ?? '';
  const variablesFromFormulas = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.elements]
  );
  const variables = useMemo(() => {
    if (variablesFromFormulas.length > 0) return variablesFromFormulas;
    const inferred = inferTableVariableFromChart(chart);
    if (inferred) return [inferred];
    return ['reportTable1'];
  }, [variablesFromFormulas, chart]);
  const isFallback = variablesFromFormulas.length === 0 && variables.length === 1 && variables[0] === 'reportTable1';
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
        <div className="chart-builder-card-body">
          <p className="chart-builder-card-id">{chart.chartId}</p>
          <p className="chart-builder-hint">No variables in formula. Add variables (e.g. [reportTable1]) in Report Builder, or use a title like &quot;Report Table 1&quot; / chartId report-table-1 to bind.</p>
        </div>
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
      <div className="chart-builder-card-body">
        <p className="chart-builder-card-id">{chart.chartId}</p>
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
        {isFallback && (
          <p className="chart-builder-hint chart-builder-hint-subtle">
            Using [reportTable1]. To bind to another variable, use title &quot;Report Table 2&quot; or add [reportTable2] in Report Builder.
          </p>
        )}
      </div>
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
    <div className="chart-builder-variable-row chart-builder-text-block">
      <div className="chart-builder-text-block-header">
        <div className="chart-builder-variable-meta">
          {variableKey}
          <span className="chart-builder-registry-name">[{variableKey}]</span>
        </div>
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
