// WHAT: Chart Builder for IMAGE charts - one input per variable from all element formulas
// WHY: Fill all data in Builder; formulas can reference one or more reportImage* (or other) variables
// HOW: Extract variables from all elements, dedupe; reportImage* get ImageUploader + replace/remove. When no formula vars, infer from title (e.g. "Report Image 3" → reportImage3) so we still show image and allow replace/remove.

'use client';

import { useState, useEffect, useMemo } from 'react';
import ImageUploader from './ImageUploader';
import MaterialIcon from './MaterialIcon';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';

interface ChartBuilderImageProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string; imageUrl?: string }>;
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

/** Infer reportImageN from chart title ("Report Image 3") or chartId ("report-image-3"). */
function inferImageVariableFromChart(chart: { title?: string; chartId?: string }): string | null {
  const title = (chart.title || '').trim();
  const id = (chart.chartId || '').trim();
  const fromTitle = title.match(/\bReport\s+Image\s+(\d+)\b/i);
  if (fromTitle) return `reportImage${fromTitle[1]}`;
  const fromId = id.match(/report-image-(\d+)/i);
  if (fromId) return `reportImage${fromId[1]}`;
  return null;
}

function isReportImageVar(name: string): boolean {
  return /^reportImage\d*$/i.test(name) || name.startsWith('reportImage');
}

export default function ChartBuilderImage({ chart, stats, onSave }: ChartBuilderImageProps) {
  const elementsKey = chart.elements?.map((e) => e.formula).join('|') ?? '';
  const variablesFromFormulas = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.elements]
  );

  const variables = useMemo(() => {
    if (variablesFromFormulas.length > 0) return variablesFromFormulas;
    const inferred = inferImageVariableFromChart(chart);
    return inferred ? [inferred] : [];
  }, [variablesFromFormulas, chart]);

  if (variables.length === 0) {
    return (
      <div className="chart-builder-image">
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
          <p className="chart-builder-hint">No variables in formula. Add variables (e.g. [reportImage1]) in Report Builder, or use a title like &quot;Report Image 3&quot; to bind to [reportImage3].</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-builder-image">
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
            <ImageBlock key={key} variableKey={key} stats={stats} onSave={onSave} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageBlock({
  variableKey,
  stats,
  onSave,
}: {
  variableKey: string;
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}) {
  const value = (stats[variableKey] ?? '') as string;
  const [temp, setTemp] = useState(value);
  useEffect(() => setTemp(value), [value]);
  const useUploader = isReportImageVar(variableKey);

  if (useUploader) {
    return (
      <div className="chart-builder-variable-row chart-builder-image-block">
        <div className="chart-builder-variable-meta">
          {variableKey}
          <span className="chart-builder-registry-name">[{variableKey}]</span>
        </div>
        <div className="chart-builder-image-upload-wrap">
          <ImageUploader label="" value={value} onChange={(url) => onSave(variableKey, url || '')} maxSizeMB={10} />
          {value && (
            <button
              type="button"
              className="btn btn-small btn-secondary chart-builder-image-remove"
              onClick={() => onSave(variableKey, '')}
              aria-label={`Remove image for ${variableKey}`}
            >
              Remove image
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chart-builder-variable-row">
      <div className="chart-builder-variable-meta">
        {variableKey}
        <span className="chart-builder-registry-name">[{variableKey}]</span>
      </div>
      <input
        id={`img-${variableKey}`}
        type="text"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => { if (temp !== value) onSave(variableKey, temp); }}
        className="form-input chart-builder-input"
        placeholder="URL or value"
        aria-label={`Value for ${variableKey}`}
      />
    </div>
  );
}
