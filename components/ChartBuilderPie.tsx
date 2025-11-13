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
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '2px solid #f59e0b',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Chart title with icon */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {chart.icon && <span style={{ fontSize: '1.25rem' }}>{chart.icon}</span>}
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          {chart.title}
        </h3>
      </div>
      
      {/* Input fields for each pie segment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {elements.map((el, idx) => {
          const statsKey = el.formula.replace(/^stats\./, '').trim();
          const percentage = percentages[statsKey] || 0;
          
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem'
            }}>
              {/* Label with color indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {el.color && (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: el.color,
                    flexShrink: 0
                  }} />
                )}
                <label style={{ 
                  fontSize: '0.875rem', 
                  color: '#4b5563',
                  fontWeight: '500',
                  flex: 1
                }}>
                  {el.label || statsKey}
                </label>
                <span style={{ fontSize: '0.875rem', color: '#9ca3af', fontWeight: '600' }}>
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
                className="form-input"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Total display */}
      <div style={{ 
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#fef3c7',
        borderRadius: '0.375rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '600' }}>
          Total
        </span>
        <span style={{ fontSize: '1rem', color: '#92400e', fontWeight: '700' }}>
          {total}
        </span>
      </div>
      
      {/* Chart type hint */}
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
        Pie Chart • {elements.length} segments
      </p>
    </div>
  );
}
