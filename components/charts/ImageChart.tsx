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
  // WHAT: Full-bleed cover image filling entire block
  // WHY: User wants image to fill grid block completely, no nested divs
  // HOW: Render img directly in container with object-fit cover
  return (
    <div className={`image-chart-container ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="image-chart-img"
        />
      ) : (
        <div className="image-chart-placeholder">
          <p>No image available</p>
        </div>
      )}
    </div>
  );
}
