// WHAT: Chart Builder for IMAGE charts - image uploader with preview and delete
// WHY: Allow inline image uploads in Builder mode
// HOW: Use existing ImageUploader component, extract stats key from formula

'use client';

import ImageUploader from './ImageUploader';

interface ChartBuilderImageProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string; imageUrl?: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

export default function ChartBuilderImage({ chart, stats, onSave }: ChartBuilderImageProps) {
  // WHAT: Extract the variable key from formula (e.g., "stats.reportImage3" → "reportImage3")
  // WHY: Need to know which stats field to read/write
  const formula = chart.elements[0]?.formula || '';
  const statsKey = formula.replace(/^stats\./, '').trim();
  const currentImageUrl = stats[statsKey] || '';
  
  return (
    <div className="chart-builder-image">
      {/* Chart title with icon */}
      <div className="chart-builder-header">
        {chart.icon && <span className="chart-builder-icon">{chart.icon}</span>}
        <h3 className="chart-builder-title">
          {chart.title}
        </h3>
      </div>
      
      {/* Image uploader */}
      <ImageUploader
        label=""
        value={currentImageUrl}
        onChange={(url) => onSave(statsKey, url || '')}
        maxSizeMB={10}
      />
      
      {/* Variable hint */}
      <p className="chart-builder-hint">
        Variable: {statsKey}
      </p>
    </div>
  );
}
