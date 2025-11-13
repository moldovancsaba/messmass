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
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '2px solid #8b5cf6',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Chart title with icon */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {chart.icon && <span style={{ fontSize: '1.25rem' }}>{chart.icon}</span>}
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
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
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
        Variable: {statsKey}
      </p>
    </div>
  );
}
