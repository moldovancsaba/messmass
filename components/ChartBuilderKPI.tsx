// WHAT: Chart Builder for KPI charts - one or more numeric inputs from formula variables
// WHY: Allow inline editing of KPI values in Builder mode; formulas like [a]+[b]+[c] need one input per variable
// HOW: Extract variables from formula; single variable = one input, multiple = one input per variable with label

'use client';

import { useState, useEffect, useMemo } from 'react';
import MaterialIcon from './MaterialIcon';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';

interface ChartBuilderKPIProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string; label?: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

// WHAT: Stats-only variable names from formula (skip PARAM:, MEDIA:, etc.)
function getStatsVariablesFromFormula(formula: string): string[] {
  const vars = extractVariablesFromFormula(formula || '');
  return vars.filter((v) => !v.includes(':'));
}

export default function ChartBuilderKPI({ chart, stats, onSave }: ChartBuilderKPIProps) {
  const formula = chart.elements[0]?.formula || '';
  const variables = useMemo(
    () => getStatsVariablesFromFormula(formula),
    [formula]
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
  }, [stats, variables]);

  const handleBlur = (key: string) => {
    const raw = tempValues[key] ?? '0';
    const num = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
    const current = stats[key];
    const currentNum = typeof current === 'number' ? current : parseFloat(String(current));
    if (Number.isNaN(currentNum) || num !== currentNum) {
      onSave(key, num);
    }
  };

  return (
    <div className="chart-builder-kpi">
      <div className="chart-builder-header">
        <div className="chart-builder-title-row">
          {chart.icon && (
            <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
          )}
          <h3 className="chart-builder-title">{chart.title}</h3>
        </div>
      </div>

      {variables.length === 0 ? (
        <p className="chart-builder-hint">No variables in formula (e.g. [varName]). Add variables in Visualization Manager.</p>
      ) : variables.length === 1 ? (
        <>
          <div className="chart-builder-field">
            <label className="chart-builder-label" htmlFor={`kpi-${chart.chartId}-single`}>
              {chart.elements[0]?.label || `[${variables[0]}]`}
            </label>
            <input
              id={`kpi-${chart.chartId}-single`}
              type="number"
              value={tempValues[variables[0]] ?? '0'}
              onChange={(e) => setTempValues((prev) => ({ ...prev, [variables[0]]: e.target.value }))}
              onBlur={() => handleBlur(variables[0])}
              min="0"
              className="form-input chart-builder-input"
              placeholder="0"
              aria-label={`Value for ${variables[0]}`}
            />
          </div>
          <p className="chart-builder-hint">Variable: [{variables[0]}]</p>
        </>
      ) : (
        <>
          <div className="chart-builder-inputs">
            {variables.map((key) => (
              <div key={key} className="chart-builder-bar-row">
                <label className="chart-builder-bar-label" htmlFor={`kpi-${chart.chartId}-${key}`}>
                  [{key}]
                </label>
                <input
                  id={`kpi-${chart.chartId}-${key}`}
                  type="number"
                  value={tempValues[key] ?? '0'}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  onBlur={() => handleBlur(key)}
                  min="0"
                  step="any"
                  className="form-input chart-builder-bar-input"
                  placeholder="0"
                  aria-label={`Value for ${key}`}
                />
              </div>
            ))}
          </div>
          <p className="chart-builder-hint">
            Formula: {formula}. Each value feeds the total.
          </p>
        </>
      )}
    </div>
  );
}
