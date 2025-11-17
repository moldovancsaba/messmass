// WHAT: Chart Builder for PIE charts - 2 numeric inputs with labels and colors
// WHY: Allow inline editing of pie chart segments in Builder mode
// HOW: Render 2 inputs based on chart elements, extract stats keys, auto-save on blur

'use client';

import { useState, useEffect } from 'react';

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

export default function ChartBuilderPie({ chart, stats, onSave }: ChartBuilderPieProps) {
  // WHAT: Parse elements (exactly 2 for pie charts)
  const elements = chart.elements.slice(0, 2);
  
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
  
  // WHAT: Calculate percentages for visual feedback
  const total = Object.values(tempValues).reduce((sum, val) => sum + (val || 0), 0);
  const percentages = Object.entries(tempValues).reduce((acc, [key, val]) => {
    acc[key] = total > 0 ? Math.round((val / total) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="chart-builder-pie">
      {/* Chart title with icon */}
      <div className="chart-builder-header">
        {chart.icon && <span className="chart-builder-icon">{chart.icon}</span>}
        <h3 className="chart-builder-title">
          {chart.title}
        </h3>
      </div>
      
      {/* Input fields for each pie segment */}
      <div className="chart-builder-inputs">
        {elements.map((el, idx) => {
          const statsKey = el.formula.replace(/^stats\./, '').trim();
          const percentage = percentages[statsKey] || 0;
          
          return (
            <div key={idx} className="chart-builder-field" style={{ 
              padding: 'var(--mm-space-3)',
              backgroundColor: 'var(--mm-gray-50)',
              borderRadius: 'var(--mm-radius-md)'
            }}>
              {/* Label with color indicator */}
              <div className="chart-builder-bar-row">
                {el.color && (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: el.color,
                    flexShrink: 0
                  }} />
                )}
                <label className="chart-builder-bar-label">
                  {el.label || statsKey}
                </label>
                <span style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-400)', fontWeight: 'var(--mm-font-weight-semibold)' }}>
                  {percentage}%
                </span>
              </div>
              
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
                className="form-input chart-builder-input"
              />
            </div>
          );
        })}
      </div>
      
      {/* Total display */}
      <div className="chart-builder-pie-total" style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          Total
        </span>
        <span style={{ fontSize: 'var(--mm-font-size-base)', fontWeight: 'var(--mm-font-weight-bold)' }}>
          {total}
        </span>
      </div>
      
      {/* Chart type hint */}
      <p className="chart-builder-hint">
        Pie Chart • {elements.length} segments
      </p>
    </div>
  );
}
