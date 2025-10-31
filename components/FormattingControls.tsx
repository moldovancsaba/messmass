// components/FormattingControls.tsx - Centralized formatting controls component
// WHAT: Reusable component for chart formatting with row-by-row layout
// WHY: Single source of truth for formatting UI across all chart types
// HOW: Checkbox + input field on same row, predictive dropdowns for prefix/suffix

'use client';

import React from 'react';
import PredictiveFormattingInput from './PredictiveFormattingInput';

interface ChartValueFormatting {
  rounded: boolean;
  prefix?: string;
  suffix?: string;
}

interface FormattingControlsProps {
  formatting: ChartValueFormatting;
  onChange: (formatting: ChartValueFormatting) => void;
  availablePrefixes: string[];
  availableSuffixes: string[];
  defaultPrefix?: string;
  defaultSuffix?: string;
  title?: string;
}

/**
 * WHAT: Centralized formatting controls with row-by-row layout
 * WHY: Consistent UI across KPI, PIE, BAR, VALUE chart types
 * HOW: 3 rows - rounded checkbox, prefix checkbox+input, suffix checkbox+input
 */
export default function FormattingControls({
  formatting,
  onChange,
  availablePrefixes,
  availableSuffixes,
  defaultPrefix = '€',
  defaultSuffix = '%',
  title
}: FormattingControlsProps) {
  
  return (
    <div className="formatting-group">
      {title && <h5 className="formatting-group-title">{title}</h5>}
      <div className="formatting-controls">
        {/* ROW 1: Rounded */}
        <div className="formatting-row">
          <label className="formatting-checkbox">
            <input
              type="checkbox"
              checked={formatting.rounded ?? true}
              onChange={(e) => onChange({
                ...formatting,
                rounded: e.target.checked
              })}
            />
            <span>Rounded (whole numbers)</span>
          </label>
        </div>
        
        {/* ROW 2: Show Prefix + Input Field */}
        <div className="formatting-row">
          <label className="formatting-checkbox">
            <input
              type="checkbox"
              checked={!!formatting.prefix}
              onChange={(e) => onChange({
                ...formatting,
                rounded: formatting.rounded ?? true,
                prefix: e.target.checked ? defaultPrefix : '',
                suffix: formatting.suffix || ''
              })}
            />
            <span>Show Prefix</span>
          </label>
          {formatting.prefix !== undefined && formatting.prefix !== '' && (
            <PredictiveFormattingInput
              value={formatting.prefix || ''}
              onChange={(value) => onChange({
                ...formatting,
                rounded: formatting.rounded ?? true,
                prefix: value,
                suffix: formatting.suffix || ''
              })}
              options={availablePrefixes}
              placeholder="Select or type prefix"
              label=""
            />
          )}
        </div>
        
        {/* ROW 3: Show Suffix + Input Field */}
        <div className="formatting-row">
          <label className="formatting-checkbox">
            <input
              type="checkbox"
              checked={!!formatting.suffix}
              onChange={(e) => onChange({
                ...formatting,
                rounded: formatting.rounded ?? true,
                prefix: formatting.prefix || '',
                suffix: e.target.checked ? defaultSuffix : ''
              })}
            />
            <span>Show Suffix</span>
          </label>
          {formatting.suffix !== undefined && formatting.suffix !== '' && (
            <PredictiveFormattingInput
              value={formatting.suffix || ''}
              onChange={(value) => onChange({
                ...formatting,
                rounded: formatting.rounded ?? true,
                prefix: formatting.prefix || '',
                suffix: value
              })}
              options={availableSuffixes}
              placeholder="Select or type suffix"
              label=""
            />
          )}
        </div>
      </div>
      
      <style jsx>{`
        .formatting-group {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .formatting-group:last-child {
          margin-bottom: 0;
        }
        
        .formatting-group-title {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          text-transform: uppercase;
        }
        
        .formatting-controls {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        
        /* WHAT: Row-by-row layout for formatting controls */
        /* WHY: Each checkbox with its input field on the same row */
        .formatting-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        
        .formatting-row:last-child {
          margin-bottom: 0;
        }
        
        .formatting-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          min-width: 200px;
        }
        
        .formatting-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .formatting-checkbox span {
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
