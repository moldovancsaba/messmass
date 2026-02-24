// WHAT: Chart Builder for IMAGE charts - one input per variable from all element formulas
// WHY: Fill all data in Builder; formulas can reference one or more reportImage* (or other) variables
// HOW: Extract variables from all elements, dedupe; reportImage* get ImageUploader, others get text input

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

function isReportImageVar(name: string): boolean {
  return /^reportImage\d*$/i.test(name) || name.startsWith('reportImage');
}

export default function ChartBuilderImage({ chart, stats, onSave }: ChartBuilderImageProps) {
  const variables = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.chartId, chart.elements?.map((e) => e.formula).join('|') ?? '']
  );

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
        <p className="chart-builder-hint">No variables in formula. Add variables (e.g. [reportImage1]) in Visualization Manager.</p>
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
      <div className="chart-builder-inputs">
        {variables.map((key) => (
          <ImageBlock key={key} variableKey={key} stats={stats} onSave={onSave} />
        ))}
      </div>
      <p className="chart-builder-hint">
        Image chart • {variables.length} variable(s). Each value feeds the report.
      </p>
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
  const useUploader = isReportImageVar(variableKey);

  if (useUploader) {
    return (
      <div className="chart-builder-bar-row chart-builder-image-block">
        <label className="chart-builder-bar-label">[{variableKey}]</label>
        <div className="chart-builder-image-upload-wrap">
          <ImageUploader label="" value={value} onChange={(url) => onSave(variableKey, url || '')} maxSizeMB={10} />
        </div>
      </div>
    );
  }

  const [temp, setTemp] = useState(value);
  useEffect(() => setTemp(value), [value]);
  return (
    <div className="chart-builder-bar-row">
      <label className="chart-builder-bar-label" htmlFor={`img-${variableKey}`}>
        [{variableKey}]
      </label>
      <input
        id={`img-${variableKey}`}
        type="text"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => { if (temp !== value) onSave(variableKey, temp); }}
        className="form-input chart-builder-bar-input"
        placeholder="URL or value"
        aria-label={`Value for ${variableKey}`}
      />
    </div>
  );
}
