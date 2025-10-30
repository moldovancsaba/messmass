/* WHAT: Display images from reportImage* variables as full-width responsive images
 * WHY: Partner reports need visual content display with no text overlay
 * HOW: Renders img tags with object-fit cover for consistent presentation + lightbox on click
 * CRITICAL: NO inline styles - all styling via CSS module per coding standards */

'use client';

import React, { useState } from 'react';
import ImageLightbox from '@/components/ImageLightbox';
import styles from './ImageChart.module.css';

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
  
  /* WHAT: Full-bleed cover image filling entire block with click-to-expand
     WHY: User wants image to fill grid block completely, clickable for full view
     HOW: CSS module for all styles, no inline style props
     NOTE: Uses both module class and global class for UnifiedDataVisualization compatibility */
  return (
    <>
      <div className={`${styles.container} image-chart-container ${className}`}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className={styles.image}
            onClick={handleImageClick}
            title="Click to view full size"
          />
        ) : (
          <div className={styles.placeholder}>
            <p>No image available</p>
          </div>
        )}
      </div>
      
      {/* WHAT: Lightbox for full-page image preview using React Portal
          WHY: Portal renders at document.body to escape parent container interference
          HOW: CSS-only flexbox centering prevents flickering */}
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
