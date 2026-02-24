// WHAT: Chart Builder for TABLE charts - textarea with markdown table preview
// WHY: Allow inline table editing with markdown table preview in Builder mode
// HOW: TextareaField for editing, markdown table preview toggle, reuse existing components

'use client';

import { useState } from 'react';
import TextareaField from './TextareaField';
import MaterialIcon from './MaterialIcon';
import { parseTableMarkdown } from '@/lib/tableMarkdownUtils';
import { sanitizeHTML } from '@/lib/sanitize';

function formulaToStatsKey(formula: string): string {
  const t = (formula || '').trim();
  const m = t.match(/^\[([^\]]+)\]$/);
  return m ? m[1] : t.replace(/^stats\./, '').trim();
}

interface ChartBuilderTableProps {
  chart: {
    chartId: string;
    title: string;
    icon?: string;
    elements: Array<{ formula: string }>;
  };
  stats: Record<string, any>;
  onSave: (key: string, value: number | string) => void;
}

export default function ChartBuilderTable({ chart, stats, onSave }: ChartBuilderTableProps) {
  // WHAT: Extract the variable key from formula (e.g., "stats.reportTable1" → "reportTable1")
  // WHY: Need to know which stats field to read/write
  const statsKey = formulaToStatsKey(chart.elements[0]?.formula || '');
  const currentTable = (stats[statsKey] ?? '') as string;
  
  // WHAT: Preview mode state (edit vs preview)
  // WHY: Let users see formatted markdown table output before saving
  const [isPreview, setIsPreview] = useState(false);
  
  return (
    <div className="chart-builder-table">
      {/* Chart title with icon and preview toggle */}
      <div className="chart-builder-header">
        <div className="chart-builder-title-row">
          {chart.icon && (
            <MaterialIcon name={chart.icon} variant="outlined" className="chart-builder-icon" />
          )}
          <h3 className="chart-builder-title">
            {chart.title}
          </h3>
        </div>
        
        {/* WHAT: Preview toggle button */}
        {/* WHY: Allow users to see formatted table output */}
        {currentTable && (
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="chart-builder-toggle"
            title={isPreview ? 'Edit markdown' : 'Preview formatted table'}
          >
            {isPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        )}
      </div>
      
      {/* WHAT: Show either textarea (edit mode) or preview (preview mode) */}
      {isPreview ? (
        <div className="chart-builder-preview">
          {/* WHAT: Render markdown table preview with same styles as TableChart */}
          {/* WHY: Show users how table will appear in final report */}
          <div 
            className="chart-builder-preview-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(parseTableMarkdown(currentTable)) }}
          />
        </div>
      ) : (
        <>
          {/* Textarea field for editing markdown table */}
          <TextareaField
            label=""
            value={currentTable}
            onSave={(table) => onSave(statsKey, table)}
            rows={12}
            placeholder="Paste markdown table here...&#10;&#10;Example:&#10;| Header 1 | Header 2 | Header 3 |&#10;|---------|---------|---------|&#10;| Cell 1  | Cell 2  | Cell 3  |&#10;| Cell 4  | Cell 5  | Cell 6  |"
          />
          
          {/* WHAT: Markdown table syntax hint */}
          {/* WHY: Guide users on table formatting */}
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <p className="chart-builder-hint" style={{ marginTop: '0.5rem' }}>
            💡 Markdown table syntax: Use pipes (|) to separate columns, dashes (---) for header separator
          </p>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <p className="chart-builder-hint" style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
            Alignment: Use :--- for left, ---: for right, :---: for center alignment
          </p>
        </>
      )}
      
      {/* Variable hint */}
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <p className="chart-builder-hint" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--mm-gray-500)' }}>
        Variable: {statsKey}
      </p>
    </div>
  );
}

