// WHAT: Chart Builder for IMAGE charts - image uploader with preview and delete
// WHY: Allow inline image uploads in Builder mode
// HOW: Use existing ImageUploader component, extract stats key from formula

'use client';

import ImageUploader from './ImageUploader';
import MaterialIcon from './MaterialIcon';

function formulaToStatsKey(formula: string): string {
  const t = (formula || '').trim();
  const m = t.match(/^\[([^\]]+)\]$/);
  return m ? m[1] : t.replace(/^stats\./, '').trim();
}

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
  const statsKey = formulaToStatsKey(chart.elements[0]?.formula || '');
  const currentImageUrl = (stats[statsKey] ?? '') as string;
  
  return (
    <div className="chart-builder-image">
      <div className="chart-builder-header">
        <div className="chart-builder-title-row">
          {chart.icon && (
            <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
          )}
          <h3 className="chart-builder-title">{chart.title}</h3>
        </div>
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
