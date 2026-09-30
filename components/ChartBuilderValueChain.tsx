// WHAT: Chart Builder for Value Chain charts - variable inputs from element formulas
// WHY: Value chain has 2 elements (title + description); each formula can reference multiple variables
// HOW: Extract all [varName] from all elements' formulas, dedupe, show one input per variable

'use client';

import { useMemo } from 'react';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';
import MaterialIcon from './MaterialIcon';
import { isBuilderEditableVariable, numericBuilderValue, useBuilderStatInputs } from '@/hooks/useBuilderStatInputs';

interface ChartBuilderValueChainProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string; label?: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

// WHAT: Variables that reference text/media slots - use text input
// WHY: reportTextN and reportImageN hold strings; other vars are typically numeric
function isTextVariable(name: string): boolean {
  return /^report(Text|Image)\d*$/i.test(name) || name.startsWith('reportText') || name.startsWith('reportImage');
}

// WHAT: Collect unique stats variable names from all element formulas
// WHY: PARAM/MANUAL/MEDIA/TEXT tokens are not stored in stats; only show inputs for stats keys
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

export default function ChartBuilderValueChain({ chart, stats, onSave }: ChartBuilderValueChainProps) {
  const elementsKey = chart.elements?.map((e) => e.formula).join('|') ?? '';
  const variables = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.elements]
  );

  // Committed on blur only when changed there (see useBuilderStatInputs).
  const { texts: tempValues, setText, onFocus, takeEdit } = useBuilderStatInputs(stats, variables, '');

  const handleBlur = (key: string, isText: boolean) => {
    const edited = takeEdit(key);
    if (edited === null) return;
    if (isText) {
      if (edited !== (stats[key] ?? '')) onSave(key, edited);
      return;
    }
    const num = numericBuilderValue(edited, stats[key], true);
    if (num !== null) onSave(key, num);
  };

  if (variables.length === 0) {
    return (
      <div className="chart-builder-valuechain">
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
          <p className="chart-builder-hint">No variables in formulas (e.g. [varName]). Add variables in Report Builder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-builder-valuechain">
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
          {variables.map((key) => {
            const isText = isTextVariable(key);
            return (
              <div key={key} className="chart-builder-variable-row">
                <div className="chart-builder-variable-meta">
                  {key}
                  <span className="chart-builder-registry-name">[{key}]</span>
                </div>
                {isText ? (
                  <input
                    type="text"
                    value={tempValues[key] ?? ''}
                    onChange={(e) => setText(key, e.target.value)}
                    onFocus={() => onFocus(key)}
                    onBlur={() => handleBlur(key, true)}
                    readOnly={!isBuilderEditableVariable(key)}
                    className="form-input chart-builder-input"
                    placeholder={key}
                    aria-label={key}
                  />
                ) : (
                  <input
                    type="number"
                    value={tempValues[key] ?? ''}
                    onChange={(e) => setText(key, e.target.value)}
                    onFocus={() => onFocus(key)}
                    onBlur={() => handleBlur(key, false)}
                    readOnly={!isBuilderEditableVariable(key)}
                    min="0"
                    step="any"
                    className="form-input chart-builder-input"
                    placeholder="0"
                    aria-label={key}
                  />
                )}
              </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
