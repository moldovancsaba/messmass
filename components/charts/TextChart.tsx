// components/charts/TextChart.tsx
// WHAT: Display text content from reportText* variables in formatted blocks
// WHY: Partner reports need rich text display for event notes and summaries
// HOW: Renders text with consistent styling using centralized design tokens

'use client';

import React from 'react';

export interface TextChartProps {
  title: string;
  content: string;
  subtitle?: string;
  className?: string;
}

export default function TextChart({ title, content, subtitle, className = '' }: TextChartProps) {
  return (
    <div className={`text-chart-container ${className}`}>
      <div className="text-chart-header">
        <h3 className="text-chart-title">{title}</h3>
        {subtitle && <p className="text-chart-subtitle">{subtitle}</p>}
      </div>
      
      <div className="text-chart-content">
        {content ? (
          <p className="text-chart-text">{content}</p>
        ) : (
          <p className="text-chart-placeholder">No content available</p>
        )}
      </div>
    </div>
  );
}
