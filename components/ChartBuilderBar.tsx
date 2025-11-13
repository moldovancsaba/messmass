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
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '2px solid #10b981',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Chart title with icon */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {chart.icon && <span style={{ fontSize: '1.25rem' }}>{chart.icon}</span>}
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          {chart.title}
        </h3>
      </div>
      
      {/* Input fields for each bar segment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {elements.map((el, idx) => {
          const statsKey = el.formula.replace(/^stats\./, '').trim();
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Color indicator */}
              {el.color && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: el.color,
                  flexShrink: 0
                }} />
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
                className="form-input"
                style={{
                  width: '100px',
                  padding: '0.5rem',
                  textAlign: 'center',
                  flexShrink: 0
                }}
              />
              
              {/* Label */}
              <label style={{ 
                fontSize: '0.875rem', 
                color: '#4b5563',
                flex: 1
              }}>
                {el.label || statsKey}
              </label>
            </div>
          );
        })}
      </div>
      
      {/* Chart type hint */}
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
        Bar Chart • {elements.length} segments
      </p>
    </div>
  );
}
