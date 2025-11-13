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
  
  const [tempValue, setTempValue] = useState<number>(currentValue);
  
  // WHAT: Sync temp value when stats change externally
  useEffect(() => {
    setTempValue(currentValue);
  }, [currentValue]);
  
  // WHAT: Save on blur with validation
  // WHY: Auto-save behavior consistent with Manual mode
  const handleBlur = () => {
    const newValue = Math.max(0, parseInt(tempValue.toString()) || 0);
    if (newValue !== currentValue) {
      onSave(statsKey, newValue);
    }
  };
  
  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '2px solid #3b82f6',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Chart title with icon */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {chart.icon && <span style={{ fontSize: '1.25rem' }}>{chart.icon}</span>}
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          {chart.title}
        </h3>
      </div>
      
      {/* Single input field */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '0.875rem', 
          color: '#6b7280',
          marginBottom: '0.5rem'
        }}>
          {chart.elements[0]?.label || 'Value'}
        </label>
        <input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(Math.max(0, parseInt(e.target.value) || 0))}
          onBlur={handleBlur}
          min="0"
          className="form-input"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            textAlign: 'center'
          }}
        />
      </div>
      
      {/* Formula hint */}
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
        Variable: {statsKey}
      </p>
    </div>
  );
}
