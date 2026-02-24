// WHAT: Chart Builder for Value Chain charts - variable inputs from element formulas
// WHY: Value chain has 2 elements (title + description); each formula can reference multiple variables
// HOW: Extract all [varName] from all elements' formulas, dedupe, show one input per variable

'use client';

import { useState, useEffect, useMemo } from 'react';
import { extractVariablesFromFormula } from '@/lib/formulaEngine';
import MaterialIcon from './MaterialIcon';

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
  const variables = useMemo(
    () => getStatsVariablesFromElements(chart.elements || []),
    [chart.chartId, chart.elements?.map((e) => e.formula).join('|') ?? '']
  );

  const [tempValues, setTempValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variables.forEach((key) => {
      const val = stats[key];
      initial[key] = val !== undefined && val !== null ? String(val) : '';
    });
    return initial;
  });

  useEffect(() => {
    const next: Record<string, string> = {};
    variables.forEach((key) => {
      const val = stats[key];
      next[key] = val !== undefined && val !== null ? String(val) : '';
    });
    setTempValues((prev) => ({ ...prev, ...next }));
  }, [stats, chart.chartId, variables]);

  const handleBlur = (key: string, isText: boolean) => {
    const raw = tempValues[key] ?? '';
    if (isText) {
      if (raw !== (stats[key] ?? '')) onSave(key, raw);
      return;
    }
    const num = raw === '' ? 0 : (parseFloat(raw) || 0);
    const current = stats[key];
    const currentNum = typeof current === 'number' ? current : parseFloat(String(current));
    if (Number.isNaN(currentNum) || num !== currentNum) onSave(key, num);
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
        <p className="chart-builder-hint">No variables in formulas (e.g. [varName]). Add variables in Visualization Manager.</p>
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
      <div className="chart-builder-inputs">
        {variables.map((key) => {
          const isText = isTextVariable(key);
          return (
            <div key={key} className="chart-builder-bar-row">
              <label className="chart-builder-bar-label">[{key}]</label>
              {isText ? (
                <input
                  type="text"
                  value={tempValues[key] ?? ''}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  onBlur={() => handleBlur(key, true)}
                  className="form-input chart-builder-bar-input"
                  placeholder={key}
                />
              ) : (
                <input
                  type="number"
                  value={tempValues[key] ?? ''}
                  onChange={(e) => setTempValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  onBlur={() => handleBlur(key, false)}
                  min="0"
                  step="any"
                  className="form-input chart-builder-bar-input"
                  placeholder="0"
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="chart-builder-hint">Variables used in this block’s formulas. Values feed the report.</p>
    </div>
  );
}
