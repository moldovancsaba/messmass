// WHAT: Chart Builder for KPI charts - one or more numeric inputs from formula variables
// WHY: Allow inline editing of KPI values in Builder mode; formulas like [a]+[b]+[c] need one input per variable
// HOW: Extract variables from formula; single variable = one input, multiple = one input per variable with label

'use client';

import { useMemo } from 'react';
import MaterialIcon from './MaterialIcon';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';
import { isBuilderEditableVariable, numericBuilderValue, useBuilderStatInputs } from '@/hooks/useBuilderStatInputs';

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

  // Committed on blur only when changed there (see useBuilderStatInputs).
  const { texts: tempValues, setText, onFocus, takeEdit } = useBuilderStatInputs(stats, variables, '0');

  const handleBlur = (key: string) => {
    const edited = takeEdit(key);
    if (edited === null) return;
    const num = numericBuilderValue(edited, stats[key]);
    if (num !== null) onSave(key, num);
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
      <div className="chart-builder-card-body">
        <p className="chart-builder-card-id">{chart.chartId}</p>
        {variables.length === 0 ? (
          <p className="chart-builder-hint">No variables in formula (e.g. [varName]). Add variables in Report Builder.</p>
        ) : (
          <>
            {variables.map((key) => (
              <div key={key} className="chart-builder-variable-row">
                <div className="chart-builder-variable-meta">
                  {chart.elements[0]?.label && variables.length === 1 ? chart.elements[0].label : key}
                  <span className="chart-builder-registry-name">[{key}]</span>
                </div>
                <input
                  id={`kpi-${chart.chartId}-${key}`}
                  type="number"
                  value={tempValues[key] ?? '0'}
                  onChange={(e) => setText(key, e.target.value)}
                  onFocus={() => onFocus(key)}
                  onBlur={() => handleBlur(key)}
                  readOnly={!isBuilderEditableVariable(key)}
                  min="0"
                  step={variables.length > 1 ? 'any' : undefined}
                  className="form-input chart-builder-input"
                  placeholder="0"
                  aria-label={`Value for ${key}`}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
