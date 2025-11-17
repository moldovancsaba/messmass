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
    <div className="chart-builder-text">
      {/* Chart title with icon */}
      <div className="chart-builder-header">
        {chart.icon && <span className="chart-builder-icon">{chart.icon}</span>}
        <h3 className="chart-builder-title">
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
      <p className="chart-builder-hint">
        Variable: {statsKey}
      </p>
    </div>
  );
}
