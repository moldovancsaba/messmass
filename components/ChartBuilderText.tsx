// WHAT: Chart Builder for TEXT charts - textarea with markdown preview
// WHY: Allow inline text editing with rich formatting preview in Builder mode
// HOW: TextareaField for editing, markdown preview toggle, reuse existing components

'use client';

import { useState } from 'react';
import TextareaField from './TextareaField';
import { parseMarkdown, getMarkdownHint, isMarkdown } from '@/lib/markdownUtils';
import { sanitizeHTML } from '@/lib/sanitize';

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
  
  // WHAT: Preview mode state (edit vs preview)
  // WHY: Let users see formatted markdown output before saving
  const [isPreview, setIsPreview] = useState(false);
  
  // WHAT: Check if text contains markdown syntax
  // WHY: Only show preview toggle if markdown is detected
  const hasMarkdown = isMarkdown(currentText);
  
  return (
    <div className="chart-builder-text">
      {/* Chart title with icon and preview toggle */}
      <div className="chart-builder-header">
        <div className="chart-builder-title-row">
          {chart.icon && <span className="chart-builder-icon">{chart.icon}</span>}
          <h3 className="chart-builder-title">
            {chart.title}
          </h3>
        </div>
        
        {/* WHAT: Preview toggle button (only show if markdown detected) */}
        {/* WHY: Allow users to see formatted output */}
        {currentText && (
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="chart-builder-toggle"
            title={isPreview ? 'Edit markdown' : 'Preview formatted text'}
          >
            {isPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        )}
      </div>
      
      {/* WHAT: Show either textarea (edit mode) or preview (preview mode) */}
      {isPreview ? (
        <div className="chart-builder-preview">
          {/* WHAT: Render markdown preview with same styles as TextChart */}
          {/* WHY: Show users how text will appear in final report */}
          {/* SECURITY: Sanitize HTML to prevent XSS in preview */}
          <div 
            className="chart-builder-preview-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(parseMarkdown(currentText)) }}
          />
        </div>
      ) : (
        <>
          {/* Textarea field for editing */}
          <TextareaField
            label=""
            value={currentText}
            onSave={(text) => onSave(statsKey, text)}
            rows={8}
            placeholder="Enter text... (markdown supported: # H1, ## H2, **bold**, *italic*, - lists, > quotes, ```code```, `inline code`, ~~strikethrough~~, ---)"
          />
          
          {/* WHAT: Markdown syntax hint */}
          {/* WHY: Guide users on formatting options */}
          <p className="chart-builder-hint" style={{ marginTop: '0.5rem' }}>
            {getMarkdownHint()}
          </p>
        </>
      )}
      
      {/* Variable hint */}
      <p className="chart-builder-hint" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--mm-gray-500)' }}>
        Variable: {statsKey}
      </p>
    </div>
  );
}
