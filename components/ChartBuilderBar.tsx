// WHAT: Chart Builder for BAR charts - 5 numeric inputs with labels
// WHY: Allow inline editing of bar chart segments in Builder mode
// HOW: Render 5 inputs based on chart elements, extract stats keys, auto-save on blur

'use client';

import { useState, useEffect } from 'react';

interface ChartBuilderBarProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string; label?: string; color?: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

export default function ChartBuilderBar({ chart, stats, onSave }: ChartBuilderBarProps) {
  // WHAT: Parse all elements (max 5 for bar charts)
  const elements = chart.elements.slice(0, 5);
  
  // WHAT: State for each input field
  const [tempValues, setTempValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    elements.forEach((el) => {
      const statsKey = el.formula.replace(/^stats\./, '').trim();
      initial[statsKey] = stats[statsKey] || 0;
    });
    return initial;
  });
  
  // WHAT: Sync temp values when stats change externally
  useEffect(() => {
    const updated: Record<string, number> = {};
    elements.forEach((el) => {
      const statsKey = el.formula.replace(/^stats\./, '').trim();
      updated[statsKey] = stats[statsKey] || 0;
    });
    setTempValues(updated);
  }, [stats, elements]);
  
  // WHAT: Save individual field on blur
  const handleBlur = (statsKey: string) => {
    const newValue = Math.max(0, parseInt(tempValues[statsKey]?.toString() || '0') || 0);
    const currentValue = stats[statsKey] || 0;
    if (newValue !== currentValue) {
      onSave(statsKey, newValue);
    }
  };
  
  return (
    <div className="chart-builder-bar">
      {/* Chart title with icon */}
      <div className="chart-builder-header">
        {chart.icon && <span className="chart-builder-icon">{chart.icon}</span>}
        <h3 className="chart-builder-title">
          {chart.title}
        </h3>
      </div>
      
      {/* Input fields for each bar segment */}
      <div className="chart-builder-inputs">
        {elements.map((el, idx) => {
          const statsKey = el.formula.replace(/^stats\./, '').trim();
          
          return (
            <div key={idx} className="chart-builder-bar-row">
              {/* Color indicator */}
              {el.color && (
                <div 
                  className="chart-builder-color-dot"
                  // WHAT: Dynamic color indicator from chart element color
                  // WHY: Bar chart segments have unique colors defined in chart config
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ backgroundColor: el.color }}
                />
              )}
              
              {/* Input field */}
              <input
                type="number"
                value={tempValues[statsKey] ?? 0}
                onChange={(e) => setTempValues(prev => ({
                  ...prev,
                  [statsKey]: Math.max(0, parseInt(e.target.value) || 0)
                }))}
                onBlur={() => handleBlur(statsKey)}
                min="0"
                className="form-input chart-builder-bar-input"
              />
              
              {/* Label */}
              <label className="chart-builder-bar-label">
                {el.label || statsKey}
              </label>
            </div>
          );
        })}
      </div>
      
      {/* Chart type hint */}
      <p className="chart-builder-hint">
        Bar Chart • {elements.length} segments
      </p>
    </div>
  );
}
