// WHAT: Chart Builder for PIE charts - one input per variable used in any slice's formula
// WHY: Each slice formula can reference multiple variables; we show all variables (deduplicated)
// HOW: Extract variables from every element's formula, deduplicate, show one input per variable

'use client';

import { useState, useEffect, useMemo } from 'react';
import MaterialIcon from './MaterialIcon';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';

interface ChartBuilderPieProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string; label?: string; color?: string }>;
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

export default function ChartBuilderPie({ chart, stats, onSave }: ChartBuilderPieProps) {
  const elements = chart.elements.slice(0, 2);
  const variables = useMemo(
    () => getStatsVariablesFromElements(elements),
    [chart.chartId, elements.map((e) => e.formula).join('|')]
  );

  const [tempValues, setTempValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variables.forEach((key) => {
      const val = stats[key];
      initial[key] = val !== undefined && val !== null ? String(val) : '0';
    });
    return initial;
  });

  useEffect(() => {
    const next: Record<string, string> = {};
    variables.forEach((key) => {
      const val = stats[key];
      next[key] = val !== undefined && val !== null ? String(val) : '0';
    });
    setTempValues((prev) => ({ ...prev, ...next }));
  }, [stats, chart.chartId, variables]);

  const handleBlur = (key: string) => {
    const raw = tempValues[key] ?? '0';
    const num = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
    const current = stats[key];
    const currentNum = typeof current === 'number' ? current : parseFloat(String(current));
    if (Number.isNaN(currentNum) || num !== currentNum) {
      onSave(key, num);
    }
  };

  const total = variables.reduce((sum, key) => sum + (parseFloat(tempValues[key] || '0') || 0), 0);

  if (variables.length === 0) {
    return (
      <div className="chart-builder-pie">
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
          <p className="chart-builder-hint">No variables in pie formulas. Add variables (e.g. [varName]) in Visualization Manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-builder-pie">
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
            <div key={key} className="chart-builder-variable-row">
              <div className="chart-builder-variable-meta">
                {key}
                <span className="chart-builder-registry-name">[{key}]</span>
              </div>
              <input
                id={`pie-${chart.chartId}-${key}`}
                type="number"
                value={tempValues[key] ?? '0'}
                onChange={(e) => setTempValues((prev) => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => handleBlur(key)}
                min="0"
                step="any"
                className="form-input chart-builder-input"
                placeholder="0"
                aria-label={`Value for ${key}`}
              />
            </div>
          ))}
        </div>
        <div className="chart-builder-pie-total chart-builder-total-row">
          <span>Sum of inputs</span>
          <span className="chart-builder-total-value">{total}</span>
        </div>
      </div>
    </div>
  );
}
