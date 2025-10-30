// components/charts/ImageChart.tsx
// WHAT: Display images from reportImage* variables as full-width responsive images
// WHY: Partner reports need visual content display with no text overlay
// HOW: Renders img tags with object-fit cover for consistent presentation + lightbox on click

'use client';

import React, { useState } from 'react';
import ImageLightbox from '@/components/ImageLightbox';

export interface ImageChartProps {
  title: string;
  imageUrl: string;
  subtitle?: string;
  className?: string;
}

export default function ImageChart({ title, imageUrl, subtitle, className = '' }: ImageChartProps) {
  /* WHAT: Lightbox state for full-page image preview
     WHY: Allow users to view images in full detail */
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  /* WHAT: Open lightbox on image click
     WHY: Provide better viewing experience for image content */
  const handleImageClick = () => {
    if (imageUrl) {
      setIsLightboxOpen(true);
    }
  };
  
  // WHAT: Full-bleed cover image filling entire block with click-to-expand
  // WHY: User wants image to fill grid block completely, clickable for full view
  // HOW: Render img directly in container with object-fit cover + lightbox integration
  return (
    <>
      <div className={`image-chart-container ${className}`}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="image-chart-img"
            onClick={handleImageClick}
            style={{ cursor: 'pointer' }}
            title="Click to view full size"
          />
        ) : (
          <div className="image-chart-placeholder">
            <p>No image available</p>
          </div>
        )}
      </div>
      
      {/* WHAT: Lightbox for full-page image preview
          WHY: Show image in full detail when clicked */}
      {imageUrl && (
        <ImageLightbox
          imageUrl={imageUrl}
          alt={title}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}
