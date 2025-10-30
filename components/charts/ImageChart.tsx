// components/charts/ImageChart.tsx
// WHAT: Display images from reportImage* variables as full-width responsive images
// WHY: Partner reports need visual content display with no text overlay
// HOW: Renders img tags with object-fit cover for consistent presentation

'use client';

import React from 'react';
import Image from 'next/image';

export interface ImageChartProps {
  title: string;
  imageUrl: string;
  subtitle?: string;
  className?: string;
}

export default function ImageChart({ title, imageUrl, subtitle, className = '' }: ImageChartProps) {
  // WHAT: Pure cover image with no title/header
  // WHY: User wants full-bleed image display without any text overlay or headers
  // HOW: Render image directly in container, no header section
  return (
    <div className={`image-chart-container ${className}`}>
      {imageUrl ? (
        <div className="image-chart-wrapper">
          {/* WHAT: Use regular img tag for external ImgBB URLs
              WHY: Next.js Image requires domain configuration for external URLs
              HOW: Apply object-fit and responsive sizing via CSS */}
          <img 
            src={imageUrl} 
            alt={title}
            className="image-chart-img"
          />
        </div>
      ) : (
        <div className="image-chart-placeholder">
          <p>No image available</p>
        </div>
      )}
    </div>
  );
}
