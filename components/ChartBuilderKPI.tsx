// WHAT: Chart Builder for KPI charts - single numeric input
// WHY: Allow inline editing of KPI values in Builder mode
// HOW: Extract formula from chart config, resolve to stats key, provide input with auto-save

'use client';

import { useState, useEffect } from 'react';

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

export default function ChartBuilderKPI({ chart, stats, onSave }: ChartBuilderKPIProps) {
  // WHAT: Extract the variable key from formula (e.g., "stats.remoteImages" → "remoteImages")
  // WHY: Need to know which stats field to read/write
  const formula = chart.elements[0]?.formula || '';
  const statsKey = formula.replace(/^stats\./, '').trim();
  const currentValue = stats[statsKey] || 0;
  
  // WHAT: Store as string to allow deletion without aggressive parsing
  // WHY: Prevents resetting empty string to 0 immediately on keystroke
  const [tempValue, setTempValue] = useState<string>(currentValue.toString());
  
  // WHAT: Sync temp value when stats change externally
  useEffect(() => {
    setTempValue(currentValue.toString());
  }, [currentValue]);
  
  // WHAT: Save on blur with validation
  // WHY: Auto-save behavior consistent with Manual mode
  const handleBlur = () => {
    const newValue = Math.max(0, parseInt(tempValue) || 0);
    if (newValue !== currentValue) {
      onSave(statsKey, newValue);
    }
  };
  
  return (
    <div className="chart-builder-kpi">
      {/* Chart title with icon */}
      <div className="chart-builder-header">
        {chart.icon && <span className="chart-builder-icon">{chart.icon}</span>}
        <h3 className="chart-builder-title">
          {chart.title}
        </h3>
      </div>
      
      {/* Single input field */}
      <div className="chart-builder-field">
        <label className="chart-builder-label">
          {chart.elements[0]?.label || 'Value'}
        </label>
        <input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          min="0"
          className="form-input chart-builder-input"
        />
      </div>
      
      {/* Formula hint */}
      <p className="chart-builder-hint">
        Variable: {statsKey}
      </p>
    </div>
  );
}
