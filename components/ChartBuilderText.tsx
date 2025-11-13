// WHAT: Chart Builder for TEXT charts - textarea with auto-save
// WHY: Allow inline text editing in Builder mode
// HOW: Use TextareaField component, extract stats key from formula

'use client';

import TextareaField from './TextareaField';

interface ChartBuilderTextProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

export default function ChartBuilderText({ chart, stats, onSave }: ChartBuilderTextProps) {
  // WHAT: Extract the variable key from formula (e.g., "stats.reportText5" → "reportText5")
  // WHY: Need to know which stats field to read/write
  const formula = chart.elements[0]?.formula || '';
  const statsKey = formula.replace(/^stats\./, '').trim();
  const currentText = stats[statsKey] || '';
  
  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '2px solid #06b6d4',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Chart title with icon */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {chart.icon && <span style={{ fontSize: '1.25rem' }}>{chart.icon}</span>}
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          {chart.title}
        </h3>
      </div>
      
      {/* Textarea field */}
      <TextareaField
        label=""
        value={currentText}
        onSave={(text) => onSave(statsKey, text)}
        rows={4}
      />
      
      {/* Variable hint */}
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
        Variable: {statsKey}
      </p>
    </div>
  );
}
